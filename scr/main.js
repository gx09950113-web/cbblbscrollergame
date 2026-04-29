import { CHARACTERS, GAME_SETTINGS } from './config.js';
import { Player } from './entities/player.js'; 
import { Background } from './background.js';
import { storage } from './storage.js';
import { Enemy } from './entities/enemy.js';
import { Token } from './entities/token.js';
import { UI } from './ui.js';
import { InputHandler } from './input.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 450;

let gameState = 'LOADING'; 
let timeLeft = GAME_SETTINGS.GAME_DURATION;
let totalTokens = 0;
let lastTime = 0;
let spawnTimer = 0;

let player = null;
let background = null;
let input = null;
let enemies = [];
let tokens = [];
let loadedCount = 0;
let totalToLoad = 0;
const assets = { images: {}, audio: {} };

function init() {
    storage.checkAndResetDaily(); 
    input = new InputHandler(canvas); 
    if (!storage.canPlayToday()) gameState = 'ALREADY_PLAYED';
    preloadResources();
}

function checkLoaded() {
    loadedCount++;
    if (loadedCount >= totalToLoad && gameState === 'LOADING') {
        gameState = 'MENU';
    }
}

function preloadResources() {
    const charNames = ['huaijing', 'quiqui', 'lingjun'];
    const states = ['stand', 'left', 'right'];
    const audioFiles = [
        { key: 'bgm', src: 'assets/audio/bgm_main.mp3', loop: true },
        { key: 'coin', src: 'assets/audio/sfx_coin.mp3', loop: false },
        { key: 'hit', src: 'assets/audio/sfx_hit.mp3', loop: false }
    ];

    totalToLoad = (charNames.length * states.length) + 1 + audioFiles.length;

    const bgImg = new Image();
    bgImg.src = 'assets/background.png';
    bgImg.onload = checkLoaded;
    bgImg.onerror = checkLoaded;
    background = new Background(canvas.width, canvas.height, bgImg);

    charNames.forEach(char => {
        states.forEach(state => {
            const key = `${char}_${state}`;
            const img = new Image();
            img.src = `assets/${char}/${key}.png`;
            img.onload = checkLoaded;
            img.onerror = checkLoaded;
            assets.images[key] = img;
        });
    });

    audioFiles.forEach(file => {
        const audio = new Audio();
        audio.src = file.src;
        audio.loop = file.loop;
        audio.volume = (file.key === 'bgm') ? 0.3 : 0.6; // 背景音量調小
        audio.oncanplaythrough = () => {
            if (!assets.audio[file.key]) {
                assets.audio[file.key] = audio;
                checkLoaded();
            }
        };
        audio.onerror = checkLoaded;
        audio.load();
    });

    requestAnimationFrame(gameLoop);
}

function gameLoop(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (gameState) {
        case 'LOADING':
            UI.drawText(ctx, `載入資源中... (${loadedCount}/${totalToLoad})`, 400, 225, "20px Arial", "white", "center");
            break;
        case 'MENU': UI.drawMenu(ctx, canvas.width, canvas.height); break;
        case 'PLAYING': update(deltaTime); drawGame(); break;
        case 'GAMEOVER': UI.drawGameOver(ctx, canvas.width, canvas.height, totalTokens); break;
        case 'ALREADY_PLAYED': UI.drawText(ctx, "今日已挑戰過", 400, 225, "24px Arial", "red", "center"); break;
    }
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    if (isNaN(deltaTime) || !player) return;

    timeLeft -= deltaTime / 1000;
    if (timeLeft <= 0) endGame();

    let isMoving = false;
    let moveSpeed = 0;

    // 手動移動控制
    if (input.isRight && player.x < canvas.width - player.width) {
        moveSpeed = player.speed;
        background.update(moveSpeed * 0.5); 
        isMoving = true;
    } else if (input.isLeft && player.x > 0) {
        moveSpeed = -player.speed;
        isMoving = true;
    }

    player.x += moveSpeed * 0.5;
    if (input.isJump) player.jump();

    // 攻擊與擊殺判定
    if (gameState === 'PLAYING' && input.isAttack) {
        const killedEnemy = player.performAttack(enemies);
        if (killedEnemy) {
            if (assets.audio.hit) {
                assets.audio.hit.currentTime = 0;
                assets.audio.hit.play().catch(()=>{});
            }
            // 擊殺後在怪物位置生成代幣
            const dropToken = new Token();
            dropToken.x = killedEnemy.x;
            dropToken.y = killedEnemy.y;
            tokens.push(dropToken);
        }
    }

    player.update(deltaTime, isMoving);

    // 計算相對捲動速度 (只有玩家向右走時，怪物與代幣才產生捲動位移)
    const scrollSpeed = (isMoving && input.isRight) ? player.speed : 0;

    // 怪物處理 (使用倒序迴圈以安全移除元素)
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update(deltaTime, scrollSpeed);

        // 如果怪物被標記為刪除 (被擊殺)，直接移除並不進行碰撞傷害判定
        if (enemy.markedForDeletion) {
            enemies.splice(i, 1);
            continue;
        }

        // 碰撞檢測
        if (player.checkCollision(enemy)) {
            player.hp -= enemy.damage;
            enemies.splice(i, 1);
            if (player.hp <= 0) endGame();
        }
    }

    // 代幣處理 (使用倒序迴圈)
    for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i];
        token.update(deltaTime, scrollSpeed);

        if (player.checkCollision(token)) {
            if (assets.audio.coin) {
                assets.audio.coin.currentTime = 0;
                assets.audio.coin.play().catch(()=>{});
            }
            totalTokens += token.value;
            tokens.splice(i, 1);
        } else if (token.markedForDeletion) {
            tokens.splice(i, 1);
        }
    }

    spawnTimer += deltaTime;
    if (spawnTimer > GAME_SETTINGS.SPAWN_INTERVAL) {
        if (Math.random() < GAME_SETTINGS.SPAWN_CHANCE.ENEMY) enemies.push(new Enemy());
        else if (Math.random() < GAME_SETTINGS.SPAWN_CHANCE.TOKEN) tokens.push(new Token());
        spawnTimer = 0;
    }
}

function drawGame() {
    background.draw(ctx);
    player.draw(ctx);
    enemies.forEach(e => e.draw(ctx));
    tokens.forEach(t => t.draw(ctx));
    UI.drawHUD(ctx, canvas.width, canvas.height, { timeLeft, tokens: totalTokens, player });
    UI.drawMobileControls(ctx, input.isTouchDevice); // 顯示行動端 UI
}

function selectCharacter(type) {
    gameState = 'PLAYING';
    player = new Player(type, assets.images, CHARACTERS[type]);
    if (assets.audio.bgm) assets.audio.bgm.play().catch(()=>{});
}

function endGame() {
    gameState = 'GAMEOVER';
    if (assets.audio.bgm) assets.audio.bgm.pause();
    storage.saveDailyResult(totalTokens); 
}

const handleMenuClick = (clientX, clientY) => {
    if (gameState !== 'MENU') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    if (y >= 180 && y <= 380) {
        if (x >= 120 && x <= 280) selectCharacter('huaijing');
        else if (x >= 320 && x <= 480) selectCharacter('quiqui');
        else if (x >= 520 && x <= 680) selectCharacter('lingjun');
    }
};

canvas.addEventListener('click', (e) => handleMenuClick(e.clientX, e.clientY));
canvas.addEventListener('touchstart', (e) => handleMenuClick(e.touches[0].clientX, e.touches[0].clientY));

init();

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

/**
 * 資源計數器：加入超時或錯誤容錯
 */
function checkLoaded() {
    loadedCount++;
    //console.log(`Loading progress: ${loadedCount}/${totalToLoad}`); // 調試用
    if (loadedCount >= totalToLoad && gameState === 'LOADING') {
        gameState = 'MENU';
    }
}

function preloadResources() {
    const charNames = ['huaijing', 'quiqui', 'lingjun'];
    const states = ['stand', 'left', 'right'];
    
    // 行動端若音效載入失敗，通常是因為沒 interaction
    const audioFiles = [
        { key: 'bgm', src: 'assets/audio/bgm_main.mp3', loop: true },
        { key: 'coin', src: 'assets/audio/sfx_coin.mp3', loop: false },
        { key: 'hit', src: 'assets/audio/sfx_hit.mp3', loop: false }
    ];

    totalToLoad = (charNames.length * states.length) + 1 + audioFiles.length;

    // 1. 背景圖
    const bgImg = new Image();
    bgImg.src = 'assets/background.png';
    bgImg.onload = checkLoaded;
    bgImg.onerror = checkLoaded; // 即使失敗也計數，防止卡死
    background = new Background(canvas.width, canvas.height, bgImg);

    // 2. 角色圖
    charNames.forEach(char => {
        states.forEach(state => {
            const key = `${char}_${state}`;
            const img = new Image();
            img.src = `assets/${char}/${key}.png`;
            img.onload = checkLoaded;
            img.onerror = checkLoaded; // 即使失敗也計數
            assets.images[key] = img;
        });
    });

    // 3. 音效 (行動端最容易卡在這裡)
    audioFiles.forEach(file => {
        const audio = new Audio();
        audio.src = file.src;
        audio.loop = file.loop;
        audio.volume = (file.key === 'bgm') ? 0.3 : 0.6;
        
        // 使用多種事件監聽，確保在行動端能觸發 checkLoaded
        audio.oncanplaythrough = () => {
            if (!assets.audio[file.key]) {
                assets.audio[file.key] = audio;
                checkLoaded();
            }
        };
        audio.onerror = () => {
            console.warn(`Audio ${file.key} load failed, skipping...`);
            checkLoaded(); 
        };
        
        // 強制載入
        audio.load();
    });

    // 啟動遊戲循環
    requestAnimationFrame(gameLoop);
}

function gameLoop(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (gameState) {
        case 'LOADING':
            UI.drawText(ctx, "載入資源中... (" + loadedCount + "/" + totalToLoad + ")", 400, 225, "20px Arial", "white", "center");
            break;
        case 'MENU':
            UI.drawMenu(ctx, canvas.width, canvas.height);
            break;
        case 'PLAYING':
            update(deltaTime);
            drawGame();
            break;
        case 'GAMEOVER':
            UI.drawGameOver(ctx, canvas.width, canvas.height, totalTokens);
            break;
        case 'ALREADY_PLAYED':
            UI.drawText(ctx, "今日已挑戰過", 400, 225, "24px Arial", "red", "center");
            break;
    }
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    if (isNaN(deltaTime) || !player) return;

    timeLeft -= deltaTime / 1000;
    if (timeLeft <= 0) endGame();

    let isMoving = false;
    let moveSpeed = 0;

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

    if (gameState === 'PLAYING' && input.isAttack) {
        const killedEnemy = player.performAttack(enemies);
        if (killedEnemy) {
            if (assets.audio.hit) {
                assets.audio.hit.currentTime = 0;
                assets.audio.hit.play().catch(()=>{});
            }
            const dropToken = new Token();
            dropToken.x = killedEnemy.x;
            dropToken.y = killedEnemy.y;
            tokens.push(dropToken);
        }
    }

    player.update(deltaTime, isMoving);

    const scrollSpeed = (isMoving && input.isRight) ? player.speed : 0;
    enemies.forEach(enemy => {
        enemy.update(deltaTime, scrollSpeed);
        if (player.checkCollision(enemy)) {
            player.hp -= enemy.damage;
            enemies.splice(enemies.indexOf(enemy), 1);
            if (player.hp <= 0) endGame();
        }
    });

    tokens.forEach(token => {
        token.update(deltaTime, scrollSpeed);
        if (player.checkCollision(token)) {
            if (assets.audio.coin) { assets.audio.coin.currentTime = 0; assets.audio.coin.play().catch(()=>{}); }
            totalTokens += token.value;
            tokens.splice(tokens.indexOf(token), 1);
        }
    });

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
    UI.drawMobileControls(ctx, input.isTouchDevice);
}

function selectCharacter(type) {
    gameState = 'PLAYING';
    player = new Player(type, assets.images, CHARACTERS[type]);
    
    // 關鍵：行動端必須在用戶點擊後才能播放音樂
    if (assets.audio.bgm) {
        assets.audio.bgm.play().catch(e => {
            console.log("Audio play blocked by browser policy.");
        });
    }
}

function endGame() {
    gameState = 'GAMEOVER';
    if (assets.audio.bgm) assets.audio.bgm.pause();
    storage.saveDailyResult(totalTokens); 
}

/**
 * 統一處理點擊與觸摸座標
 */
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
canvas.addEventListener('touchstart', (e) => {
    handleMenuClick(e.touches[0].clientX, e.touches[0].clientY);
});

init();

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
    input = new InputHandler(); 
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
    bgImg.onload = () => {
        background = new Background(canvas.width, canvas.height, bgImg);
        checkLoaded();
    };

    charNames.forEach(char => {
        states.forEach(state => {
            const key = `${char}_${state}`;
            const img = new Image();
            img.src = `assets/${char}/${key}.png`;
            img.onload = checkLoaded;
            assets.images[key] = img;
        });
    });

    audioFiles.forEach(file => {
        const audio = new Audio(file.src);
        audio.loop = file.loop;
        
        // --- 設定音量 ---
        if (file.key === 'bgm') audio.volume = 0.3; // 調小背景音樂
        else audio.volume = 0.6; // 其他音效音量
        
        audio.oncanplaythrough = checkLoaded;
        assets.audio[file.key] = audio;
    });

    requestAnimationFrame(gameLoop);
}

function gameLoop(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (gameState) {
        case 'MENU': UI.drawMenu(ctx, canvas.width, canvas.height); break;
        case 'PLAYING': update(deltaTime); drawGame(); break;
        case 'GAMEOVER': UI.drawGameOver(ctx, canvas.width, canvas.height, totalTokens); break;
        case 'LOADING': UI.drawText(ctx, "載入中...", 400, 225, "20px Arial", "white", "center"); break;
        case 'ALREADY_PLAYED': UI.drawText(ctx, "今日已挑戰過", 400, 225, "24px Arial", "red", "center"); break;
    }
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    if (isNaN(deltaTime) || !player) return;

    timeLeft -= deltaTime / 1000;
    if (timeLeft <= 0) endGame();

    let isMoving = false;
    if (input.isRight && player.x < canvas.width - player.width) {
        player.x += player.speed * 0.5; 
        background.update(player.speed); 
        isMoving = true;
    }
    if (input.isLeft && player.x > 0) {
        player.x -= player.speed * 0.5;
        isMoving = true;
    }

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

    const relativeSpeed = (isMoving && input.isRight) ? player.speed : 0;

    enemies.forEach((enemy, i) => {
        enemy.update(deltaTime, relativeSpeed);
        if (player.checkCollision(enemy)) {
            player.hp -= enemy.damage;
            enemies.splice(i, 1);
            if (player.hp <= 0) endGame();
        }
        if (enemy.markedForDeletion) enemies.splice(i, 1);
    });

    tokens.forEach((token, i) => {
        token.update(deltaTime, relativeSpeed);
        if (player.checkCollision(token)) {
            if (assets.audio.coin) { assets.audio.coin.currentTime = 0; assets.audio.coin.play().catch(()=>{}); }
            totalTokens += token.value;
            tokens.splice(i, 1);
        }
        if (token.markedForDeletion) tokens.splice(i, 1);
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

canvas.addEventListener('click', (e) => {
    if (gameState !== 'MENU') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (y >= 180 && y <= 380) {
        if (x >= 120 && x <= 280) selectCharacter('huaijing');
        else if (x >= 320 && x <= 480) selectCharacter('quiqui');
        else if (x >= 520 && x <= 680) selectCharacter('lingjun');
    }
});

init();

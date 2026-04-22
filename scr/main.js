/**
 * 遊戲主程式 - 負責邏輯調度與狀態管理
 */
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

// --- 遊戲狀態與數據 ---
let gameState = 'LOADING'; 
let timeLeft = GAME_SETTINGS.GAME_DURATION;
let totalTokens = 0;
let lastTime = 0;
let spawnTimer = 0;

// --- 實體與資源 ---
let player = null;
let background = null;
let input = null;
let enemies = [];
let tokens = [];
let loadedCount = 0;
let totalToLoad = 0;
const assets = { images: {}, audio: {} };

// --- 1. 遊戲初始化 ---
function init() {
    storage.checkAndResetDaily(); 
    input = new InputHandler(); 
    
    if (!storage.canPlayToday()) {
        gameState = 'ALREADY_PLAYED';
    }

    preloadResources();
}

// --- 2. 資源預載器 ---
function checkLoaded() {
    loadedCount++;
    if (loadedCount >= totalToLoad) {
        // 重要：只有在 LOADING 狀態時才切換到 MENU，防止遊戲中途被音效觸發重設
        if (gameState === 'LOADING') {
            gameState = 'MENU';
        }
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

    // 載入背景圖
    const bgImg = new Image();
    bgImg.src = 'assets/background.png';
    bgImg.onload = () => {
        background = new Background(canvas.width, canvas.height, bgImg);
        checkLoaded();
    };

    // 載入角色圖
    charNames.forEach(char => {
        states.forEach(state => {
            const key = `${char}_${state}`;
            const img = new Image();
            img.src = `assets/${char}/${key}.png`;
            img.onload = checkLoaded;
            assets.images[key] = img;
        });
    });

    // 載入音效
    audioFiles.forEach(file => {
        const audio = new Audio(file.src);
        audio.loop = file.loop;
        audio.oncanplaythrough = checkLoaded;
        assets.audio[file.key] = audio;
    });

    requestAnimationFrame(gameLoop);
}

// --- 3. 核心遊戲循環 ---
function gameLoop(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (gameState) {
        case 'LOADING':
            UI.drawText(ctx, "資源載入中...", canvas.width/2, canvas.height/2, "20px Arial", "white", "center");
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
            UI.drawText(ctx, "今日已挑戰過，請明日再戰！", canvas.width/2, canvas.height/2, "24px Arial", "red", "center");
            break;
    }
    requestAnimationFrame(gameLoop);
}

// --- 4. 邏輯更新 ---
function update(deltaTime) {
    if (isNaN(deltaTime) || !player) return;

    timeLeft -= deltaTime / 1000;
    if (timeLeft <= 0) {
        timeLeft = 0;
        endGame();
    }

    // 移動控制
    if (input.isRight && player.x < canvas.width - player.width) {
        player.x += player.speed * 0.5; 
    }
    if (input.isLeft && player.x > 0) {
        player.x -= player.speed * 0.5;
    }

    background.update(player.speed);
    player.update(deltaTime, true);

    // 生成
    spawnTimer += deltaTime;
    if (spawnTimer > GAME_SETTINGS.SPAWN_INTERVAL) {
        const roll = Math.random();
        if (roll < GAME_SETTINGS.SPAWN_CHANCE.ENEMY) {
            enemies.push(new Enemy());
        } else if (roll < GAME_SETTINGS.SPAWN_CHANCE.ENEMY + GAME_SETTINGS.SPAWN_CHANCE.TOKEN) {
            tokens.push(new Token());
        }
        spawnTimer = 0;
    }

    // 碰撞怪物
    enemies.forEach((enemy, i) => {
        enemy.update(deltaTime, player.speed);
        if (player.checkCollision(enemy)) {
            if (assets.audio.hit) {
                assets.audio.hit.currentTime = 0;
                assets.audio.hit.play().catch(() => {});
            }
            player.hp -= enemy.damage;
            enemies.splice(i, 1);
            if (player.hp <= 0) endGame();
        }
        if (enemy.markedForDeletion) enemies.splice(i, 1);
    });

    // 碰撞代幣
    tokens.forEach((token, i) => {
        token.update(deltaTime, player.speed);
        if (player.checkCollision(token)) {
            if (assets.audio.coin) {
                assets.audio.coin.currentTime = 0;
                assets.audio.coin.play().catch(() => {});
            }
            totalTokens += token.value;
            tokens.splice(i, 1);
        }
        if (token.markedForDeletion) tokens.splice(i, 1);
    });
}

// --- 5. 畫面繪製 ---
function drawGame() {
    if (!player) return;
    background.draw(ctx);
    player.draw(ctx);
    enemies.forEach(e => e.draw(ctx));
    tokens.forEach(t => t.draw(ctx));
    UI.drawHUD(ctx, canvas.width, canvas.height, {
        timeLeft: Math.floor(timeLeft),
        tokens: totalTokens,
        player: player
    });
}

// --- 6. 核心功能 ---
function selectCharacter(type) {
    // 立即變更狀態，防止點擊後因為資源加載回調又跳回 MENU
    gameState = 'PLAYING';
    player = new Player(type, assets.images, CHARACTERS[type]);
    
    if (assets.audio.bgm) {
        assets.audio.bgm.currentTime = 0;
        assets.audio.bgm.play().catch(e => console.log("音效受限"));
    }
}

function endGame() {
    gameState = 'GAMEOVER';
    if (assets.audio.bgm) assets.audio.bgm.pause();
    storage.saveDailyResult(totalTokens); 
}

// --- 7. 修正位移的事件監聽 ---
canvas.addEventListener('click', (e) => {
    if (gameState !== 'MENU') return;
    
    const rect = canvas.getBoundingClientRect();
    
    // 計算縮放比例：將視窗座標轉回 Canvas 內部的 800x450 座標
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // 判定區域 (對應 UI.js 中的 x: 120, 320, 520; y: 180~380)
    if (y >= 180 && y <= 380) {
        if (x >= 120 && x <= 280) selectCharacter('huaijing');
        else if (x >= 320 && x <= 480) selectCharacter('quiqui');
        else if (x >= 520 && x <= 680) selectCharacter('lingjun');
    }
});

init();

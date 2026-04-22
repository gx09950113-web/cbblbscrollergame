import { CHARACTERS, GAME_SETTINGS } from './config.js';
import { Player } from './entities/player.js'; 
import { Background } from './background.js';
import { storage } from './storage.js';
import { Enemy } from './entities/enemy.js';
import { Token } from './entities/token.js';
import { UI } from './ui.js'; // 引入 UI 繪製中心

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
let enemies = [];
let tokens = [];
const assets = { images: {}, audio: {} };

// --- 1. 遊戲初始化 ---
function init() {
    storage.checkAndResetDaily(); 
    
    if (!storage.canPlayToday()) {
        gameState = 'ALREADY_PLAYED';
    }

    preloadResources();
}

// --- 2. 資源預載器 ---
function preloadResources() {
    const charNames = ['huaijing', 'quiqui', 'lingjun'];
    const states = ['stand', 'left', 'right'];
    
    // 確保這些檔案在 assets/audio/ 下且名稱全小寫
    const audioFiles = [
        { key: 'bgm', src: 'assets/audio/bgm_main.mp3', loop: true },
        { key: 'coin', src: 'assets/audio/sfx_coin.mp3', loop: false },
        { key: 'hit', src: 'assets/audio/sfx_hit.mp3', loop: false }
    ];

    let loadedCount = 0;
    const totalToLoad = (charNames.length * states.length) + 1 + audioFiles.length;

    function checkLoaded() {
        loadedCount++;
        if (loadedCount >= totalToLoad) {
            if (gameState !== 'ALREADY_PLAYED') gameState = 'MENU';
        }
    }

    // 載入背景圖
    const bgImg = new Image();
    bgImg.src = 'assets/background.png';
    bgImg.onload = () => {
        background = new Background(canvas.width, canvas.height, bgImg);
        checkLoaded();
    };
    bgImg.onerror = () => { console.error("背景圖載入失敗"); checkLoaded(); };

    // 載入角色圖
    charNames.forEach(char => {
        states.forEach(state => {
            const key = `${char}_${state}`;
            const img = new Image();
            img.src = `assets/${char}/${key}.png`;
            img.onload = () => {
                assets.images[key] = img;
                checkLoaded();
            };
            img.onerror = () => { console.error(`圖片載入失敗: ${key}`); checkLoaded(); };
        });
    });

    // 載入音樂音效
    audioFiles.forEach(file => {
        const audio = new Audio(file.src);
        audio.loop = file.loop;
        audio.oncanplaythrough = () => {
            assets.audio[file.key] = audio;
            checkLoaded();
        };
        audio.onerror = () => { console.error(`音效載入失敗: ${file.key}`); checkLoaded(); };
        audio.load();
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
    if (isNaN(deltaTime)) return;

    timeLeft -= deltaTime / 1000;
    if (timeLeft <= 0) {
        timeLeft = 0;
        endGame();
    }

    background.update(player.speed);
    player.update(deltaTime, true);

    // 隨機事件生成
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

    // 處理怪物碰撞
    enemies.forEach((enemy, i) => {
        enemy.update(deltaTime, player.speed);
        if (player.checkCollision(enemy)) {
            if (assets.audio.hit) {
                assets.audio.hit.currentTime = 0;
                assets.audio.hit.play();
            }
            player.hp -= enemy.damage; // 扣血
            enemies.splice(i, 1);
            if (player.hp <= 0) endGame();
        }
        if (enemy.markedForDeletion) enemies.splice(i, 1);
    });

    // 處理代幣碰撞
    tokens.forEach((token, i) => {
        token.update(deltaTime, player.speed);
        if (player.checkCollision(token)) {
            if (assets.audio.coin) {
                assets.audio.coin.currentTime = 0;
                assets.audio.coin.play();
            }
            totalTokens += token.value;
            tokens.splice(i, 1);
        }
        if (token.markedForDeletion) tokens.splice(i, 1);
    });
}

// --- 5. 畫面繪製 ---
function drawGame() {
    background.draw(ctx);
    player.draw(ctx);
    enemies.forEach(e => e.draw(ctx));
    tokens.forEach(t => t.draw(ctx));

    // 使用 UI.js 繪製抬頭顯示器 (血條、時間、分數)
    UI.drawHUD(ctx, canvas.width, canvas.height, {
        timeLeft: Math.floor(timeLeft),
        tokens: totalTokens,
        player: player
    });
}

// --- 6. 互動功能 ---
function selectCharacter(type) {
    player = new Player(type, assets.images, CHARACTERS[type]);
    if (assets.audio.bgm) assets.audio.bgm.play().catch(e => console.log("音效自動播放受限"));
    gameState = 'PLAYING';
}

function endGame() {
    gameState = 'GAMEOVER';
    if (assets.audio.bgm) assets.audio.bgm.pause();
    storage.saveDailyResult(totalTokens); 
}

// 事件監聽：選單點擊
canvas.addEventListener('click', (e) => {
    if (gameState !== 'MENU') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 對應 UI.js 繪製的三個框框位置
    if (y > 180 && y < 380) {
        if (x > 120 && x < 280) selectCharacter('huaijing');
        else if (x > 320 && x < 480) selectCharacter('quiqui');
        else if (x > 520 && x < 680) selectCharacter('lingjun');
    }
});

init();

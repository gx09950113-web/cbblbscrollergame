import { CHARACTERS } from './config.js';
import { Player } from './entities/Player.js';
import { Background } from './background.js';
import { storage } from './storage.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 450;

// --- 遊戲狀態與數據 ---
let gameState = 'LOADING'; 
let timeLeft = 300;     // 5 分鐘
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
    // 檢查每日狀態
    storage.checkAndResetDaily(); // storage.js 內需處理日期比對與代幣歸零
    
    if (!storage.canPlayToday()) {
        gameState = 'ALREADY_PLAYED';
    }

    preloadResources();
}

// --- 2. 資源預載器 (圖片 + 音樂) ---
function preloadResources() {
    const charNames = ['huaijing', 'quiqui', 'lingjun'];
    const states = ['stand', 'left', 'right'];
    const audioFiles = [
        { key: 'bgm', src: 'assets/audio/bgm_main.mp3', loop: true },
        { key: 'coin', src: 'assets/audio/sfx_coin.mp3', loop: false },
        { key: 'hit', src: 'assets/audio/sfx_hit.mp3', loop: false }
    ];

    let loadedCount = 0;
    const totalToLoad = (charNames.length * states.length) + 1 + audioFiles.length;

    function checkLoaded() {
        loadedCount++;
        if (loadedCount === totalToLoad) {
            if (gameState !== 'ALREADY_PLAYED') gameState = 'MENU';
            requestAnimationFrame(gameLoop);
        }
    }

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
            img.onload = () => {
                assets.images[key] = img;
                checkLoaded();
            };
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
        audio.load();
    });
}

// --- 3. 核心遊戲循環 ---
function gameLoop(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (gameState) {
        case 'LOADING':
            drawText("資源載入中...", 320, 220);
            break;
        case 'MENU':
            drawMenu();
            break;
        case 'PLAYING':
            update(deltaTime);
            drawGame();
            break;
        case 'GAMEOVER':
            drawGameOver();
            break;
        case 'ALREADY_PLAYED':
            drawAlreadyPlayed();
            break;
    }
    requestAnimationFrame(gameLoop);
}

// --- 4. 邏輯更新 ---
function update(deltaTime) {
    // 5 分鐘倒數
    timeLeft -= deltaTime / 1000;
    if (timeLeft <= 0) {
        timeLeft = 0;
        endGame();
    }

    // 更新背景與玩家 (動畫連動)
    background.update(player.speed);
    player.update(deltaTime, true);

    // 隨機事件生成 (每 2.5 秒)
    spawnTimer += deltaTime;
    if (spawnTimer > 2500) {
        const roll = Math.random();
        if (roll < 0.4) spawnEnemy();
        else if (roll < 0.7) spawnToken();
        spawnTimer = 0;
    }

    // 處理怪物 (移動與戰鬥)
    enemies.forEach((enemy, i) => {
        enemy.update(deltaTime, player.speed);
        if (checkCollision(player, enemy)) {
            assets.audio.hit.currentTime = 0;
            assets.audio.hit.play();
            totalTokens += 5;
            enemies.splice(i, 1);
        }
    });

    // 處理代幣 (移動與拾取)
    tokens.forEach((token, i) => {
        token.update(deltaTime, player.speed);
        if (checkCollision(player, token)) {
            assets.audio.coin.currentTime = 0;
            assets.audio.coin.play();
            totalTokens += token.value;
            tokens.splice(i, 1);
        }
    });
}

// --- 5. 介面繪製 (UI) ---
function drawMenu() {
    drawText("請選擇今日挑戰角色", 260, 100, "28px Arial");
    const roles = ['huaijing', 'quiqui', 'lingjun'];
    roles.forEach((char, i) => {
        const x = 150 + i * 180;
        ctx.strokeStyle = "white";
        ctx.strokeRect(x, 200, 150, 150);
        drawText(CHARACTERS[char].name, x + 10, 280, "18px Arial");
    });
}

function drawGame() {
    background.draw(ctx);
    player.draw(ctx);
    enemies.forEach(e => e.draw(ctx));
    tokens.forEach(t => t.draw(ctx));

    // 頂部狀態欄
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, 60);
    drawText(`剩餘時間: ${Math.floor(timeLeft)}s`, 20, 40, "20px Monospace", "white");
    drawText(`今日獲得代幣: ${totalTokens}`, 550, 40, "20px Monospace", "gold");
}

function drawGameOver() {
    drawText("5 分鐘挑戰結束！", 280, 180, "30px Arial", "white");
    drawText(`今日總結算: ${totalTokens} 代幣`, 290, 240, "24px Arial", "gold");
    drawText("今日已完成挑戰，請明天再來", 260, 300, "18px Arial", "gray");
}

function drawAlreadyPlayed() {
    drawText("今日已挑戰過，請明日再戰！", 240, 225, "24px Arial", "red");
}

// --- 6. 互動與系統功能 ---
function selectCharacter(type) {
    player = new Player(type, assets.images, CHARACTERS[type]);
    assets.audio.bgm.play();
    gameState = 'PLAYING';
}

function endGame() {
    gameState = 'GAMEOVER';
    assets.audio.bgm.pause();
    storage.saveDailyResult(totalTokens); // 標記今日已玩，存入代幣
}

function checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

function drawText(text, x, y, font = "20px Arial", color = "white") {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.fillText(text, x, y);
}

// 監聽畫布點擊 (選擇角色)
canvas.addEventListener('click', (e) => {
    if (gameState !== 'MENU') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > 150 && x < 300) selectCharacter('huaijing');
    else if (x > 330 && x < 480) selectCharacter('quiqui');
    else if (x > 510 && x < 660) selectCharacter('lingjun');
});

// 啟動
init();

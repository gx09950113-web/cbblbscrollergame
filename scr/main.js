import { CHARACTERS, GAME_SETTINGS } from './config.js';
import { Player } from './entities/player.js'; // 改小寫 p
import { Background } from './background.js';
import { storage } from './storage.js';
import { Enemy } from './entities/enemy.js';   // 改小寫 e
import { Token } from './entities/token.js';   // 改小寫 t

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
    // 檢查每日狀態
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
    
    // 如果你暫時沒有音效檔，可以先將此陣列設為空 [] 以免卡住
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
            // 這裡的路徑必須與你的資料夾結構完全一致
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

    // 啟動循環
    requestAnimationFrame(gameLoop);
}

// --- 3. 核心遊戲循環 ---
function gameLoop(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (gameState) {
        case 'LOADING':
            drawText("資源載入中...", 320, 220, "20px Arial", "white");
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

    // 處理怪物
    enemies.forEach((enemy, i) => {
        enemy.update(deltaTime, player.speed);
        if (checkCollision(player, enemy)) {
            if (assets.audio.hit) {
                assets.audio.hit.currentTime = 0;
                assets.audio.hit.play();
            }
            totalTokens += 5;
            enemies.splice(i, 1);
        }
        if (enemy.markedForDeletion) enemies.splice(i, 1);
    });

    // 處理代幣
    tokens.forEach((token, i) => {
        token.update(deltaTime, player.speed);
        if (checkCollision(player, token)) {
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

// --- 5. 介面繪製 (UI) ---
function drawMenu() {
    drawText("請選擇今日挑戰角色", 260, 100, "28px Arial", "white");
    const roles = ['huaijing', 'quiqui', 'lingjun'];
    roles.forEach((char, i) => {
        const x = 150 + i * 180;
        ctx.strokeStyle = "white";
        ctx.strokeRect(x, 200, 150, 150);
        drawText(CHARACTERS[char].name, x + 10, 280, "18px Arial", "white");
    });
}

function drawGame() {
    background.draw(ctx);
    player.draw(ctx);
    enemies.forEach(e => e.draw(ctx));
    tokens.forEach(t => t.draw(ctx));

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, 60);
    drawText(`剩餘時間: ${Math.floor(timeLeft)}s`, 20, 40, "20px Monospace", "white");
    drawText(`今日獲得代幣: ${totalTokens}`, 550, 40, "20px Monospace", "gold");
}

function drawGameOver() {
    drawText("5 分鐘挑戰結束！", 280, 180, "30px Arial", "white");
    drawText(`今日總結算: ${totalTokens} 代幣`, 290, 240, "24px Arial", "gold");
    drawText("請明日再戰", 350, 300, "18px Arial", "gray");
}

function drawAlreadyPlayed() {
    drawText("今日已挑戰過，請明日再戰！", 240, 225, "24px Arial", "red");
}

// --- 6. 互動功能 ---
function selectCharacter(type) {
    player = new Player(type, assets.images, CHARACTERS[type]);
    if (assets.audio.bgm) assets.audio.bgm.play().catch(e => console.log("音效播放被阻擋"));
    gameState = 'PLAYING';
}

function endGame() {
    gameState = 'GAMEOVER';
    if (assets.audio.bgm) assets.audio.bgm.pause();
    storage.saveDailyResult(totalTokens); 
}

function checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

function drawText(text, x, y, font, color) {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.fillText(text, x, y);
}

canvas.addEventListener('click', (e) => {
    if (gameState !== 'MENU') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > 150 && x < 300) selectCharacter('huaijing');
    else if (x > 330 && x < 480) selectCharacter('quiqui');
    else if (x > 510 && x < 660) selectCharacter('lingjun');
});

init();

import { Entity } from './entity.js'; // 確保是小寫 e
import { TOKEN_SETTINGS, GAME_SETTINGS } from '../config.js'; // 向上跳一層抓 config.js

export class Token extends Entity {
    constructor() {
        const config = TOKEN_SETTINGS;
        // 隨機出現在地平線上方的不同高度
        const randomHeight = Math.random() * 100;
        super(800, GAME_SETTINGS.GROUND_Y - randomHeight - 20, config.width, config.height);
        
        // 隨機價值 (例如 1~10 代幣)
        this.value = Math.floor(Math.random() * (config.max_value - config.min_value + 1)) + config.min_value;
        
        // 漂浮動畫用
        this.floatTimer = 0;

        // --- 1. 懶人圖片載入 ---
        // 確保你的 assets/ 下有 token.png 檔案
        this.image = new Image();
        this.image.src = 'assets/token.png'; 
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.onerror = () => { console.error("無法載入 assets/token.png"); };
    }

    update(deltaTime, playerSpeed) {
        // 跟隨背景捲動
        this.x -= playerSpeed;

        // 簡單的上下漂浮動畫
        this.floatTimer += deltaTime * 0.005;
        this.y += Math.sin(this.floatTimer) * 0.5;

        // 如果跑出螢幕左側，標記刪除
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // --- 2. 替換繪製邏輯 ---
        if (this.imageLoaded) {
            // 圖片載入完成後，用 drawImage 繪製
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // 備用方案：如果圖片沒載入，畫一個金色圓形代替
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

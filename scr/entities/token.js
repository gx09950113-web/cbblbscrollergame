import { Entity } from './entity.js';
import { TOKEN_SETTINGS, GAME_SETTINGS } from '../config.js';

export class Token extends Entity {
    constructor() {
        const config = TOKEN_SETTINGS;
        // 隨機出現在地平線上方的不同高度（有些要跳起來才吃得到）
        const randomHeight = Math.random() * 100;
        super(800, GAME_SETTINGS.GROUND_Y - randomHeight, config.width, config.height);
        
        // 隨機價值 (例如 1~10 代幣)
        this.value = Math.floor(Math.random() * (config.max_value - config.min_value + 1)) + config.min_value;
        
        // 漂浮動畫用
        this.floatTimer = 0;
    }

    update(deltaTime, playerSpeed) {
        // 跟隨背景捲動
        this.x -= playerSpeed;

        // 簡單的上下漂浮動畫
        this.floatTimer += deltaTime * 0.005;
        this.y += Math.sin(this.floatTimer) * 0.5;

        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // 畫一個金色的圓形
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 畫一個 $ 符號
        ctx.fillStyle = "black";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("$", this.x + this.width / 2, this.y + this.height / 2 + 5);
    }
}

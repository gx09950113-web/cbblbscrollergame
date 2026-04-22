import { Entity } from './entity.js'; // 確保是小寫 e
import { ENEMY_SETTINGS, GAME_SETTINGS } from '../config.js'; // 向上跳一層抓 config.js

export class Enemy extends Entity {
    constructor() {
        const config = ENEMY_SETTINGS.basic;
        // 在畫面右側外生成，並站在地平線上
        super(800, GAME_SETTINGS.GROUND_Y - config.height, config.width, config.height);
        
        this.hp = config.hp;
        this.baseSpeed = config.speed;
        this.damage = config.damage;
        this.reward = config.reward;
        
        // 隨機賦予一點速度差異，讓怪物群看起來不那麼機械化
        this.individualSpeed = Math.random() * 1.5;

        // --- 1. 懶人圖片載入 ---
        // 確保你的 assets/ 下有 enemy.png 檔案
        this.image = new Image();
        this.image.src = 'assets/enemy.png'; 
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        // 如果載入失敗，控制台報錯
        this.image.onerror = () => { console.error("無法載入 assets/enemy.png"); };
    }

    /**
     * 更新怪物位置
     * @param {number} deltaTime 
     * @param {number} playerSpeed - 傳入玩家目前的捲軸速度以達成相對位移
     */
    update(deltaTime, playerSpeed) {
        // 怪物移動距離 = (玩家捲軸速度 + 怪物自己的移動速度)
        this.x -= (playerSpeed + this.baseSpeed + this.individualSpeed);

        // 如果跑出螢幕左側，標記刪除
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    /**
     * 繪製怪物
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        // --- 2. 替換繪製邏輯 ---
        if (this.imageLoaded) {
            // 圖片載入完成後，用 drawImage 繪製
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // 備用方案：如果圖片沒載入，先用紫色的方塊代替，以免遊戲看起來像壞掉
            ctx.fillStyle = "#8e44ad";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // 可選：如果你想在 Debug 時看到血條，可以解開這兩行
        // ctx.fillStyle = "red";
        // ctx.fillRect(this.x, this.y - 10, this.width, 5);
    }
}

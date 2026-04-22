import { Entity } from './Entity.js';
import { ENEMY_SETTINGS, GAME_SETTINGS } from '../config.js';

export class Enemy extends Entity {
    constructor() {
        // 從螢幕右側外面一點點生成
        const config = ENEMY_SETTINGS.basic;
        super(800, GAME_SETTINGS.GROUND_Y - config.height + 64, config.width, config.height);
        
        this.hp = config.hp;
        this.baseSpeed = config.speed;
        this.damage = config.damage;
        this.reward = config.reward;
        
        // 隨機賦予一點速度差異，讓怪物群看起來不那麼機械化
        this.individualSpeed = Math.random() * 1.5;
    }

    /**
     * @param {number} deltaTime 
     * @param {number} playerSpeed - 傳入玩家目前的速度以達成相對位移
     */
    update(deltaTime, playerSpeed) {
        // 怪物相對於地面的移動 = (玩家捲軸速度 + 怪物自己的移動速度)
        this.x -= (playerSpeed + this.baseSpeed + this.individualSpeed);

        // 如果跑出螢幕左側，標記刪除
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // 如果你還沒畫怪物圖，這裡先用紫色的方塊代替
        ctx.fillStyle = "#8e44ad";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 簡單的血條 (Debug 用)
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y - 10, this.width, 5);
    }
}

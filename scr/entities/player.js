import { Entity } from './entity.js';
import { GAME_SETTINGS } from '../config.js';

/**
 * 玩家類別 - 處理動畫、跳躍物理與攻擊判定
 */
export class Player extends Entity {
    constructor(type, assets, config) {
        // 初始化站在地平線上
        super(100, GAME_SETTINGS.GROUND_Y - config.height, config.width, config.height); 
        
        this.type = type;
        this.config = config;
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.speed = config.speed;
        this.attack = config.attack;
        
        this.images = {
            stand: assets[`${type}_stand`],
            left: assets[`${type}_left`],
            right: assets[`${type}_right`]
        };
        this.currentImage = this.images.stand;

        // 跳躍與重力屬性
        this.vy = 0;
        this.gravity = GAME_SETTINGS.GRAVITY || 0.8;
        this.jumpPower = -15; 
        this.onGround = true;

        this.animSteps = ['stand', 'left', 'stand', 'right'];
        this.animIndex = 0;
        this.frameTimer = 0;
        this.frameInterval = config.frameInterval;
        this.attackCooldown = 0;
    }

    /**
     * 執行跳躍動作
     */
    jump() {
        if (this.onGround) {
            this.vy = this.jumpPower;
            this.onGround = false;
        }
    }

    /**
     * 執行攻擊動作
     */
    performAttack(enemies) {
        if (this.attackCooldown > 0) return null;

        let hitEnemy = null;
        enemies.forEach(enemy => {
            const attackRange = 70; // 攻擊距離
            const distance = enemy.x - (this.x + this.width);
            
            // 判定敵人是否在角色前方且在距離內
            if (distance >= -20 && distance <= attackRange) {
                enemy.hp -= this.attack;
                hitEnemy = enemy;
                if (enemy.hp <= 0) enemy.markedForDeletion = true;
            }
        });

        this.attackCooldown = 400; // 0.4 秒攻擊間隔
        return hitEnemy;
    }

    update(deltaTime, isMoving) {
        // 1. 動畫處理：移動時循環，靜止時 stand
        if (isMoving) {
            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.frameInterval) {
                this.animIndex = (this.animIndex + 1) % this.animSteps.length;
                this.currentImage = this.images[this.animSteps[this.animIndex]];
                this.frameTimer = 0;
            }
        } else {
            this.currentImage = this.images.stand;
        }

        // 2. 物理處理 (跳躍與重力)
        this.y += this.vy;
        if (!this.onGround) {
            this.vy += this.gravity;
        }
        
        // 地面碰撞檢測
        const groundY = GAME_SETTINGS.GROUND_Y - this.height;
        if (this.y >= groundY) {
            this.y = groundY;
            this.vy = 0;
            this.onGround = true;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.hp < 0) this.hp = 0;
    }

    draw(ctx) {
        if (this.currentImage) {
            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(this.config.name, this.x + this.width / 2, this.y - 10);
        }
    }
}

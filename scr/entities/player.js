import { Entity } from './entity.js';
import { GAME_SETTINGS } from '../config.js';

export class Player extends Entity {
    constructor(type, assets, config) {
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

        this.vy = 0;
        this.gravity = GAME_SETTINGS.GRAVITY || 0.8;
        this.jumpPower = -15; 
        this.onGround = true;

        this.animSteps = ['stand', 'left', 'stand', 'right'];
        this.animIndex = 0;
        this.frameTimer = 0;
        this.frameInterval = config.frameInterval;
        
        this.attackCooldown = 0;
        this.flashTimer = 0; // 閃光特效計時器
    }

    jump() {
        if (this.onGround) {
            this.vy = this.jumpPower;
            this.onGround = false;
        }
    }

    /**
     * 執行攻擊並回傳被擊殺的對象
     */
    performAttack(enemies) {
        if (this.attackCooldown > 0) return null;

        let hitEnemy = null;
        this.flashTimer = 100; // 觸發 0.1 秒閃光

        enemies.forEach(enemy => {
            const attackRange = 80;
            const distance = enemy.x - (this.x + this.width);
            
            if (distance >= -20 && distance <= attackRange) {
                enemy.hp -= this.attack;
                if (enemy.hp <= 0) {
                    enemy.markedForDeletion = true;
                    hitEnemy = enemy; // 標記為被擊殺，供外部生成 token
                }
            }
        });

        this.attackCooldown = 400;
        return hitEnemy; 
    }

    update(deltaTime, isMoving) {
        // 動畫處理
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

        // 跳躍物理
        this.y += this.vy;
        if (!this.onGround) this.vy += this.gravity;
        
        const groundY = GAME_SETTINGS.GROUND_Y - this.height;
        if (this.y >= groundY) {
            this.y = groundY;
            this.vy = 0;
            this.onGround = true;
        }

        // 冷卻與特效計時
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.flashTimer > 0) this.flashTimer -= deltaTime;
        if (this.hp < 0) this.hp = 0;
    }

    draw(ctx) {
        if (this.currentImage) {
            ctx.save();
            // 如果正在閃光，給予白色濾鏡感
            if (this.flashTimer > 0) {
                ctx.filter = "brightness(2) contrast(1.5)";
                // 額外繪製一個半透明白圈表示攻擊範圍
                ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                ctx.beginPath();
                ctx.arc(this.x + this.width + 20, this.y + this.height/2, 40, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
            ctx.restore();

            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(this.config.name, this.x + this.width / 2, this.y - 10);
        }
    }
}

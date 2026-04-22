import { Entity } from './entity.js';

/**
 * 玩家類別 - 處理動畫切換、角色屬性與攻擊邏輯
 */
export class Player extends Entity {
    constructor(type, assets, config) {
        // 初始化位置
        super(100, 316, config.width, config.height); 
        
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

        this.animSteps = ['stand', 'left', 'stand', 'right'];
        this.animIndex = 0;
        this.frameTimer = 0;
        this.frameInterval = config.frameInterval;

        this.healTimer = 0;
        this.attackCooldown = 0; // 攻擊冷卻計時
    }

    /**
     * 執行攻擊邏輯
     * @param {Array} enemies - 當前畫面上的敵人列表
     */
    performAttack(enemies) {
        if (this.attackCooldown > 0) return null; // 冷卻中

        let hitEnemy = null;
        enemies.forEach(enemy => {
            // 設定攻擊範圍：角色中心點前方約 60 像素
            const attackRange = 60;
            const distance = enemy.x - (this.x + this.width);
            
            // 判定：敵人在前方且距離在範圍內
            if (distance >= -10 && distance <= attackRange) {
                enemy.hp -= this.attack;
                hitEnemy = enemy;
                if (enemy.hp <= 0) enemy.markedForDeletion = true;
            }
        });

        this.attackCooldown = 500; // 設定 0.5 秒攻擊間隔
        return hitEnemy;
    }

    update(deltaTime, isMoving) {
        // 1. 處理動畫：只有移動時才循環動畫，否則回歸 stand
        if (isMoving) {
            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.frameInterval) {
                this.animIndex = (this.animIndex + 1) % this.animSteps.length;
                const currentState = this.animSteps[this.animIndex];
                this.currentImage = this.images[currentState];
                this.frameTimer = 0;
            }
        } else {
            this.currentImage = this.images.stand;
        }

        // 2. 處理攻擊冷卻
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // 3. 處理角色特殊被動 (奶媽回血)
        if (this.config.healPerSecond && this.hp < this.maxHp) {
            this.healTimer += deltaTime;
            if (this.healTimer >= 1000) {
                this.hp = Math.min(this.maxHp, this.hp + this.config.healPerSecond);
                this.healTimer = 0;
            }
        }

        if (this.hp < 0) this.hp = 0;
    }

    draw(ctx) {
        if (this.currentImage) {
            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
            
            // 顯示名字與攻擊冷卻提示
            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(this.config.name, this.x + this.width / 2, this.y - 10);

            if (this.attackCooldown > 0) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.fillRect(this.x, this.y + this.height + 5, (this.attackCooldown / 500) * this.width, 3);
            }
        }
    }
}

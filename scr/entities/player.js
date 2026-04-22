import { Entity } from './entity.js';

/**
 * 玩家類別 - 處理動畫切換、角色屬性與特殊能力
 */
export class Player extends Entity {
    /**
     * @param {string} type - 角色 ID (huaijing, quiqui, lingjun)
     * @param {Object} assets - 預載好的圖片物件
     * @param {Object} config - 來自 config.js 的角色數值
     */
    constructor(type, assets, config) {
        // 呼叫父類別 Entity (x, y, width, height)
        super(100, 300, config.width, config.height); 
        
        this.type = type;
        this.config = config;
        
        // 狀態屬性
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.speed = config.speed;
        this.attack = config.attack;
        
        // 圖片資源 (對應你提供的九張圖命名)
        this.images = {
            stand: assets[`${type}_stand`],
            left: assets[`${type}_left`],
            right: assets[`${type}_right`]
        };
        this.currentImage = this.images.stand;

        // 動畫循環控制：Stand -> Left -> Stand -> Right
        this.animSteps = ['stand', 'left', 'stand', 'right'];
        this.animIndex = 0;
        this.frameTimer = 0;
        this.frameInterval = config.frameInterval; // 從 config 讀取動作快慢

        // 奶媽專屬：回血計時器
        this.healTimer = 0;
    }

    /**
     * 更新玩家狀態
     * @param {number} deltaTime - 兩幀之間的時間差
     * @param {boolean} isMoving - 是否正在移動 (捲軸模式下通常為 true)
     */
    update(deltaTime, isMoving) {
        // 1. 處理動畫循環
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

        // 2. 處理角色特殊被動 (奶媽回血)
        if (this.config.healPerSecond && this.hp < this.maxHp) {
            this.healTimer += deltaTime;
            if (this.healTimer >= 1000) { // 每秒觸發一次
                this.hp = Math.min(this.maxHp, this.hp + this.config.healPerSecond);
                this.healTimer = 0;
            }
        }

        // 3. 確保血量不低於 0
        if (this.hp < 0) this.hp = 0;
    }

    /**
     * 繪製玩家
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        if (this.currentImage) {
            // 繪製角色本體
            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
            
            // 懶人小細節：在角色頭頂顯示名字
            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(this.config.name, this.x + this.width / 2, this.y - 10);
        } else {
            // 備用方案：如果圖片沒載入，畫一個色塊以免遊戲看起來像壞掉
            ctx.fillStyle = "red";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    /**
     * 受傷邏輯
     * @param {number} damage 
     */
    takeDamage(damage) {
        // 如果是坦克 Huaijing，可以額外增加減傷邏輯
        const finalDamage = this.type === 'huaijing' ? damage * 0.7 : damage;
        this.hp -= finalDamage;
    }
}

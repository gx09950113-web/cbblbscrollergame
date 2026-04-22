/**
 * 遊戲實體基類 - 處理所有物件的基礎物理與碰撞
 */
export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // 速度屬性
        this.vx = 0;
        this.vy = 0;
        
        // 標記是否需要被從遊戲中移除
        this.markedForDeletion = false;
    }

    /**
     * 基礎更新邏輯：根據速度移動位置
     */
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    /**
     * 基礎繪製：如果子類別沒寫 draw，至少會畫一個紅框代表佔位
     */
    draw(ctx) {
        ctx.strokeStyle = 'red';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    /**
     * AABB 碰撞偵測核心
     * 檢查此物件是否與另一個 entity 重疊
     */
    checkCollision(other) {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    /**
     * 獲取物件的中心點 (用於特效或更精準的邏輯)
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}

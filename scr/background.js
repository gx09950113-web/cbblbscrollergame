/**
 * 背景類別 - 處理無縫捲動效果
 */
export class Background {
    /**
     * @param {number} width - 畫布寬度
     * @param {number} height - 畫布高度
     * @param {HTMLImageElement} image - 已經載入完成的圖片物件
     */
    constructor(width, height, image) {
        this.width = width;
        this.height = height;
        this.image = image;
        this.x = 0;
        this.x2 = this.width; // 第二張背景圖，實現無縫連接
    }

    /**
     * 更新背景位置
     * @param {number} speed - 捲動速度
     */
    update(speed) {
        // 背景向左移動
        this.x -= speed * 0.2; // 讓背景捲動速度慢一點，產生景深感
        this.x2 -= speed * 0.2;

        // 當第一張背景完全移出螢幕左側，將其接到第二張後面
        if (this.x <= -this.width) {
            this.x = this.x2 + this.width;
        }
        // 當第二張背景完全移出螢幕左側
        if (this.x2 <= -this.width) {
            this.x2 = this.x + this.width;
        }
    }

    /**
     * 繪製背景
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        // 只有在圖片物件存在且載入成功時才繪製
        if (this.image && this.image.complete) {
            ctx.drawImage(this.image, this.x, 0, this.width, this.height);
            ctx.drawImage(this.image, this.x2, 0, this.width, this.height);
        } else {
            // 如果圖片還沒好，畫一個深灰色背景當墊底
            ctx.fillStyle = "#1a1a1a";
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}

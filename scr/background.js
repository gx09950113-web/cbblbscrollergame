/**
 * 無縫捲軸背景類別
 */
export class Background {
    /**
     * @param {number} width - 畫布寬度
     * @param {number} height - 畫布高度
     * @param {HTMLImageElement} image - 背景圖片物件
     */
    constructor(width, height, image) {
        this.width = width;
        this.height = height;
        this.image = image;
        
        // 背景座標
        this.x = 0;
        this.y = 0;
        
        // 圖片原始寬高
        this.imageWidth = image.width;
        this.imageHeight = image.height;

        // 捲軸速度係數 (可根據需求微調背景相對於玩家速度的比例)
        this.speedModifier = 1; 
    }

    /**
     * 更新背景位置
     * @param {number} playerSpeed - 傳入當前角色的移動速度
     */
    update(playerSpeed) {
        // 背景向左移動的距離取決於角色速度
        this.x -= playerSpeed * this.speedModifier;

        // 如果第一張背景完全移出畫面左側，則重置 x 座標
        // 這裡假設背景圖寬度大於或等於畫布寬度
        if (this.x <= -this.imageWidth) {
            this.x = 0;
        }
    }

    /**
     * 繪製背景 (兩張銜接)
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        // 第一張圖
        ctx.drawImage(
            this.image, 
            this.x, 
            this.y, 
            this.imageWidth, 
            this.height
        );

        // 第二張圖，緊接在第一張後面
        ctx.drawImage(
            this.image, 
            this.x + this.imageWidth, 
            this.y, 
            this.imageWidth, 
            this.height
        );
    }
}

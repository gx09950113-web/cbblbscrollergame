/**
 * 遊戲介面繪製中心 - 整合電腦端與行動端虛擬控制
 */
import { CHARACTERS } from './config.js';

export const UI = {
    /**
     * 繪製角色選擇選單
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} width 
     * @param {number} height 
     */
    drawMenu(ctx, width, height) {
        // 半透明背景遮罩
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, width, height);

        // 標題
        this.drawText(ctx, "今日挑戰：請選擇角色", width / 2, 80, "32px Arial", "white", "center");
        this.drawText(ctx, "（每日僅限一次，結算代幣將於明日重置）", width / 2, 120, "16px Arial", "#aaa", "center");

        // 繪製三個角色的選擇框
        const roles = ['huaijing', 'quiqui', 'lingjun'];
        roles.forEach((id, i) => {
            const char = CHARACTERS[id];
            const x = 120 + i * 200;
            const y = 180;

            // 邊框
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, 160, 200);

            // 角色名稱
            this.drawText(ctx, char.name, x + 80, y + 40, "20px Arial", "gold", "center");
            
            // 數值簡介
            ctx.textAlign = "left";
            this.drawText(ctx, `HP: ${char.hp}`, x + 20, y + 80, "16px Arial", "white");
            this.drawText(ctx, `SPD: ${char.speed}`, x + 20, y + 110, "16px Arial", "white");
            this.drawText(ctx, `ATK: ${char.attack}`, x + 20, y + 140, "16px Arial", "white");
            
            // 特性標籤
            this.drawText(ctx, `★ ${char.special}`, x + 20, y + 180, "14px Arial", "#00ffcc");
        });
    },

    /**
     * 繪製遊戲進行中的 HUD (Heads-Up Display)
     */
    drawHUD(ctx, width, height, data) {
        // 安全檢查：如果 player 物件尚未初始化，直接跳出避免讀取 hp 報錯
        if (!data || !data.player) return;

        // 頂部資訊條
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, width, 60);

        // 倒數計時 (分鐘:秒)
        const mins = Math.floor(data.timeLeft / 60);
        const secs = Math.floor(data.timeLeft % 60).toString().padStart(2, '0');
        const timerColor = data.timeLeft < 30 ? "#ff4444" : "white";
        this.drawText(ctx, `TIME: ${mins}:${secs}`, 20, 40, "24px Monospace", timerColor);

        // 代幣累計
        this.drawText(ctx, `🪙 TOKENS: ${data.tokens}`, width - 20, 40, "24px Monospace", "gold", "right");

        // 血量條 (HP Bar)
        const hpPercent = data.player.hp / data.player.maxHp;
        ctx.fillStyle = "#333";
        ctx.fillRect(280, 20, 240, 20);
        ctx.fillStyle = hpPercent > 0.3 ? "#2ecc71" : "#e74c3c";
        ctx.fillRect(280, 20, 240 * hpPercent, 20);
        this.drawText(ctx, "HP", 250, 36, "18px Arial", "white");
    },

    /**
     * 繪製行動端虛擬按鍵 (僅在觸控裝置顯示)
     * @param {CanvasRenderingContext2D} ctx 
     * @param {boolean} isTouchDevice 
     */
    drawMobileControls(ctx, isTouchDevice) {
        if (!isTouchDevice) return;

        ctx.save();
        ctx.globalAlpha = 0.5; // 按鈕半透明化，不遮擋遊戲畫面
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";

        // 繪製左按鈕 (對應判定區 touchX < 120)
        this.drawButton(ctx, 40, 350, 80, 60, "◀");
        // 繪製右按鈕 (對應判定區 130 < touchX < 250)
        this.drawButton(ctx, 150, 350, 80, 60, "▶");
        
        // 繪製攻擊按鈕 (對應判定區 550 < touchX < 670)
        this.drawButton(ctx, 570, 350, 100, 60, "ATK");
        // 繪製跳躍按鈕 (對應判定區 touchX > 680)
        this.drawButton(ctx, 690, 350, 100, 60, "JMP");

        ctx.restore();
    },

    /**
     * 輔助工具：繪製單個虛擬按鈕
     */
    drawButton(ctx, x, y, w, h, label) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.fillText(label, x + w / 2, y + h / 2 + 7);
    },

    /**
     * 繪製結算畫面
     */
    drawGameOver(ctx, width, height, tokens) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, width, height);

        this.drawText(ctx, "挑戰結束", width / 2, height / 2 - 60, "48px Arial", "white", "center");
        this.drawText(ctx, `今日獲得代幣總計: ${tokens}`, width / 2, height / 2, "28px Arial", "gold", "center");
        this.drawText(ctx, "數據已存檔，請明天再來挑戰！", width / 2, height / 2 + 60, "18px Arial", "#888", "center");
    },

    /**
     * 萬用文字繪製工具
     */
    drawText(ctx, text, x, y, font, color, align = "left") {
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
    }
};

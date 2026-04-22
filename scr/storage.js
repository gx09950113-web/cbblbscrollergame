/**
 * 遊戲資料持久化與每日重置邏輯
 */

export const storage = {
    // 儲存金鑰定義
    KEYS: {
        LAST_PLAY_DATE: 'scroller_last_play_date',
        HAS_PLAYED_TODAY: 'scroller_has_played',
        TOTAL_TOKENS: 'scroller_total_tokens'
    },

    /**
     * 檢查並重置每日數據
     * 在 main.js 初始化時執行
     */
    checkAndResetDaily() {
        const today = new Date().toDateString(); // 格式如 "Wed Apr 22 2026"
        const lastDate = localStorage.getItem(this.KEYS.LAST_PLAY_DATE);

        if (lastDate !== today) {
            // 偵測到新的一天：重置數據
            localStorage.setItem(this.KEYS.LAST_PLAY_DATE, today);
            localStorage.setItem(this.KEYS.HAS_PLAYED_TODAY, 'false');
            localStorage.setItem(this.KEYS.TOTAL_TOKENS, '0');
            console.log("新的一天開始，數據已重置。");
        }
    },

    /**
     * 判斷今天是否還能玩
     * @returns {boolean}
     */
    canPlayToday() {
        const status = localStorage.getItem(this.KEYS.HAS_PLAYED_TODAY);
        // 如果還沒玩過 (false) 就可以玩
        return status !== 'true';
    },

    /**
     * 標記今日已完成挑戰 (遊戲結束時呼叫)
     */
    markAsPlayed() {
        localStorage.setItem(this.KEYS.HAS_PLAYED_TODAY, 'true');
    },

    /**
     * 儲存今日獲得的代幣
     * @param {number} amount 
     */
    saveDailyResult(amount) {
        localStorage.setItem(this.KEYS.TOTAL_TOKENS, amount.toString());
        this.markAsPlayed();
    },

    /**
     * 獲取當前儲存的代幣數量
     */
    getTodayTokens() {
        return parseInt(localStorage.getItem(this.KEYS.TOTAL_TOKENS)) || 0;
    },

    /**
     * 【Debug 用】手動重置所有資料
     * 可以在瀏覽器 Console 輸入 storage.clearAll() 使用
     */
    clearAll() {
        localStorage.removeItem(this.KEYS.LAST_PLAY_DATE);
        localStorage.removeItem(this.KEYS.HAS_PLAYED_TODAY);
        localStorage.removeItem(this.KEYS.TOTAL_TOKENS);
        location.reload(); // 重新整理頁面
    }
};

// 為了方便 Debug，將它掛載到 window（非必要，但建議保留）
window.gameStorage = storage;

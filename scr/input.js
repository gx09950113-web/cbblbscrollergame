/**
 * 鍵盤輸入監聽器
 */

export class InputHandler {
    constructor() {
        // 記錄當前按下的按鍵狀態
        this.keys = {};

        // 監聽按下按鍵
        window.addEventListener('keydown', (e) => {
            // 使用 e.code 可以避開中文輸入法導致的抓不到鍵位問題
            this.keys[e.code] = true;
        });

        // 監聽放開按鍵
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    /**
     * 檢查特定按鍵是否正被按下
     * @param {string} keyCode - 例如 'KeyD', 'KeyA', 'Space', 'ArrowUp'
     */
    isPressed(keyCode) {
        return this.keys[keyCode] === true;
    }

    /**
     * 輔助方法：檢查是否正在往左走
     */
    get isLeft() {
        return this.isPressed('KeyA') || this.isPressed('ArrowLeft');
    }

    /**
     * 輔助方法：檢查是否正在往右走
     */
    get isRight() {
        return this.isPressed('KeyD') || this.isPressed('ArrowRight');
    }

    /**
     * 輔助方法：檢查是否按下跳躍/攻擊
     */
    get isJump() {
        return this.isPressed('Space') || this.isPressed('KeyW') || this.isPressed('ArrowUp');
    }
}

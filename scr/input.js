/**
 * 鍵盤、滑鼠與觸控輸入監聽器
 */
export class InputHandler {
    constructor(canvas) {
        this.keys = {};
        this.isMouseLeftPressed = false;
        this.isTouchDevice = 'ontouchstart' in window;
        this.canvas = canvas;

        // 鍵盤監聽
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

        // 滑鼠監聽
        window.addEventListener('mousedown', (e) => { if (e.button === 0) this.isMouseLeftPressed = true; });
        window.addEventListener('mouseup', (e) => { if (e.button === 0) this.isMouseLeftPressed = false; });

        // 觸控監聽
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouch(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
    }

    handleTouch(e) {
        if (e.cancelable) e.preventDefault();
        
        if (e.type === 'touchend') {
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
            this.keys['Space'] = false;
            this.isMouseLeftPressed = false;
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        for (let i = 0; i < e.touches.length; i++) {
            const touchX = (e.touches[i].clientX - rect.left) * scaleX;
            const touchY = (e.touches[i].clientY - rect.top) * scaleY;

            // 虛擬按鈕區域判定 (與 UI.drawMobileControls 座標對應)
            if (touchY > 300) {
                if (touchX < 120) this.keys['ArrowLeft'] = true;
                else if (touchX > 130 && touchX < 250) this.keys['ArrowRight'] = true;
                else if (touchX > 550 && touchX < 670) this.isMouseLeftPressed = true; // 攻擊
                else if (touchX > 680) this.keys['Space'] = true; // 跳躍
            }
        }
    }

    isPressed(keyCode) { return this.keys[keyCode] === true; }
    get isLeft() { return this.isPressed('KeyA') || this.isPressed('ArrowLeft'); }
    get isRight() { return this.isPressed('KeyD') || this.isPressed('ArrowRight'); }
    get isJump() { return this.isPressed('Space') || this.isPressed('KeyW') || this.isPressed('ArrowUp'); }
    get isAttack() {
        const attack = this.isMouseLeftPressed;
        if (attack) this.isMouseLeftPressed = false;
        return attack;
    }
}

/**
 * 鍵盤與滑鼠輸入監聽器
 */
export class InputHandler {
    constructor() {
        this.keys = {};
        this.isMouseLeftPressed = false;

        // 鍵盤監聽
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // 滑鼠點擊監聽 (用於攻擊)
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.isMouseLeftPressed = true;
        });
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.isMouseLeftPressed = false;
        });
    }

    isPressed(keyCode) {
        return this.keys[keyCode] === true;
    }

    get isLeft() {
        return this.isPressed('KeyA') || this.isPressed('ArrowLeft');
    }

    get isRight() {
        return this.isPressed('KeyD') || this.isPressed('ArrowRight');
    }

    // 空白鍵專用於跳躍
    get isJump() {
        return this.isPressed('Space') || this.isPressed('KeyW') || this.isPressed('ArrowUp');
    }

    // 滑鼠左鍵專用於攻擊
    get isAttack() {
        const attack = this.isMouseLeftPressed;
        if (attack) this.isMouseLeftPressed = false; // 單次點擊觸發，防止按住連發
        return attack;
    }
}

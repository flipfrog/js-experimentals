export class TransitionBase {
    constructor() {
        this.t = 0;
        this.draw = () => true;
    }
}

export class TransitionSwipe extends TransitionBase {
    constructor() {
        super();
        this.text = '';
        this.expirationSec = 3;
        this.draw = (engine, delta) => {
            this.t += delta;
            if (this.t > this.expirationSec) {
                return true;
            }
            const ctx = engine.getCtx();
            ctx.save();
            ctx.fillStyle = 'red';
            ctx.fillText(`remaining time: ${Math.ceil(this.expirationSec - this.t)}sec`, 100, 100);
            ctx.restore();
            return false;
        }
    }
}

export class UIBase {
    constructor(engine, cx, cy) {
        this.TYPE_UI_BUTTON = 'UIButton';
        this.type = null;
        this.tag = null;
        this.engine = engine;
        /** @type CanvasRenderingContext2D */
        this.ctx = engine.getCtx();
        this.geometry = new UIGeometry();
        this.geometry.cx = cx;
        this.geometry.cy = cy;
        this.userEventListener = () => {};
        this.computeGeometry = () => {};
        this.draw = () => {};
    }
    eventListener(engine, scene, e) {
        if (e.type === engine.EVENT_TYPE_CLICK) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (this.geometry.isContained(x, y)) {
                this.userEventListener(engine, scene, e);
                return true;
            }
        }
        return false;
    }
    setEventListener(listener) {
        this.userEventListener = listener;
        return this;
    }
    setTag(tag) {
        this.tag = tag;
        return this;
    }
}

export class UIButton extends UIBase {
    constructor(engine, cx, cy, text='button') {
        super(engine, cx, cy);
        this.image = null;
        /** @type TextMetrics */
        this.textSize = null;
        this.rectFillStyle = 'white';
        this.textFillStyle = 'black';
        this.type = this.TYPE_UI_BUTTON;
        this.engine = engine;
        this.text = text;
        this.computeGeometry = () => {
            this.textSize = this.ctx.measureText(this.text);
            this.geometry.width = this.textSize.width + this.geometry.padding * 2;
            this.geometry.height = this.textSize.actualBoundingBoxAscent + this.textSize.actualBoundingBoxDescent + this.geometry.padding * 2;
            this.geometry.x = this.geometry.cx - this.geometry.width/2 - this.geometry.padding;
            this.geometry.y = this.geometry.cy - this.geometry.height/2 - this.geometry.padding;
        };
        this.computeGeometry();
        this.draw = () => {
            this.ctx.save();
            this.ctx.fillStyle = this.rectFillStyle;
            this.ctx.fillRect(this.geometry.x, this.geometry.y, this.geometry.width, this.geometry.height);
            this.ctx.fillStyle = this.textFillStyle;
            this.ctx.fillText(this.text, this.geometry.x + this.geometry.padding, this.geometry.y + this.geometry.padding + this.textSize.actualBoundingBoxAscent);
            this.ctx.restore();
        };
    }
    setText(text) {
        this.text = text;
        this.computeGeometry();
        return this;
    }
}

class UIGeometry {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 80;
        this.height = 20;
        this.cx = 40;
        this.cy = 10;
        this.padding = 5;
    }
    isContained(x, y) {
        return (x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height);
    }
}

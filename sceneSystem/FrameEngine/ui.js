export class UIBase {
    TYPE_UI_BUTTON = 'UIButton';
    type = null;
    engine = null;
    /** @type CanvasRenderingContext2D */
    ctx = null;
    geometry = new UIGeometry();
    tag = null;
    userEventListener = () => {};
    constructor(engine, cx, cy) {
        this.engine = engine;
        this.ctx = engine.getCtx();
        this.geometry.cx = cx;
        this.geometry.cy = cy;
    }
    computeGeometry = () => {};
    draw = () => {};
    eventListener(engine, e) {
        if (e.type === engine.EVENT_TYPE_CLICK) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (this.geometry.isContained(x, y)) {
                this.userEventListener(this);
            }
        }
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
    text = null;
    image = null;
    /** @type TextMetrics */
    textSize = null;
    rectFillStyle = 'white';
    textFillStyle = 'black';
    constructor(engine, cx, cy, text='button') {
        super(engine, cx, cy);
        this.type = this.TYPE_UI_BUTTON;
        this.engine = engine;
        this.text = text;
        this.computeGeometry();
    }
    computeGeometry = () => {
        this.textSize = this.ctx.measureText(this.text);
        this.geometry.width = this.textSize.width + this.geometry.padding * 2;
        this.geometry.height = this.textSize.actualBoundingBoxAscent + this.textSize.actualBoundingBoxDescent + this.geometry.padding * 2;
        this.geometry.x = this.geometry.cx - this.geometry.width/2 - this.geometry.padding;
        this.geometry.y = this.geometry.cy - this.geometry.height/2 - this.geometry.padding;
    };
    draw = () => {
        this.ctx.save();
        this.ctx.fillStyle = this.rectFillStyle;
        this.ctx.fillRect(this.geometry.x, this.geometry.y, this.geometry.width, this.geometry.height);
        this.ctx.fillStyle = this.textFillStyle;
        this.ctx.fillText(this.text, this.geometry.x + this.geometry.padding, this.geometry.y + this.geometry.padding + this.textSize.actualBoundingBoxAscent);
        this.ctx.restore();
    };
    setText(text) {
        this.text = text;
        this.computeGeometry();
        return this;
    }
}

class UIGeometry {
    x = 0;
    y = 0;
    width = 80;
    height = 20;
    cx = 40;
    cy = 10;
    padding = 5;
    isContained(x, y) {
        return (x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height);
    }
}

/**
 * User Interface component base class
 */
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
    }
    computeGeometry () {}
    draw () {}
    eventListener(engine, scene, e) {
        if (e.type === engine.EVENT_TYPE_MOUSEDOWN || e.type === engine.EVENT_TYPE_TOUCHSTART) {
            const coordinate = engine.getEventCoordinates(e);
            if (this.geometry.isContained(coordinate.x, coordinate.y)) {
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

/**
 * Simple Button component
 */
export class UIButton extends UIBase {
    constructor(engine, cx, cy, text='button') {
        super(engine, cx, cy);
        this.imageName = null;
        /** @type TextMetrics */
        this.textSize = null;
        this.fontName = 'serif';
        this.fontSize = 16;
        this.rectFillStyle = 'white';
        this.textFillStyle = 'black';
        this.type = this.TYPE_UI_BUTTON;
        this.engine = engine;
        this.text = text;
        this.shouldComputeGeometry = false;
        this.computeGeometry();
    }
    computeGeometry () {
        if (this.imageName && !this.text) {
            const texture = this.engine.textureMap[this.imageName];
            this.geometry.width = texture.width;
            this.geometry.height = texture.height;
        } else {
            this.ctx.save();
            this.ctx.font = this.fontSize+'px '+this.fontName;
            this.textSize = this.ctx.measureText(this.text);
            this.ctx.restore();
            this.geometry.width = this.textSize.width;
            this.geometry.height = this.fontSize;
        }
        this.geometry.x = this.geometry.cx - this.geometry.width/2;
        this.geometry.y = this.geometry.cy - this.geometry.height/2;
    }
    draw () {
        if (this.shouldComputeGeometry) {
            this.computeGeometry();
            this.shouldComputeGeometry = false;
        }
        this.ctx.save();
        // TODO: add image and text rendering if needed
        if (this.imageName && !this.text) {
            this.engine.drawTexture(this.engine.getCtx(), this.imageName, this.geometry.cx, this.geometry.cy);
            this.ctx.strokeRect(this.geometry.x, this.geometry.y, this.geometry.width, this.geometry.height);
        } else {
            if (this.fontName) {
                this.ctx.font = this.fontSize+'px '+this.fontName;
            }
            this.ctx.fillStyle = this.rectFillStyle;
            this.ctx.fillRect(this.geometry.x, this.geometry.y, this.geometry.width, this.geometry.height);
            this.ctx.fillStyle = this.textFillStyle;
            this.ctx.fillText(this.text, this.geometry.x, this.geometry.y+this.geometry.height);
            this.ctx.restore();
        }
    }
    setText(text) {
        this.text = text;
        this.shouldComputeGeometry = true;
        return this;
    }
    setImage(imageName) {
        this.imageName = imageName;
        // set flag to compute geometry because image geometry is settled after loading texture atlas images
        this.shouldComputeGeometry = true;
        return this;
    }
    setFont(fontName, fontSize=10) {
        this.fontName = fontName;
        this.fontSize = fontSize;
        this.shouldComputeGeometry = true;
        return this;
    }
}

/**
 * ui geometry class
 */
class UIGeometry {
    constructor() {
        this.x = null;
        this.y = null;
        this.width = null;
        this.height = null;
        this.cx = null;
        this.cy = null;
        this.padding = null;
    }
    isContained(x, y) {
        return (x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height);
    }
}

export default class {
    // literals
    // key symbols for event handler
    KEY_SYMBOL_LEFT = 'ArrowLeft';
    KEY_SYMBOL_RIGHT = 'ArrowRight';
    KEY_SYMBOL_UP = 'ArrowUp';
    KEY_SYMBOL_DOWN = 'ArrowDown';
    KEY_SYMBOL_SPACE = 'Space';

    // set canvas
    canvas = null;
    ctx = null;
    setCanvas(canvasId) {
        // set canvas and context
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    }

    getCanvas = () => this.canvas;
    getCtx = () => this.ctx;

    // set frame updating handler
    updateHandler = () => {};
    setUpdateHandler(handler) {
        this.updateHandler = handler;
    }

    // set event handler
    EVENT_TYPE_KEYDOWN = 'keydown';
    EVENT_TYPE_KEYUP = 'keyup';
    EVENT_TYPE_CLICK = 'click';
    setEventHandler(type, handler) {
        this.canvas.addEventListener(type, e => {
            handler(e, type);
            e.preventDefault();
        }, false);
    }

    // start updating canvas frame
    startFrame () {
        requestAnimationFrame(this.drawFrame.bind(this));
    }

    // create texture atlas data structure from control file(js file)
    // TODO: add sprites' border-area
    spriteMap = {};
    async createTextureAtlas(atlas) {
        const imageFiles = atlas.map(file => file.imageFile);
        // load image for sprites
        const images = await this.loadImages(imageFiles);
        // analyze texture atlas structure
        atlas.forEach((file, index) => {
            file.sprites.forEach(_sprite => {
                const sprite = Object.assign({}, _sprite);
                sprite.image = images[index];
                this.spriteMap[sprite.tagName] = sprite;
                console.log('created sprite:'+sprite.tagName);
            });
        });
    }

    // draw sprite on canvas
    drawSprite(ctx, spriteName, x, y) {
        const sprite = this.spriteMap[spriteName] || null;
        if (sprite) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(sprite.rotate * Math.PI/180);
            ctx.drawImage(sprite.image,
                sprite.x, sprite.y, sprite.width, sprite.height,
                -sprite.anchor.x, -sprite.anchor.y, sprite.width, sprite.height);
            ctx.restore();
        }
    }

    // load image files
    async loadImages(imagePaths) {
        return new Promise(resolve => {
            const imagePromises = [];
            imagePaths.forEach(imagePath => imagePromises.push(this.loadImage(imagePath)));
            Promise.all(imagePromises)
                .then(results => resolve(results));
        });
    }

    // loading single image file
    async loadImage(imagePath) {
        return new Promise(resolve => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.src = imagePath;
        });
    }

    // draw frame which calls canvas-update function
    lastMilliSec = null;
    drawFrame(currentTime) {
        const currentMilliSec = currentTime/1000;
        const delta = this.lastMilliSec ? currentMilliSec - this.lastMilliSec : 0;
        this.lastMilliSec = currentMilliSec;
        this.updateHandler(delta);
        requestAnimationFrame(this.drawFrame.bind(this));
    }
};

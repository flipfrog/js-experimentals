import atlas from "./atlas.js";

export default class {
    canvas = document.getElementById('canvas_1');
    ctx = this.canvas.getContext('2d');

    constructor(atlas) {
        this.createTextureAtlas(atlas)
            .then(() => {
                console.log('*** completed loading texture-atlas.');
                // register key event procedure
                this.canvas.addEventListener('keydown', e => this.procKeyEvents(e, this.KEY_KEYDOWN), false);
                this.canvas.addEventListener('keyup', e => this.procKeyEvents(e, this.KEY_KEYUP), false);
                this.canvas.addEventListener('click', e => this.procMouseClick(e), false);
            });
    }

    startFrame () {
        // start updating canvas frame
        requestAnimationFrame(this.drawFrame.bind(this));
    }

    // process mouse click
    procMouseClick(e) {
        const rect = e.target.getBoundingClientRect();
        this.x = e.clientX - rect.left;
        this.y = e.clientY - rect.top;
    }

    // process key events
    KEY_KEYDOWN = 'keydown';
    KEY_KEYUP = 'keyup';
    KEY_LEFT = 'ArrowLeft';
    KEY_RIGHT = 'ArrowRight';
    KEY_UP = 'ArrowUp';
    KEY_DOWN = 'ArrowDown';
    KEY_SPACE = 'Space';
    KEY_ARROW_KEYS = [this.KEY_LEFT, this.KEY_RIGHT, this.KEY_UP, this.KEY_DOWN];
    arrowKeyDownStatuses = {ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false};
    spaceKeyDownStatus = false;
    procKeyEvents(e, handleType) {
        // check arrow keys
        if (this.KEY_ARROW_KEYS.indexOf(e.key) >= 0) {
            this.arrowKeyDownStatuses[e.key] = (handleType === this.KEY_KEYDOWN);
        }
        // check space key
        if (e.key === this.KEY_SPACE) {
            this.spaceKeyDownStatus = (handleType === this.KEY_KEYDOWN);
        }
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
    drawSprite(ctx, sprite, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(sprite.rotate * Math.PI/180);
        ctx.drawImage(sprite.image,
            sprite.x, sprite.y, sprite.width, sprite.height,
            -sprite.anchor.x, -sprite.anchor.y, sprite.width, sprite.height);
        ctx.restore();
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
        this.update(delta);
        requestAnimationFrame(this.drawFrame.bind(this));
    }

    // update canvas
    x = 50;
    y = 50;
    pps = 20; // speed px/sec
    update(delta) {
        // move sprite according to keydown status of arrow keys.
        const pxDelta = delta * this.pps;
        if (this.arrowKeyDownStatuses[this.KEY_LEFT]) {
            this.x = (this.x - pxDelta) % this.canvas.width;
        }
        if (this.arrowKeyDownStatuses[this.KEY_RIGHT]) {
            this.x = (this.x + pxDelta) % this.canvas.width;
        }
        if (this.arrowKeyDownStatuses[this.KEY_UP]) {
            this.y = (this.y - pxDelta) % this.canvas.height;
        }
        if (this.arrowKeyDownStatuses[this.KEY_DOWN]) {
            this.y = (this.y + pxDelta) % this.canvas.height;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawSprite(this.ctx, this.spriteMap['pengo_2.png'], this.x, this.y);
    }
};

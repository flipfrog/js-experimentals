export default class {
    // literals
    VERSION = '1.0.0';
    // key symbols for event handler
    KEY_SYMBOL_LEFT = 'ArrowLeft';
    KEY_SYMBOL_RIGHT = 'ArrowRight';
    KEY_SYMBOL_UP = 'ArrowUp';
    KEY_SYMBOL_DOWN = 'ArrowDown';
    KEY_SYMBOL_SPACE = 'Space';

    // display fps
    displayFps = false;

    // data
    clientData = {};

    // canvas as backing store data
    /** @type HTMLCanvasElement */
    offScreenCanvas = null;
    offScreenCtx = null;
    // set canvas
    /** @type HTMLCanvasElement */
    canvas = null;
    /** @type CanvasRenderingContext2D */
    ctx = null;
    setCanvas(canvasId, useOffScreenCanvas=false) {
        // set canvas and context
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        if (useOffScreenCanvas) {
            this.offScreenCanvas = document.createElement('canvas');
            this.offScreenCanvas.width = this.canvas.width;
            this.offScreenCanvas.height = this.canvas.height;
            this.offScreenCtx = this.offScreenCanvas.getContext('2d');
        }
    }

    // set client data
    setClientData(data) {
        this.clientData = Object.assign({}, data);
    }

    getClientData = () => this.clientData;
    getCanvas = () => (this.offScreenCanvas ? this.offScreenCanvas : this.canvas);
    getCtx = () => (this.offScreenCtx ? this.offScreenCtx : this.ctx);
    setDisplayFps = (displayFps) => {this.displayFps = displayFps};

    // set user-update handler
    updateHandler = () => {};
    setUpdateHandler(handler) {
        this.updateHandler = handler;
    }

    // add sprite to array
    sprites = {};
    spriteMap = {};
    addSprite(sprite) {
        if (!this.sprites[sprite.layerNo]) {
            this.sprites[sprite.layerNo] = {};
        }
        if(!this.sprites[sprite.layerNo][sprite.tag] && !this.spriteMap[sprite.tag]) {
            this.sprites[sprite.layerNo][sprite.tag] = sprite;
            this.spriteMap[sprite.tag] = sprite;
        } else {
            console.log(`sprite tag name ${sprite.tag} already exits`);
        }
    }

    // remove sprite
    removeSprite(tag) {
        const layerNos = Object.keys(this.sprites);
        let emptyLayerNo = -1;
        layerNos.forEach(layerNo => {
            if (this.sprites[layerNo][tag] && this.spriteMap[tag]) {
                delete this.sprites[layerNo][tag];
                delete this.spriteMap[tag];
            } else {
                console.log(`sprite tag name ${tag} does not exist`);
            }
            if (this.sprites[layerNo].length === 0) {
                emptyLayerNo = layerNo;
            }
        });
        if (emptyLayerNo >= 0) {
            delete this.sprites[emptyLayerNo];
        }
    }

    // get sprite
    getSprite(tag) {
        return this.spriteMap[tag] || null;
    }

    // add particle
    particles = [];
    addParticle(particle) {
        this.particles.push(particle);
    }

    // set event handler
    EVENT_TYPE_KEYDOWN = 'keydown';
    EVENT_TYPE_KEYUP = 'keyup';
    EVENT_TYPE_CLICK = 'click';
    setEventHandler(type, handler) {
        this.canvas.addEventListener(type, e => {
            handler(this, e, type);
            e.preventDefault();
        }, false);
    }

    // start updating canvas frame
    startFrame () {
        requestAnimationFrame(this.drawFrame.bind(this));
    }

    // create texture atlas data structure from control file(js file)
    // TODO: add textures' border-area
    textureMap = {};
    async loadTextureAtlas(atlas) {
        const imageFiles = atlas.map(file => file.imageFile);
        // load image for textures
        const images = await this.loadImages(imageFiles);
        // analyze texture atlas structure
        atlas.forEach((file, index) => {
            file.textures.forEach(texture => {
                texture.image = images[index];
                this.textureMap[texture.name] = texture;
            });
        });
    }

    // draw texture on canvas
    drawTexture(ctx, texturesName, x, y, rotate = 0) {
        const texture = this.textureMap[texturesName] || null;
        if (texture) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((texture.rotate + rotate)* Math.PI/180);
            ctx.drawImage(texture.image,
                texture.x, texture.y, texture.width, texture.height,
                -texture.anchor.x, -texture.anchor.y, texture.width, texture.height);
            ctx.restore();
        }
    }

    // load image files
    async loadImages(imagePaths) {
        return new Promise(resolve => {
            const imagePromises = imagePaths.map(imagePath => this.loadImage(imagePath));
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

    // draw frame which calls user-update handler function
    lastMilliSec = null;
    drawFrame(currentTime) {
        const currentMilliSec = currentTime/1000;
        const delta = this.lastMilliSec ? currentMilliSec - this.lastMilliSec : 0;
        const ctx = (this.offScreenCtx ? this.offScreenCtx : this.ctx);
        this.lastMilliSec = currentMilliSec;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateHandler(this, delta);
        // draw sprites
        const spriteLayerNos = Object.keys(this.sprites);
        spriteLayerNos.forEach(layerNo => {
            const spriteTags = Object.keys(this.sprites[layerNo]);
            spriteTags.forEach(spriteTag => this.sprites[layerNo][spriteTag].draw());
        });
        // draw particles
        this.particles.forEach(particle => particle.update(this, delta));
        if (this.displayFps) {
            const fps = (1/delta).toFixed(1);
            ctx.save();
            ctx.fillStyle = 'black';
            ctx.font = '24px';
            ctx.fillText(fps+' fps', 10, 10);
            ctx.restore();
        }
        if (this.offScreenCanvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.offScreenCanvas,
                0, 0, this.canvas.width, this.canvas.height,
                0, 0, this.canvas.width, this.canvas.height);
        }
        requestAnimationFrame(this.drawFrame.bind(this));
    }
};

export class Sprite {
    x = 0;
    y = 0;
    rotate = 0;
    name = null;
    layerNo = 0;
    tag = null;

    /**
     * constructor
     * @param engine frame engine
     * @param name texture name
     * @param layerNo drawing layer no
     * @param tag tag name
     */
    constructor(engine, name, layerNo, tag) {
        this.engine = engine;
        this.name = name;
        this.layerNo = layerNo;
        this.tag = tag;
    }
    // set sprite's position (and rotation)
    setPosition(x, y, rotate = 0) {
        [this.x, this.y, this.rotate] = [x, y, rotate];
    }
    // draw sprite
    draw = () => this.engine.drawTexture(this.engine.getCtx(), this.name, this.x, this.y, this.rotate);
}

export class Particle { // divide into base and concrete class
    cx = 0;
    cy = 0;
    textureName = null;
    options = {
        duration: 1, // sec
        initialVelocity: 10, // px/sec
        fixedVelocityRatio: .7, // fixed velocity ratio
        radius: 50, // px
        initialAlpha: 1,
        numTextures: 30,
        angularVelocity: 0, // deg/sec for sprite rotation
    };
    textures = [];
    // initialize own parameters
    constructor(cx, cy, textureName, options={}) {
        // set specified option values
        Object.keys(this.options).forEach(key => {
            this.options[key] = (options[key] ? options[key] : this.options[key]);
        });
        [this.cx, this.cy, this.textureName] = [cx, cy, textureName];

        for (let i = 0; i < this.options.numTextures; i++) {
            const texture = new ParticleTexture(); // TODO: be vary particle textures
            [texture.x, texture.y, texture.textureName] = [this.cx, this.cy, textureName];
            // compose texture velocities of fix and elastic part
            const baseVx = Math.cos(Math.random() * Math.PI * 2) * this.options.initialVelocity;
            const baseVy = Math.sin(Math.random() * Math.PI * 2) * this.options.initialVelocity;
            const fixedVelocityRate = this.options.fixedVelocityRatio;
            const elasticVelocityRatio = (1 - this.options.fixedVelocityRatio);
            const vx = baseVx * fixedVelocityRate + baseVx * elasticVelocityRatio * Math.random();
            const vy = baseVy * fixedVelocityRate + baseVy * elasticVelocityRatio * Math.random();
            [texture.initialVx, texture.initialVy] = [vx, vy];
            this.textures.push(texture);
        }
    }
    // update textures
    update(engine, delta) {
        this.textures = this.textures.filter(texture => {
            return texture.elapsedTime < this.options.duration;
        });
        this.textures.forEach(texture => texture.updateCoordinate(delta));
        this.textures.forEach(texture => texture.draw(engine));
    }
}

class ParticleTexture { // divide into base and concrete class
    elapsedTime = 0;
    x = 0;
    y = 0;
    initialVx = 0; // px/sec
    initialVy = 0; // px/sec
    vx = 0; // px/sec
    vy = 0; // px/sec
    rotate = 0;
    vr = 0; // deg/sec
    textureName = null;
    updateCoordinate(delta) {
        this.elapsedTime += delta;
        const velocityMultiplyValue = 1/(1 - Math.pow(Math.E, this.elapsedTime)); // TODO: may need adjust a decay rate
        this.vx = this.initialVx * velocityMultiplyValue; // TODO: to be more efficiency
        this.vy = this.initialVy * velocityMultiplyValue;
        this.x += (this.vx * delta);
        this.y += (this.vy * delta);
        this.rotate += (this.vr * delta);
    }
    draw(engine) {
        const ctx = engine.getCtx();
        engine.drawTexture(ctx, this.textureName, this.x, this.y, this.rotate); // TODO: to be using raw interface to get rendering speed up
    }
}

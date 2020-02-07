//
// Frame Update Engine
// It needs importing particle.js.
//
import {DecayedImageGenerator} from "./image.js";
import {UIBase} from './ui.js';

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

    // Scenes
    scenes = [];
    currentSceneIndex = null;

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

    // setter and getters
    setClientData(data) {
        this.clientData = Object.assign({}, data);
    }
    getClientData = () => this.clientData;
    getCanvas = () => (this.offScreenCanvas ? this.offScreenCanvas : this.canvas);
    getCtx = () => (this.offScreenCtx ? this.offScreenCtx : this.ctx);
    setDisplayFps = (displayFps) => {this.displayFps = displayFps};

    // add scene
    addScene(scene) {
        scene.index = this.scenes.length;
        this.scenes.push(scene);
    }

    // get scene
    getScene(index) {
        return this.scenes[index];
    }

    // get current scene
    getCurrentScene() {
        return this.scenes[this.currentSceneIndex];
    }

    // get current scene index
    getCurrentSceneIndex() {
        return this.currentSceneIndex;
    }

    // change scene
    changeScene(index, useTransition=true) {
        if (index !== this.currentSceneIndex) {
            console.log('changing scene to #'+index);
            // remove event listeners
            if (this.currentSceneIndex !== null) {
                if (useTransition) {
                    // TODO implement transition
                    console.log('changing scene: #'+this.currentSceneIndex+' to #'+index);
                }
            }
            this.currentSceneIndex = index;
        }
    }

    // change scene specified by tag
    changeSceneByTag(tag, useTransition=true) {
        for (let index = 0; index < this.scenes.length; index++) {
            if (this.scenes[index].tag === tag) {
                this.changeScene(index, useTransition);
                break;
            }
        }
    }

    // set event handler
    EVENT_TYPE_KEYDOWN = 'keydown';
    EVENT_TYPE_KEYUP = 'keyup';
    EVENT_TYPE_CLICK = 'click';

    // start updating canvas frame
    startFrame () {
        this.canvas.addEventListener(this.EVENT_TYPE_KEYDOWN, this.eventListenerIn.bind(this), false);
        this.canvas.addEventListener(this.EVENT_TYPE_KEYUP, this.eventListenerIn.bind(this), false);
        this.canvas.addEventListener(this.EVENT_TYPE_CLICK, this.eventListenerIn.bind(this), false);
        requestAnimationFrame(this.drawFrame.bind(this));
    }

    // event listener which calls user event listeners
    eventListenerIn(e) {
        const scene = this.scenes[this.currentSceneIndex];
        if (scene) {
            // process ui object events primarily
            const processed = scene.uiObjects.reduce((acc, uiObject) => {return acc || uiObject.eventListener(this, scene, e)}, false);
            if (!processed) {
                scene.eventListener(this, scene, e);
            }
        }
        e.preventDefault()
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
                // make decayed intensity images if needed
                if (texture.intensityDecay) {
                    texture.canvasArray = [];
                    const generator = new DecayedImageGenerator(texture.image);
                    for (let imageData of generator.generateImages(texture.intensityDecay)) {
                        texture.canvasArray.push(imageData.canvas);
                    }
                }
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
            ctx.rotate((texture.rotate + rotate) * Math.PI / 180);
            ctx.drawImage(texture.image,
                texture.x, texture.y, texture.width, texture.height,
                -texture.anchor.x, -texture.anchor.y, texture.width, texture.height);
            ctx.restore();
        }
    }

    // put intensity decayed image data to canvas
    putDecayTexture(ctx, texturesName, x, y, index, rotate=0) {
        const texture = this.textureMap[texturesName] || null;
        if (texture) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((texture.rotate + rotate) * Math.PI / 180);
            ctx.drawImage(texture.canvasArray[index],
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
        const currentScene = this.scenes[this.currentSceneIndex];
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        currentScene.updateHandler(this, currentScene, delta);
        // draw sprites
        const spriteLayerNos = Object.keys(currentScene.sprites);
        spriteLayerNos.forEach(layerNo => {
            const spriteTags = Object.keys(currentScene.sprites[layerNo]);
            spriteTags.forEach(spriteTag => currentScene.sprites[layerNo][spriteTag].draw());
        });
        // draw particles TODO: delegate it to scene class
        //currentScene.particles.forEach(particle => particle.update(this, delta));
        currentScene.updateParticles(delta);
        currentScene.updateUIObjects();
        // draw fps
        if (this.displayFps) {
            const fps = (1/delta).toFixed(1);
            ctx.save();
            ctx.fillStyle = 'red';
            ctx.font = '24px';
            ctx.fillText(fps+' fps', 10, 10);
            ctx.restore();
        }
        // render off screen canvas if using
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

export class Scene {
    engine = null;
    tag = null;
    index = null;
    /** @type UIBase[] */
    uiObjects = [];
    // data
    clientData = {};
    // event listeners
    eventListeners = [];
    activeEventListenerIndices = [];
    // event listener
    eventListener = () => {};
    // frame update handler
    updateHandler = () => {};

    constructor(engine) {
        this.engine = engine;
    }

    // set and get client data
    setClientData(data) {
        this.clientData = Object.assign({}, data);
    }
    getClientData = () => this.clientData;

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

    // update and draw particle frame
    updateParticles(delta) {
        this.particles.forEach(particle => particle.updateAndDraw(this.engine, delta));
        // delete unused particles
        this.particles = this.particles.filter(particle => particle.inProgress);
    }

    updateUIObjects() {
        this.uiObjects.forEach(uiObjects => uiObjects.draw());
    }

    // add UI object
    addUIObject(uiObject) {
        this.uiObjects.push(uiObject);
    }

    // TODO: implement removing particle
}

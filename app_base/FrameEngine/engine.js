import {DecayedImageGenerator} from "./image.js";
import {UIBase} from './ui.js';

/**
 * Canvas frame rendering engine class
 */
export default class FrameEngine {
    constructor() {
        // literals
        this.VERSION = '1.0.0';
        // key symbols for event handler
        this.KEY_SYMBOL_LEFT = 'ArrowLeft';
        this.KEY_SYMBOL_RIGHT = 'ArrowRight';
        this.KEY_SYMBOL_UP = 'ArrowUp';
        this.KEY_SYMBOL_DOWN = 'ArrowDown';
        this.KEY_SYMBOL_SPACE = 'Space';

        // display fps
        this.displayFps = false;

        // data
        this.clientData = {};

        // Scenes
        this.scenes = [];
        this.currentSceneIndex = null;
        this.requestedSceneIndex = null;

        // Transition
        this.transition = null;

        // canvas as backing store data
        this.offScreenCanvas = null;
        this.offScreenCtx = null;
        // set canvas
        this.canvas = null;
        /** @type CanvasRenderingContext2D */
        this.ctx = null;

        // set event handler
        this.EVENT_TYPE_KEYDOWN = 'keydown';
        this.EVENT_TYPE_KEYUP = 'keyup';
        this.EVENT_TYPE_CLICK = 'click';
        this.EVENT_TYPE_MOUSEDOWN = 'mousedown';
        this.EVENT_TYPE_TOUCHSTART = 'touchstart';
        this.EVENT_TYPE_TOUCHEND = 'touchend';
        this.EVENT_TYPE_TOUCHCANCEL = 'touchcancel';
        this.EVENT_TYPE_TOUCHMOVE = 'touchmove';

        this.textureMap = {};
        this.lastMilliSec = null;
    }

    /**
     * set canvas to render
     * @param canvasId canvas tag's id
     * @param useOffScreenCanvas set false to disable using original implemented off-screen-canvas
     */
    setCanvas(canvasId, useOffScreenCanvas=true) {
        // set canvas and context
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        if (useOffScreenCanvas) {
            this.offScreenCanvas = document.createElement('canvas');
            this.offScreenCanvas.width = this.canvas.width;
            this.offScreenCanvas.height = this.canvas.height;
            this.offScreenCtx = this.offScreenCanvas.getContext('2d');
        }
        // disable context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * set client data for management app status and so on
     * @param data
     */
    setClientData(data) {
        this.clientData = Object.assign({}, data);
    }
    /**
     * get client data for management app status and so on
     */
    getClientData() {
        return this.clientData;
    }

    /**
     * get current canvas element
     * @returns HTMLCanvasElement
     */
    getCanvas() {
        return this.offScreenCanvas ? this.offScreenCanvas : this.canvas;
    }

    /**
     * get canvas context
     * @returns CanvasRenderingContext2D
     */
    getCtx() {
        return this.offScreenCtx ? this.offScreenCtx : this.ctx;
    }

    /**
     * toggle displaying fps left up on screen
     * @param displayFps
     */
    setDisplayFps(displayFps) {
        this.displayFps = displayFps;
    }

    /**
     * add scene to engine
     * @param scene
     */
    addScene(scene) {
        scene.index = this.scenes.length;
        this.scenes.push(scene);
    }

    /**
     * get scene object by index
     * @param index
     * @returns Scene
     */
    getScene(index) {
        return this.scenes[index];
    }

    /**
     * get current scene object
     * @returns Scene
     */
    getCurrentScene() {
        return this.scenes[this.currentSceneIndex];
    }

    /**
     * get current scene index
     * @returns number
     */
    getCurrentSceneIndex() {
        return this.currentSceneIndex;
    }

    /**
     * change scene
     * @param index request scene index to change
     * @param transitionObj transition object if needed
     */
    changeScene(index, transitionObj=null) {
        if (index !== this.currentSceneIndex) {
            console.log('changing scene to #'+index);
            // remove event listeners
            if (this.currentSceneIndex !== null) {
                if (transitionObj) {
                    console.log('requested to change scene: #'+this.currentSceneIndex+' to #'+index);
                    this.transition = transitionObj;
                    this.requestedSceneIndex = index;
                } else {
                    this.scenes[this.currentSceneIndex].beforeLeaveHandler(this, this.scenes[this.currentSceneIndex]);
                    this.scenes[index].beforeEnterHandler(this, this.scenes[index]);
                    this.currentSceneIndex = index;
                }
            } else {
                this.scenes[index].beforeEnterHandler(this, this.scenes[index]);
                this.currentSceneIndex = index;
            }
        }
    }

    /**
     * change scene by tag
     * @param tag request scene tag to change
     * @param useTransitionObj transition object if needed
     */
    changeSceneByTag(tag, useTransitionObj=null) {
        for (let index = 0; index < this.scenes.length; index++) {
            if (this.scenes[index].tag === tag) {
                this.changeScene(index, useTransitionObj);
                break;
            }
        }
    }

    /**
     * start updating canvas loop on refreshing cycle
     */
    startFrame() {
        // setup event listeners
        const listener = this.eventListenerIn.bind(this);
        this.canvas.addEventListener(this.EVENT_TYPE_CLICK, listener, false);
        this.canvas.addEventListener(this.EVENT_TYPE_KEYDOWN, listener, false);
        this.canvas.addEventListener(this.EVENT_TYPE_KEYUP, listener, false);
        this.canvas.addEventListener(this.EVENT_TYPE_MOUSEDOWN, listener, false);
        this.canvas.addEventListener(this.EVENT_TYPE_TOUCHSTART, listener, false);
        this.canvas.addEventListener(this.EVENT_TYPE_TOUCHMOVE, listener, false);
        this.canvas.addEventListener(this.EVENT_TYPE_TOUCHEND, listener, false);
        this.canvas.addEventListener(this.EVENT_TYPE_TOUCHCANCEL, listener, false);
        // schedule for update canvas
        requestAnimationFrame(this.drawFrame.bind(this));
    }

    /**
     * event listener which calls user event listeners
     * @param e
     */
    eventListenerIn(e) {
        const scene = this.scenes[this.currentSceneIndex];
        if (scene) {
            // process ui object events primarily
            const processed = scene.uiObjects.reduce((acc, uiObject) => {return acc || uiObject.eventListener(this, scene, e)}, false);
            if (!processed) {
                scene.eventListener(this, scene, e);
            }
        }
        if (e.type !== this.EVENT_TYPE_MOUSEDOWN) {
            // when mousedown event occurred it needs a system's default process to get focus
            e.preventDefault()
        }
    }

    /**
     * load texture atlas structure from file
     * @param _atlas texture atlas url or js-object
     * @returns {Promise<void>}
     */
    async loadTextureAtlas(_atlas) {
        let atlas = _atlas;
        if (typeof _atlas === "string") {
            atlas = (await import(_atlas)).default;
        }
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
                    for (let imageData of generator.generateImages(texture.intensityDecay, texture.settleColor)) {
                        texture.canvasArray.push(imageData.canvas);
                    }
                }
                this.textureMap[texture.name] = texture;
            });
        });
    }

    /**
     * draw texture on canvas
     * @param ctx canvas context
     * @param texturesName texture name entry in texture atlas structure
     * @param x canvas position x
     * @param y canvas position y
     * @param rotate rotate by degree
     */
    drawTexture(ctx, texturesName, x, y, rotate = 0) {
        const texture = this.textureMap[texturesName] || null;
        if (texture) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((texture.rotate + rotate) * Math.PI / 180);
            ctx.drawImage(texture.image,
                texture.x, texture.y, texture.width, texture.height,
                -texture.anchor.x * texture.width, -texture.anchor.y * texture.height, texture.width, texture.height);
            ctx.restore();
        }
    }

    /**
     * get texture size from loaded textures.
     * @param texturesName
     * @returns {{width: *, height: *}|null}
     */
    getTextureSize(texturesName) {
        const texture = this.textureMap[texturesName] || null;
        return texture ? {width: texture.width, height: texture.height} : null;
    }

    /**
     * put intensity decayed image data to canvas for displaying particles
     * @param ctx canvas context
     * @param texturesName texture name entry in texture atlas structure
     * @param x canvas position x
     * @param y y canvas position y
     * @param index decaying index
     * @param rotate rotate by degree
     */
    putDecayTexture(ctx, texturesName, x, y, index, rotate=0) {
        const texture = this.textureMap[texturesName] || null;
        if (texture) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((texture.rotate + rotate) * Math.PI / 180);
            ctx.drawImage(texture.canvasArray[index],
                texture.x, texture.y, texture.width, texture.height,
                -texture.anchor.x * texture.width, -texture.anchor.y * texture.height, texture.width, texture.height);
            ctx.restore();
        }
    }

    /**
     * load image files
     * @param imagePaths array of image url
     * @returns {Promise<HTMLImageElement[]>}
     */
    async loadImages(imagePaths) {
        return new Promise(resolve => {
            const imagePromises = imagePaths.map(imagePath => this.loadImage(imagePath));
            Promise.all(imagePromises)
                .then(results => resolve(results));
        });
    }

    /**
     * load single image file
     * @param imagePath image url
     * @returns {Promise<HTMLImageElement>}
     */
    async loadImage(imagePath) {
        return new Promise(resolve => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.src = imagePath;
        });
    }

    /**
     * draw frame and call a user defined update handler
     * @param currentTime
     */
    drawFrame(currentTime) {
        const currentMilliSec = currentTime/1000;
        const delta = this.lastMilliSec ? currentMilliSec - this.lastMilliSec : 0;
        const ctx = (this.offScreenCtx ? this.offScreenCtx : this.ctx);
        this.lastMilliSec = currentMilliSec;
        const currentScene = this.scenes[this.currentSceneIndex];
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.requestedSceneIndex === null) {
            // update and draw scene
            currentScene.updateHandler(this, currentScene, delta);
            currentScene.draw(this, delta);
        } else {
            // draw transition
            if (this.transition.draw(this, delta)) {
                // change scene control
                this.scenes[this.currentSceneIndex].beforeLeaveHandler(this, this.scenes[this.currentSceneIndex]);
                this.scenes[this.requestedSceneIndex].beforeEnterHandler(this, this.scenes[this.requestedSceneIndex]);
                this.currentSceneIndex = this.requestedSceneIndex;
                this.requestedSceneIndex = null;
                this.transition = null;
            }
        }
        // draw fps
        if (this.displayFps) {
            const fps = (1/delta).toFixed(1);
            ctx.save();
            ctx.fillStyle = 'red';
            ctx.font = '24px';
            ctx.fillText(fps+' fps', 10, 10);
            ctx.restore();
        }
        // expose off-screen-canvas
        if (this.offScreenCanvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.offScreenCanvas,
                0, 0, this.canvas.width, this.canvas.height,
                0, 0, this.canvas.width, this.canvas.height);
        }
        requestAnimationFrame(this.drawFrame.bind(this));
    }

    /**
     * get coordinate (x, y) of event objects
     * @param e js event object
     * @returns {{x: number, y: number}}
     */
    getEventCoordinates(e) {
        switch(e.type) {
            case this.EVENT_TYPE_TOUCHSTART:
            case this.EVENT_TYPE_TOUCHMOVE:
                const rectTouch = e.target.getBoundingClientRect();
                const touch = e.touches[0];
                return {x: touch.clientX - rectTouch.left, y: touch.clientY - rectTouch.top};
            case this.EVENT_TYPE_MOUSEDOWN:
            case this.EVENT_TYPE_CLICK:
                const rectMouse = e.target.getBoundingClientRect();
                return {x: e.clientX - rectMouse.left, y: e.clientY - rectMouse.top};
            default:
                return {x: 0, y: 0};
        }
    }

    /**
     * check retina display
     * @returns {boolean}
     */
    isRetinaDisplay() {
        return window.devicePixelRatio > 1;
    }
}

/**
 * sprite class
 */
export class Sprite {
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
        this.x = 0;
        this.y = 0;
        this.rotate = 0;
    }
    /**
     * set sprite's position (and rotation)
     * @param x
     * @param y
     * @param rotate
     * @returns {Sprite}
     */
    setPosition(x, y, rotate = 0) {
        [this.x, this.y, this.rotate] = [x, y, rotate];
        return this;
    }
    /**
     * draw sprite
     */
    draw() {
        this.engine.drawTexture(this.engine.getCtx(), this.name, this.x, this.y, this.rotate);
    }
}

/**
 * scene class
 */
export class Scene {
    constructor(engine, tag=null) {
        this.engine = engine;
        this.tag = tag;
        this.index = null;
        /** @type UIBase[] */
        this.uiObjects = [];
        // data
        this.clientData = {};
        // event listeners
        this.eventListeners = [];
        this.activeEventListenerIndices = [];
        this.sprites = {};
        this.spriteMap = {};
        this.particles = [];
        // event listener
        this.eventListener = function (engine, scene, e) {};
        // frame update handler
        this.updateHandler = function (engine, scene, delta) {};
        // will be called when scene is about to change(active)
        this.beforeEnterHandler = function (engine, scene) {};
        this.beforeLeaveHandler = function (engine, scene) {};
    }
    /**
     * set client data
     * @param data
     */
    setClientData(data) {
        this.clientData = Object.assign({}, data);
    }
    /**
     * get client data
     * @returns {{}}
     */
    getClientData() {
        return this.clientData;
    }
    /**
     * add sprite to array
     * @param sprite
     */
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
    /**
     * remove sprite by tag
     * @param tag
     */
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
    /**
     * get sprite by tag
     * @param tag
     * @returns {*|null}
     */
    getSprite(tag) {
        return this.spriteMap[tag] || null;
    }
    /**
     * add particle system
     * @param particle
     */
    addParticle(particle) {
        this.particles.push(particle);
    }
    /**
     * remove all particles
     */
    removeAllParticles() {
        this.particles = [];
    }
    /**
     * update and filter particle systems
     * @param delta
     */
    updateParticles(delta) {
        this.particles.forEach(particle => particle.updateAndDraw(this.engine, delta));
        // delete unused particles
        this.particles = this.particles.filter(particle => particle.inProgress);
    }
    /**
     * update ui objects
     */
    updateUIObjects() {
        this.uiObjects.forEach(uiObjects => uiObjects.draw());
    }
    /**
     * add UI object
     * @param uiObject
     */
    addUIObject(uiObject) {
        this.uiObjects.push(uiObject);
    }
    /**
     * draw scene(draw sprites and particle systems)
     * @param engine
     * @param delta
     */
    draw(engine, delta) {
        // draw sprites
        const spriteLayerNos = Object.keys(this.sprites);
        spriteLayerNos.forEach(layerNo => {
            const spriteTags = Object.keys(this.sprites[layerNo]);
            spriteTags.forEach(spriteTag => this.sprites[layerNo][spriteTag].draw());
        });
        // draw particles
        this.updateParticles(delta);
        this.updateUIObjects();
    }
    /**
     * set tag
     * @param tag
     */
    setTag(tag) {
        this.tag = tag;
    }
}

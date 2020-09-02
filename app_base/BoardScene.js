import {Sprite, Scene} from "./FrameEngine/engine.js";
import {TransitionSwipe} from "./FrameEngine/transition.js";

export class BoardScene extends Scene{
    boardState = 0;
    readySprite = null;
    elapsedTimes = {};
    constructor(engine, tagName=null) {
        super(engine, tagName);
        this.updateHandler = this.updateBoardScene;
        const spriteName = engine.isRetinaDisplay() ? 'pengo_2.png x2' : 'pengo_2.png';
        this.addSprite(new Sprite(engine, spriteName, 0, 'sprite_0').setPosition(100, 100));
        this.beforeEnterHandler = () => this.boardState = 0;
        this.beforeLeaveHandler = () => this.removeAllParticles();
    }
    
    // update canvas
    updateBoardScene(engine, scene, delta) {
        this.elapsedTime += delta;
        const shouldContinueScene = this.updateBoardSceneIn(engine, scene, delta, this.elapsedTime);
        if(!shouldContinueScene && engine.requestedSceneIndex === null) {
            console.log('*** change scene to next.');
            engine.changeSceneByTag('score_scene', new TransitionSwipe());
        }
    }
    updateBoardSceneIn(engine, scene, delta, elapsedTime) {
        const canvas = engine.getCanvas();
        const data = scene.getClientData();
        const sprite = scene.getSprite('sprite_0');
        if (sprite) {
            let x = sprite.x;
            let y = sprite.y;
            const pps = data.pps;
            // move sprite according to keydown status of arrow keys.
            const pxDelta = delta * pps;
            if (data.arrowKeyDownStatuses[engine.KEY_SYMBOL_LEFT]) {
                x = (x - pxDelta) % canvas.width;
            }
            if (data.arrowKeyDownStatuses[engine.KEY_SYMBOL_RIGHT]) {
                x = (x + pxDelta) % canvas.width;
            }
            if (data.arrowKeyDownStatuses[engine.KEY_SYMBOL_UP]) {
                y = (y - pxDelta) % canvas.height;
            }
            if (data.arrowKeyDownStatuses[engine.KEY_SYMBOL_DOWN]) {
                y = (y + pxDelta) % canvas.height;
            }
            const rotate = sprite.rotate + delta * 45;
            sprite.setPosition(x, y, rotate);
        }
        switch (this.boardState) {
            case 0:
                this.procState0(engine, scene, delta);
                break;
            case 1:
                this.procState1(engine, scene, delta);
                break;
            case 2:
                this.procState2(engine, scene, delta);
                break;
            default:
                this.procState3(engine, scene, delta);
                return false;
        }
        return true;
    }
    procState0(engine, scene, delta) {
        const [centerX, centerY] = [engine.getCanvas().width/2, engine.getCanvas().height/2];
        this.readySprite = new Sprite(engine, 'ready.png', 0, 'ready').setPosition(centerX, centerY);
        scene.addSprite(this.readySprite);
        // TODO: draw other objects.
        this.elapsedTimes['procState1'] = 0;
        this.boardState = 1;
    }
    procState1(engine, scene, delta) {
        this.elapsedTimes['procState1'] += delta;
        if (this.elapsedTimes['procState1'] > 1) {
            scene.removeSprite('ready');
            this.boardState = 2;
            this.elapsedTimes['procState2'] = 0;
        } else {
            // TODO: draw other objects.
        }
    }
    procState2(engine, scene, delta) {
        this.elapsedTimes['procState2'] += delta;
        if (this.elapsedTimes['procState2'] > 3) {
            this.boardState = 3;
        } else {
            // TODO: draw other objects.
        }
    }
    procState3(engine, scene, delta) {
        console.log('*** procState3(); ');
    }
}

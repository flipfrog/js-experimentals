export class TransitionBase {
    constructor() {
        this.t = 0;
        this.draw = () => true;
    }
}

export class TransitionSwipe extends TransitionBase {
    constructor(wipeSpeed = 2000) {
        super();
        this.wipeSpeed = wipeSpeed;
        // wipe out current scene while wipe in next scene
        this.draw = (engine, delta) => {
            this.t += delta;
            if (this.t * this.wipeSpeed > engine.getCanvas().width) {
                return true;
            }
            const ctx = engine.getCtx();
            ctx.save();
            const xOffset = this.t * this.wipeSpeed;
            const currentScene = engine.scenes[engine.currentSceneIndex];
            ctx.translate(xOffset, 0);
            currentScene.updateHandler(engine, currentScene, delta);
            currentScene.draw(this, delta);
            const nextScene = engine.scenes[engine.requestedSceneIndex];
            ctx.translate(-(engine.getCanvas().width - xOffset) - xOffset, 0);
            nextScene.updateHandler(engine, nextScene, delta);
            nextScene.draw(this, delta);
            ctx.restore();
            return false;
        }
    }
}

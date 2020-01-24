import FrameEngine from "./FrameEngine.js";
import atlas from './atlas.js';

(function(){
    const engine = new FrameEngine();
    engine.setCanvas('canvas_1');
    engine.setUpdateHandler(update);
    // register key event procedure
    engine.setEventHandler(engine.EVENT_TYPE_KEYDOWN, procKeyEvents);
    engine.setEventHandler(engine.EVENT_TYPE_KEYUP, procKeyEvents);
    engine.setEventHandler(engine.EVENT_TYPE_CLICK, procMouseClick);

    engine.createTextureAtlas(atlas)
        .then(() => engine.startFrame());

    // update canvas
    let x = 50;
    let y = 50;
    const pps = 20; // speed px/sec
    function update(delta) {
        const ctx = engine.getCtx();
        const canvas = engine.getCanvas();
        // move sprite according to keydown status of arrow keys.
        const pxDelta = delta * pps;
        if (arrowKeyDownStatuses[engine.KEY_SYMBOL_LEFT]) {
            x = (x - pxDelta) % canvas.width;
        }
        if (arrowKeyDownStatuses[engine.KEY_SYMBOL_RIGHT]) {
            x = (x + pxDelta) % canvas.width;
        }
        if (arrowKeyDownStatuses[engine.KEY_SYMBOL_UP]) {
            y = (y - pxDelta) % canvas.height;
        }
        if (arrowKeyDownStatuses[engine.KEY_SYMBOL_DOWN]) {
            y = (y + pxDelta) % canvas.height;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        engine.drawSprite(ctx, 'pengo_2.png', x, y);
    }

    // process key events
    const KEY_ARROW_KEYS = [engine.KEY_SYMBOL_LEFT, engine.KEY_SYMBOL_RIGHT, engine.KEY_SYMBOL_UP, engine.KEY_SYMBOL_DOWN];
    const arrowKeyDownStatuses = {ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false};
    let spaceKeyDownStatus = false;
    function procKeyEvents(e, eventType) {
        // check arrow keys
        if (KEY_ARROW_KEYS.indexOf(e.key) >= 0) {
            arrowKeyDownStatuses[e.key] = (eventType === engine.EVENT_TYPE_KEYDOWN);
        }
        // check space key
        if (e.key === engine.KEY_SYMBOL_SPACE) {
            spaceKeyDownStatus = (eventType === engine.EVENT_TYPE_KEYDOWN);
        }
    }

    // process mouse click
    function procMouseClick(e) {
        const rect = e.target.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
})();

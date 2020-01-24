import FrameEngine from "./FrameEngine.js";
import atlas from './atlas.js';

(function(){
    const engine = new FrameEngine();
    engine.setCanvas('canvas_1');
    engine.setUpdateHandler(update);
    // register key event procedure
    engine.setEventHandler('keydown', procKeyEvents);
    engine.setEventHandler('keyup', procKeyEvents);
    engine.setEventHandler('click', procMouseClick);

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
        if (arrowKeyDownStatuses[KEY_LEFT]) {
            x = (x - pxDelta) % canvas.width;
        }
        if (arrowKeyDownStatuses[KEY_RIGHT]) {
            x = (x + pxDelta) % canvas.width;
        }
        if (arrowKeyDownStatuses[KEY_UP]) {
            y = (y - pxDelta) % canvas.height;
        }
        if (arrowKeyDownStatuses[KEY_DOWN]) {
            y = (y + pxDelta) % canvas.height;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        engine.drawSprite(ctx, 'pengo_2.png', x, y);
    }

    // process key events
    const KEY_LEFT = 'ArrowLeft';
    const KEY_RIGHT = 'ArrowRight';
    const KEY_UP = 'ArrowUp';
    const KEY_DOWN = 'ArrowDown';
    const KEY_SPACE = 'Space';
    const KEY_ARROW_KEYS = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN];
    const arrowKeyDownStatuses = {ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false};
    let spaceKeyDownStatus = false;
    function procKeyEvents(e, handleType) {
        // check arrow keys
        if (KEY_ARROW_KEYS.indexOf(e.key) >= 0) {
            arrowKeyDownStatuses[e.key] = (handleType === 'keydown');
        }
        // check space key
        if (e.key === KEY_SPACE) {
            spaceKeyDownStatus = (handleType === 'keydown');
        }
    }

    // process mouse click
    function procMouseClick(e) {
        const rect = e.target.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
})();

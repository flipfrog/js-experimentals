import FrameEngine from "./FrameEngine.js";
import atlas from './atlas.js';

(function(){
    // create engines on each canvas
    [1, 2].forEach(index => {
        const engine = new FrameEngine();
        engine.setCanvas('canvas_'+index);
        engine.setClientData({
            x: 50,
            y:50,
            pps: 20,
            arrowKeyDownStatuses: {ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false},
            spaceKeyDownStatus: false
        });

        // register event handlers
        engine.setUpdateHandler(update);
        engine.setEventHandler(engine.EVENT_TYPE_KEYDOWN, procKeyEvents);
        engine.setEventHandler(engine.EVENT_TYPE_KEYUP, procKeyEvents);
        engine.setEventHandler(engine.EVENT_TYPE_CLICK, procMouseClick);
        // create sprites
        engine.createTextureAtlas(atlas)
            .then(() => engine.startFrame());
    });

    // update canvas
    function update(engine, delta) {
        const ctx = engine.getCtx();
        const canvas = engine.getCanvas();
        const data = engine.getClientData();
        let x = data.x;
        let y = data.y;
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        engine.drawSprite(ctx, 'pengo_2.png', x, y);

        data.x = x;
        data.y = y;
        engine.setClientData(data);
    }

    // process key events
    function procKeyEvents(engine, e, eventType) {
        const KEY_ARROW_KEYS = [engine.KEY_SYMBOL_LEFT, engine.KEY_SYMBOL_RIGHT, engine.KEY_SYMBOL_UP, engine.KEY_SYMBOL_DOWN];
        const data = engine.getClientData();
        // check arrow keys
        if (KEY_ARROW_KEYS.indexOf(e.key) >= 0) {
            data.arrowKeyDownStatuses[e.key] = (eventType === engine.EVENT_TYPE_KEYDOWN);
        }
        // check space key
        if (e.key === engine.KEY_SYMBOL_SPACE) {
            data.spaceKeyDownStatus = (eventType === engine.EVENT_TYPE_KEYDOWN);
        }
        engine.setClientData(data);
    }

    // process mouse click
    function procMouseClick(engine, e) {
        const data = engine.getClientData();
        const rect = e.target.getBoundingClientRect();
        data.x = e.clientX - rect.left;
        data.y = e.clientY - rect.top;
        engine.setClientData(data);
    }
})();

import FrameEngine, {Sprite, ExplosionParticleSystem} from "./FrameEngine.js";
import atlas from './atlas.js';

(function(){
    // create engines on each canvas
    [1, 2].forEach(index => {
        const engine = new FrameEngine();
        engine.setCanvas('canvas_'+index, (index === 1));
        engine.setDisplayFps(true);
        engine.setClientData({
            pps: 20,
            arrowKeyDownStatuses: {ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false},
            spaceKeyDownStatus: false
        });

        // create sprites
        for (let col = 100; col < 500; col += 50) {
            for (let row = 100; row < 500; row += 50) {
                const sprite = new Sprite(engine, 'pengo_2.png', 0, `sprite_${row}_${col}`);
                sprite.setPosition(row, col);
                engine.addSprite(sprite);
            }
        }

        // register event handlers
        engine.setUpdateHandler(update);
        engine.setEventHandler(engine.EVENT_TYPE_KEYDOWN, procKeyEvents);
        engine.setEventHandler(engine.EVENT_TYPE_KEYUP, procKeyEvents);
        engine.setEventHandler(engine.EVENT_TYPE_CLICK, procMouseClick);
        // create sprites
        engine.loadTextureAtlas(atlas)
            .then(() => engine.startFrame());
    });

    // update canvas
    function update(engine, delta) {
        const canvas = engine.getCanvas();
        const data = engine.getClientData();
        for (let col = 100; col < 500; col += 50) {
            for (let row = 100; row < 500; row += 50) {
                const sprite = engine.getSprite(`sprite_${row}_${col}`);
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
            }
        }
    }

    // process key events
    function procKeyEvents(engine, e, eventType) {
        const KEY_ARROW_KEYS = [engine.KEY_SYMBOL_LEFT, engine.KEY_SYMBOL_RIGHT, engine.KEY_SYMBOL_UP, engine.KEY_SYMBOL_DOWN];
        const data = engine.getClientData();
        const eventKey = e.key;
        // check arrow keys
        if (KEY_ARROW_KEYS.indexOf(eventKey) >= 0) {
            data.arrowKeyDownStatuses[eventKey] = (eventType === engine.EVENT_TYPE_KEYDOWN);
        }
        // check space key
        if (eventKey === engine.KEY_SYMBOL_SPACE) {
            data.spaceKeyDownStatus = (eventType === engine.EVENT_TYPE_KEYDOWN);
        }
        engine.setClientData(data);
    }

    // process mouse click
    function procMouseClick(engine, e) {
        const rect = e.target.getBoundingClientRect();
        const sprite = engine.getSprite('sprite_100_100');
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        sprite.setPosition(x, y, sprite.rotate);
        if (engine.getSprite('sprite_150_100')) {
            engine.removeSprite('sprite_150_100');
        }
        engine.addParticle(new ExplosionParticleSystem(x, y, 'particle_tex_1.png'));
    }
})();

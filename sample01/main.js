import FrameEngine, {Scene, Sprite} from "./FrameEngine/engine.js";
import {ExplosionParticleSystem} from './FrameEngine/particle.js';
import {TransitionSwipe} from './FrameEngine/transition.js';
import {UIButton} from './FrameEngine/ui.js';
import atlas from './img/atlas.js';

(function(){
    // create engines on each canvas
    [1, 2].forEach(index => {
        // create frame rendering engine
        const engine = new FrameEngine();
        engine.setCanvas('canvas_'+index, (index === 1));
        engine.setDisplayFps(true);

        // create title scene
        const titleScene = new Scene(engine);
        titleScene.updateHandler = (engine, scene, delta) => {};
        const startButton = new UIButton(engine, 100, 100, 'Button');
        startButton.setImage('start_button_1.png');
        startButton.setFont('48px serif');
        titleScene.addUIObject(startButton);
        engine.addScene(titleScene);

        // create board scene
        const boardScene = new Scene(engine);
        boardScene.updateHandler = (engine, scene, delta) => {};
        boardScene.eventListener = eventListener;
        boardScene.setClientData({
            pps: 20,
            arrowKeyDownStatuses: {ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false},
            spaceKeyDownStatus: false
        });
        engine.addScene(boardScene);

        // add scene control listener
        startButton.setEventListener((engine, scene, e) => engine.changeScene(boardScene.index));

        // change to the title scene
        engine.changeScene(titleScene.index);

        // load sprite textures then start frame rendering
        engine.loadTextureAtlas(atlas)
            .then(() => engine.startFrame());
    });

    // update canvas
    function update(engine, scene, delta) {
        const canvas = engine.getCanvas();
        const data = scene.getClientData();
        for (let col = 100; col <= 200; col += 50) {
            for (let row = 100; row <= 200; row += 50) {
                const sprite = scene.getSprite(`sprite_${row}_${col}`);
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

    // event listener
    function eventListener(engine, scene, e) {
        switch (e.type) {
            case engine.EVENT_TYPE_KEYDOWN:
            case engine.EVENT_TYPE_KEYUP:
                procKeyEvents(engine, scene, e, e.type);
                break;
            case engine.EVENT_TYPE_CLICK:
                procMouseClick(engine, scene, e);
                break;
        }
    }

    // process key events
    function procKeyEvents(engine, scene, e, eventType) {
        const KEY_ARROW_KEYS = [engine.KEY_SYMBOL_LEFT, engine.KEY_SYMBOL_RIGHT, engine.KEY_SYMBOL_UP, engine.KEY_SYMBOL_DOWN];
        const data = scene.getClientData();
        const eventKey = e.key;
        // check arrow keys
        if (KEY_ARROW_KEYS.indexOf(eventKey) >= 0) {
            data.arrowKeyDownStatuses[eventKey] = (eventType === engine.EVENT_TYPE_KEYDOWN);
        }
        // check space key
        if (eventKey === engine.KEY_SYMBOL_SPACE) {
            data.spaceKeyDownStatus = (eventType === engine.EVENT_TYPE_KEYDOWN);
        }
        scene.setClientData(data);
    }

    // process mouse click
    function procMouseClick(engine, scene, e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        /*
        const sprite = scene.getSprite('sprite_100_100');
        if (sprite) {
            sprite.setPosition(x, y, sprite.rotate);
        }
        if (scene.getSprite('sprite_150_100')) {
            scene.removeSprite('sprite_150_100');
        }
        scene.addParticle(new ExplosionParticleSystem(x, y, 'particle_tex_1.png'));
         */
    }
})();

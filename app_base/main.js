import FrameEngine, {Scene, Sprite} from "./FrameEngine/engine.js";
import {ParticleSystemFire} from './FrameEngine/particle.js';
import {TransitionSwipe} from './FrameEngine/transition.js';
import {UIButton, UILabel} from './FrameEngine/ui.js';
import atlas from './img/atlas.js';
import {BoardScene} from './BoardScene.js';

(function(){
    let board = null;
    // create engines on each canvas
    [1, 2].forEach(index => {
        // create frame rendering engine
        const engine = new FrameEngine();
        engine.setCanvas('canvas_'+index, (index === 1));
        engine.setDisplayFps(true);
        const [centerX, centerY] = [engine.getCanvas().width/2, engine.getCanvas().height/2];

        // create title scene
        const titleScene = new Scene(engine, 'title_scene');
        //titleScene.updateHandler = (engine, scene, delta) => {};
        const startButton = new UIButton(engine, centerX, centerY+100, null);
        startButton.setImage('start_button_1.png');
        startButton.setFont('serif', 48); // FIXME: should do construct screens after loading resources.
        titleScene.addUIObject(startButton);
        startButton.setEventListener((engine, scene, e) => {
            engine.changeScene(boardScene.index, new TransitionSwipe());
        });
        engine.addScene(titleScene);
        titleScene.addSprite(new Sprite(engine, 'title.png', 0, 'title').setPosition(centerX, centerY-50)); // FIXME: same up.

        // create board scene
        const boardScene = new BoardScene(engine, 'board_scene');
        boardScene.eventListener = sharedEventListener;
        boardScene.setClientData({
            pps: 20,
            arrowKeyDownStatuses: {ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false},
            spaceKeyDownStatus: false
        });
        engine.addScene(boardScene);

        // create score scene
        const scoreScene = new Scene(engine, 'score_scene');
        scoreScene.updateHandler = updateScoreScene;
        const gotoTitleButton = new UIButton(engine, centerX, centerY+150, null);
        gotoTitleButton.setImage('go_title.png');
        scoreScene.addUIObject(gotoTitleButton);
        const scoreTitle = new UILabel(engine, centerX, 60, 'YOUR SCORES');
        scoreTitle.setFont("'Ricty Diminished', 'Monaco', 'Consolas', 'Courier New', Courier, monospace, sans-serif", 45);
        scoreScene.addUIObject(scoreTitle);
        Array.from({length: 5}).map((v, i) => {
            const prefixes = ['st', 'nd'];
            const scoreLine = new UILabel(engine, centerX, 140 + 50 * i, `${i+1}${prefixes[i] || 'th'} ... 00000`); // TODO: apply latest scores
            scoreLine.setFont("'Ricty Diminished', 'Monaco', 'Consolas', 'Courier New', Courier, monospace, sans-serif", 40);
            scoreLine.setTag(`scoreLabel${i}`);
            scoreScene.addUIObject(scoreLine);
        });
        engine.addScene(scoreScene);
        gotoTitleButton.setEventListener((engine, scene, e) => engine.changeScene(titleScene.index, new TransitionSwipe()));

        // change to the title scene
        engine.changeScene(titleScene.index);

        // load sprite textures then start frame rendering
        //engine.loadTextureAtlas('../img/atlas.js')
        engine.loadTextureAtlas(atlas)
            .then(() => engine.startFrame());
    });


    function updateScoreScene(engine, scene, delta) {
        
    }

    // event listener
    function sharedEventListener(engine, scene, e) {
        switch (e.type) {
            case engine.EVENT_TYPE_KEYDOWN:
            case engine.EVENT_TYPE_KEYUP:
                procKeyEvents(engine, scene, e, e.type);
                break;
            case engine.EVENT_TYPE_MOUSEDOWN:
                procMouseDown(engine, scene, e);
                break;
            case engine.EVENT_TYPE_TOUCHSTART:
            case engine.EVENT_TYPE_TOUCHEND:
            case engine.EVENT_TYPE_TOUCHCANCEL:
            case engine.EVENT_TYPE_TOUCHMOVE:
                procTouchEvents(engine, scene, e);
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

    // process mouse down
    function procMouseDown(engine, scene, e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const sprite = scene.getSprite('sprite_100_100');
        if (sprite) {
            sprite.setPosition(x, y, sprite.rotate);
        }
        if (scene.getSprite('sprite_150_100')) {
            scene.removeSprite('sprite_150_100');
        }
        scene.addParticle(new ParticleSystemFire(x, y, 'particle_tex_1.png'));
    }

    // process touch events to convert touch moves to arrow key-down statuses.
    const touchSenseThresholdX = 30;
    const touchSenseThresholdY = 30;
    const touchSenseTrailingX = 40;
    const touchSenseTrailingY = 40;
    const touchStatus = {
        isTouched: false,
        startX: null,
        startY: null
    };
    function procTouchEvents(engine, scene, e) {
        const {x, y} = engine.getEventCoordinates(e);
        const data = scene.getClientData();
        switch (e.type) {
            case engine.EVENT_TYPE_TOUCHSTART:
                touchStatus.isTouched = true;
                touchStatus.startX = x;
                touchStatus.startY = y;
                break;
            case engine.EVENT_TYPE_TOUCHMOVE:
                // convert touch moves to key events
                const diffX = touchStatus.startX - x;
                const diffY = touchStatus.startY - y;
                if (Math.abs(diffX) < touchSenseThresholdX || !touchStatus.isTouched) {
                    data.arrowKeyDownStatuses[engine.KEY_SYMBOL_RIGHT] = false;
                    data.arrowKeyDownStatuses[engine.KEY_SYMBOL_LEFT] = false;
                } else {
                    if (diffX < 0) {
                        // moved right
                        data.arrowKeyDownStatuses[engine.KEY_SYMBOL_RIGHT] = true;
                    } else {
                        // moved left
                        data.arrowKeyDownStatuses[engine.KEY_SYMBOL_LEFT] = true;
                    }
                }
                if (Math.abs(diffY) < touchSenseThresholdY || !touchStatus.isTouched) {
                    data.arrowKeyDownStatuses[engine.KEY_SYMBOL_DOWN] = false;
                    data.arrowKeyDownStatuses[engine.KEY_SYMBOL_UP] = false;
                } else {
                    if (diffY < 0) {
                        // moved down
                        data.arrowKeyDownStatuses[engine.KEY_SYMBOL_DOWN] = true;
                    } else {
                        // moved up
                        data.arrowKeyDownStatuses[engine.KEY_SYMBOL_UP] = true;
                    }
                }
                // adjust start positions to improve UI
                if (Math.abs(diffX) > touchSenseTrailingX) {
                    const delta = touchSenseTrailingX - touchSenseThresholdX;
                    touchStatus.startX += (diffX < 0 ? delta : -delta);
                }
                if (Math.abs(diffY) > touchSenseTrailingY) {
                    const delta = touchSenseTrailingY - touchSenseThresholdY;
                    touchStatus.startY += (diffY < 0 ? delta : -delta);
                }
                break;
            case engine.EVENT_TYPE_TOUCHEND:
            case engine.EVENT_TYPE_TOUCHCANCEL:
                touchStatus.isTouched = false;
                touchStatus.startX = null;
                touchStatus.startY = null;
                data.arrowKeyDownStatuses[engine.KEY_SYMBOL_RIGHT] = false;
                data.arrowKeyDownStatuses[engine.KEY_SYMBOL_LEFT] = false;
                data.arrowKeyDownStatuses[engine.KEY_SYMBOL_DOWN] = false;
                data.arrowKeyDownStatuses[engine.KEY_SYMBOL_UP] = false;
                break;
        }
    }
})();

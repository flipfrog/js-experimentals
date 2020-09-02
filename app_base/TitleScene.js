import {Scene, Sprite} from "./FrameEngine/engine.js";
import {UIButton} from "./FrameEngine/ui.js";
import {TransitionSwipe} from "./FrameEngine/transition.js";

export class TitleScene extends Scene {
    constructor(engine, tagName=null) {
        super(engine, tagName);
        const [centerX, centerY] = [engine.getCanvas().width/2, engine.getCanvas().height/2];
        const startButton = new UIButton(engine, centerX, centerY+100, null);
        startButton.setImage('start_button_1.png');
        startButton.setFont('serif', 48);
        this.addUIObject(startButton);
        startButton.setEventListener((engine, scene, e) => {
            engine.changeSceneByTag('board_scene', new TransitionSwipe());
        });
        this.addSprite(new Sprite(engine, 'title.png', 0, 'title').setPosition(centerX, centerY-50));
    }
}
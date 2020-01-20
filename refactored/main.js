import FrameEngine from "./FrameEngine.js";
import atlas from './atlas.js';

(function(){
    const engine = new FrameEngine(atlas);
    engine.startFrame();
})();

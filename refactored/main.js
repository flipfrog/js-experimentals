import FrameEngine from "./FrameEngine.js";
import atlas from './atlas.js';

(function(){
    const engine = new FrameEngine();
    engine.setCanvas('canvas_1');
    engine.createTextureAtlas(atlas)
        .then(() => engine.startFrame());
})();

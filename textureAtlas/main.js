import atlas from "./atlas.js";

$(function(){
    const canvas = document.getElementById('canvas_1');
    const ctx = canvas.getContext('2d');
    createTextureAtlas(atlas)
        .then(() => {
            console.log('*** completed loading texture-atlas.');
            // register key event procedure
            document.addEventListener('keydown', e => procKeyEvents(e, KEY_KEYDOWN));
            document.addEventListener('keyup', e => procKeyEvents(e, KEY_KEYUP));
            // start updating canvas frame
            requestAnimationFrame(drawFrame);
        });

    // process key events
    const KEY_KEYDOWN = 'keydown';
    const KEY_KEYUP = 'keyup';
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
        if(KEY_ARROW_KEYS.indexOf(e.key) >= 0) {
            arrowKeyDownStatuses[e.key] = (handleType === KEY_KEYDOWN);
        }
        // check space key
        if (e.key === KEY_SPACE) {
            spaceKeyDownStatus = (handleType === KEY_KEYDOWN);
        }
    }

    // create texture atlas data structure from control file(js file)
    // TODO: add sprites' border-area
    const spriteMap = {};
    async function createTextureAtlas(atlas) {
        const imageFiles = atlas.map(file => file.imageFile);
        // load image for sprites
        const images = await loadImages(imageFiles);
        // analyze texture atlas structure
        atlas.forEach((file, index) => {
            file.sprites.forEach(_sprite => {
                const sprite = Object.assign({}, _sprite);
                sprite.image = images[index];
                spriteMap[sprite.tagName] = sprite;
                console.log('created sprite:'+sprite.tagName);
            });
        });
    }

    // draw sprite on canvas
    function drawSprite(ctx, sprite, x, y) {
        ctx.save();
        ctx.translate(x+sprite.anchor.x, y+sprite.anchor.y);
        ctx.rotate(sprite.rotate * Math.PI/180);
        ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
        ctx.restore();
    }

    // load image files
    async function loadImages(imagePaths) {
        return new Promise(resolve => {
            const imagePromises = [];
            imagePaths.forEach(imagePath => {
                imagePromises.push(loadImage(imagePath));
            });
            Promise.all(imagePromises)
                .then(results => resolve(results));
        });
    }

    // loading image
    async function loadImage(imagePath) {
        return new Promise(resolve => {
            const image = new Image();
            image.addEventListener('load', () => {
                resolve(image);
            });
            image.src = imagePath;
        });
    }

    // draw frame which calls canvas-update function
    let lastMilliSec = null;
    function drawFrame(currentTime) {
        const currentMilliSec = currentTime/1000;
        const delta = lastMilliSec ? currentMilliSec - lastMilliSec : 0;
        lastMilliSec = currentMilliSec;
        update(delta);
        requestAnimationFrame(drawFrame);
    }

    // update canvas
    let x = 0, y = 50;
    const pps = 20; // speed px/sec
    function update(delta) {
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
        drawSprite(ctx, spriteMap['pengo_2.png'], x, y);
    }
});


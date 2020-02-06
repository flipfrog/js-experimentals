export class DecayedImageGenerator {
    /** @type ImageData */
    imageData = null;
    /** @type HTMLCanvasElement */
    canvas = null;
    /** @type CanvasRenderingContext2D */
    ctx = null;
    constructor(image) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.drawImage(image, 0, 0);
        image.style.display = 'none';
        this.imageData = this.ctx.getImageData(0, 0, image.width, image.height);
    }
    *getDecayedIntensityCanvasImages(numIntensityDecayLevels) {
        const intensityStep = 1/numIntensityDecayLevels;
        for (let i = 0; i < numIntensityDecayLevels; i++) {
            const intensityRate = intensityStep * i;
            const generated = this.ctx.createImageData(this.imageData);
            for (let j = 0; j < this.imageData.data.length; j += 4) {
                generated.data[j] = this.imageData.data[j] * (1- intensityRate); // r
                generated.data[j+1] = this.imageData.data[j+1] * (1- intensityRate); // g
                generated.data[j+2] = this.imageData.data[j+2] * (1- intensityRate); // b
                generated.data[j+3] = this.imageData.data[j+3]; // a
            }
            yield {index: i, imageData: generated};
        }
    }
}

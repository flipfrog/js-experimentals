export class DecayedImageGenerator {
    constructor(image) {
        /** @type HTMLCanvasElement */
        this.canvas = document.createElement('canvas');
        [this.canvas.width, this.canvas.height] = [image.width, image.height];
        /** @type CanvasRenderingContext2D */
        this.ctx = this.canvas.getContext('2d');
        this.ctx.drawImage(image, 0, 0);
        image.style.display = 'none';
        /** @type ImageData */
        this.imageData = this.ctx.getImageData(0, 0, image.width, image.height);
    }
    *generateImages(numIntensityDecayLevels) {
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
            const canvas = document.createElement('canvas');
            [canvas.width, canvas.height] = [this.imageData.width, this.imageData.height];
            const ctx = canvas.getContext('2d');
            ctx.putImageData(generated, 0, 0);
            yield {index: i, canvas: canvas};
        }
    }
}

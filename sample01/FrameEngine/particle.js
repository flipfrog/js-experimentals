/**
 * particle system base class
 */
class ParticleSystemBase {
    // initialize own parameters
    constructor(cx, cy, textureName, options={}) {
        this.inProgress = true;
        this.textures = [];
        // set specified option values
        this.options = {
            duration: 1, // sec (zero to infinite duration)
            radius: 50, // px
            initialAlpha: 1,
            numInitialTextures: 30,
            angularVelocity: 0, // deg/sec for sprite rotation
        };
        Object.keys(this.options).forEach(key => {
            this.options[key] = (options[key] ? options[key] : this.options[key]);
        });
        [this.cx, this.cy, this.textureName] = [cx, cy, textureName];
    }
    // update textures
    updateAndDraw(engine, delta) {
        this.textures = this.textures.filter(texture => {
            return this.options.duration === 0 || texture.t < this.options.duration;
        });
        this.inProgress = (this.textures.length > 0);
        if (this.inProgress) {
            const canvasArrayMaxIndex = engine.textureMap[this.textureName].canvasArray.length - 1;
            this.textures.forEach(texture => texture.updateCoordinate(delta));
            const ctx = engine.getCtx();
            ctx.save();
            ctx.globalCompositeOperation = 'lighter'; // set blend mode
            this.textures.forEach(texture => {
                const index = Math.min(Math.floor((texture.t/this.options.duration)*canvasArrayMaxIndex), canvasArrayMaxIndex);
                texture.draw(engine, index);
            });
            ctx.restore();
        }
    }
}

/**
 * explosion particle system class
 */
export class ParticleSystemExplosion extends ParticleSystemBase {
    constructor(cx, cy, textureName, options={}) {
        super(cx, cy, textureName, options);
        for (let i = 0; i < this.options.numInitialTextures; i++) {
            const texture = new ParticleExplosion(this.cx, this.cy, this.textureName);
            this.textures.push(texture);
        }
    }
}

/**
 * particle base class
 */
class ParticleBase {
    constructor(cx, cy, textureName) {
        this.t = 0;
        this.initialVx = 0; // px/sec
        this.initialVy = 0; // px/sec
        this.vx = 0; // px/sec
        this.vy = 0; // px/sec
        this.rotate = 0;
        this.vr = 0; // deg/sec
        this.baseVelocity = 10; // px/sec
        this.fixedVelocityRatio = .5;
        [this.x, this.y, this.textureName] = [cx, cy, textureName];
    }
    updateCoordinate(delta) {
        this.t += delta;
    }
    draw(engine, intensityDecayIndex) {
        const ctx = engine.getCtx();
        engine.putDecayTexture(ctx, this.textureName, this.x, this.y, intensityDecayIndex, this.rotate);
    }
}

/**
 * explosion particle class
 */
class ParticleExplosion extends ParticleBase {
    constructor(cx, cy, textureName) {
        super(cx, cy, textureName);
        // compose texture velocities of fix and elastic part
        const baseVx = Math.cos(Math.random() * Math.PI * 2) * this.baseVelocity;
        const baseVy = Math.sin(Math.random() * Math.PI * 2) * this.baseVelocity;
        const fixedVelocitySegment = this.fixedVelocityRatio;
        const elasticVelocitySegment = (1 - this.fixedVelocityRatio);
        const vx = baseVx * (fixedVelocitySegment + elasticVelocitySegment * Math.random());
        const vy = baseVy * (fixedVelocitySegment + elasticVelocitySegment * Math.random());
        [this.initialVx, this.initialVy] = [vx, vy];
    }
    updateCoordinate(delta) {
        super.updateCoordinate(delta);
        const velocityMultiplyValue = 1/(1 - Math.pow(Math.E, this.t));
        this.vx = this.initialVx * velocityMultiplyValue;
        this.vy = this.initialVy * velocityMultiplyValue;
        this.x += (this.vx * delta);
        this.y += (this.vy * delta);
        this.rotate += (this.vr * delta);
    }
}

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
            this.options[key] = (options[key] !== undefined ? options[key] : this.options[key]);
        });
        [this.cx, this.cy, this.textureName] = [cx, cy, textureName];
    }
    // update textures
    updateAndDraw(engine, delta) {
        this.textures = this.textures.filter(texture => {
            return this.options.duration === 0 || texture.t < texture.duration;
        });
        this.inProgress = (this.textures.length > 0);
        if (this.inProgress) {
            const canvasArrayMaxIndex = engine.textureMap[this.textureName].canvasArray.length - 1;
            this.textures.forEach(texture => texture.updateCoordinate(delta));
            const ctx = engine.getCtx();
            ctx.save();
            ctx.globalCompositeOperation = 'lighter'; // set blend mode
            this.textures.forEach(texture => {
                const index = Math.min(Math.floor((texture.t/texture.duration)*canvasArrayMaxIndex), canvasArrayMaxIndex);
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
 * fire particle system class
 */
export class ParticleSystemFire extends ParticleSystemBase {
    constructor(cx, cy, textureName, options={}) {
        super(cx, cy, textureName, options);
        this.options.numInitialTextures = 100;
        this.particleOptions = {
            durationTime: 3,
            durationFixed: 0.5
        };
        for (let i = 0; i < this.options.numInitialTextures; i++) {
            const texture = new ParticleFire(this.cx, this.cy, this.textureName, this.particleOptions);
            this.textures.push(texture);
        }
        this.t = 0;
    }
    updateAndDraw(engine, delta) {
        super.updateAndDraw(engine, delta);
        this.t += delta;
        const lackOfTextures = this.options.numInitialTextures - this.textures.length;
        const generationCount = lackOfTextures > 0 ? lackOfTextures : 0;
        if (generationCount > 0) {
            this.inProgress = true;
            this.t = 0;
            for (let i = 0; i < generationCount; i++) {
                const texture = new ParticleFire(this.cx, this.cy, this.textureName, this.particleOptions);
                this.textures.push(texture);
            }
        }
    }
}

/**
 * particle base class
 */
class ParticleBase {
    constructor(cx, cy, textureName, options={}) {
        this.t = 0;
        this.initialVx = 0; // px/sec
        this.initialVy = 0; // px/sec
        this.vx = 0; // px/sec
        this.vy = 0; // px/sec
        this.rotate = 0;
        this.vr = 0; // deg/sec
        this.baseVelocity = 10; // px/sec
        this.fixedVelocityRatio = .5;
        this.options = {
            durationTime: 1,
            durationFixed: 0.5
        };
        [this.x, this.y, this.textureName] = [cx, cy, textureName];
        Object.keys(options).forEach(key => (this.options[key] = (options[key] !== undefined ? options[key] : this.options[key])));
        this.duration = Math.random() * (this.options.durationTime - this.options.durationFixed) + this.options.durationFixed;
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
    constructor(cx, cy, textureName, options) {
        super(cx, cy, textureName, options);
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

/**
 * fire particle class
 */
class ParticleFire extends ParticleBase {
    constructor(cx, cy, textureName, options) {
        super(cx, cy, textureName, options);
        // compose texture velocities of fix and elastic part
        const baseVx = Math.cos(Math.random() * Math.PI / 2 + Math.PI/4) * this.baseVelocity;
        const baseVy = Math.sin(Math.random() * Math.PI / 2 + Math.PI/4) * this.baseVelocity;
        const fixedVelocitySegment = this.fixedVelocityRatio;
        const elasticVelocitySegment = (1 - this.fixedVelocityRatio);
        const vx = baseVx * (fixedVelocitySegment + elasticVelocitySegment * Math.random());
        const vy = baseVy * (fixedVelocitySegment + elasticVelocitySegment * Math.random());
        [this.initialVx, this.initialVy] = [vx, vy];
    }

    updateCoordinate(delta) {
        super.updateCoordinate(delta);
        const velocityMultiplyValue = 1 / (1 - Math.pow(Math.E, this.t/2));
        this.vx = this.initialVx * velocityMultiplyValue;
        this.vy = this.initialVy * velocityMultiplyValue;
        this.x += (this.vx * delta);
        this.y += (this.vy * delta);
        this.rotate += (this.vr * delta);
    }
}

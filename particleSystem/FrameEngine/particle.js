//
// Particle System
// Each particle implementations are extended from its base classes.
//
class ParticleSystemBase {
    cx = 0;
    cy = 0;
    textureName = null;
    options = {
        duration: 2, // sec
        radius: 50, // px
        initialAlpha: 1,
        numTextures: 30,
        angularVelocity: 0, // deg/sec for sprite rotation
    };
    textures = [];
    // initialize own parameters
    constructor(cx, cy, textureName, options={}) {
        // set specified option values
        Object.keys(this.options).forEach(key => {
            this.options[key] = (options[key] ? options[key] : this.options[key]);
        });
        [this.cx, this.cy, this.textureName] = [cx, cy, textureName];
    }
    // update textures
    update(engine, delta) {
        this.textures = this.textures.filter(texture => {
            return texture.t < this.options.duration;
        });
        this.textures.forEach(texture => texture.updateCoordinate(delta));
        this.textures.forEach(texture => texture.draw(engine));
    }
}

export class ExplosionParticleSystem extends ParticleSystemBase {
    constructor(cx, cy, textureName, options={}) {
        super(cx, cy, textureName, options);
        for (let i = 0; i < this.options.numTextures; i++) {
            const texture = new ExplosionParticle(this.cx, this.cy, this.textureName);
            this.textures.push(texture);
        }
    }
}

class ParticleBase {
    t = 0;
    x = 0;
    y = 0;
    initialVx = 0; // px/sec
    initialVy = 0; // px/sec
    vx = 0; // px/sec
    vy = 0; // px/sec
    rotate = 0;
    vr = 0; // deg/sec
    textureName = null;
    baseVelocity = 10; // px/sec
    fixedVelocityRatio = .5;
    constructor(cx, cy, textureName) {
        [this.x, this.y, this.textureName] = [cx, cy, textureName];
    }
    updateCoordinate(delta) {
        this.t += delta;
    }
    draw(engine) {
        const ctx = engine.getCtx();
        engine.drawTexture(ctx, this.textureName, this.x, this.y, this.rotate); // TODO: to be using raw interface to get rendering speed up
    }
}

class ExplosionParticle extends ParticleBase {
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
        const velocityMultiplyValue = 1/(1 - Math.pow(Math.E, this.t)); // TODO: may need adjust a decay rate
        this.vx = this.initialVx * velocityMultiplyValue; // TODO: to be more efficiency
        this.vy = this.initialVy * velocityMultiplyValue;
        this.x += (this.vx * delta);
        this.y += (this.vy * delta);
        this.rotate += (this.vr * delta);
    }
}

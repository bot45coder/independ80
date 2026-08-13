/**
 * INDIA FROM PARTICLES - Award Winning Interactive Experience
 * Senior Front-End Architecture
 * Modules: Config, SpatialHashGrid, Shapes, Particles, Fireworks, Confetti, Engine
 */

// ============================================================================
// CONFIGURATION & STATE
// ============================================================================
const CONFIG = {
    // Determine particle count based on device width for 60 FPS performance
    PARTICLE_COUNT: window.innerWidth > 1200 ? 5000 : window.innerWidth > 768 ? 3000 : 1800,
    COLORS: {
        SAFFRON: '#FF9933',
        WHITE: '#FFFFFF',
        GREEN: '#138808',
        BLUE: '#000080',
        DARK: '#050505'
    },
    STAGE: 1, // 1: Random, 2: Map, 3: Flag, 4: Text, 5: Celebration
    TIMINGS: {
        MAP_TO_FLAG: 5000,
        FLAG_TO_TEXT: 6000,
        TEXT_TO_CELEBRATION: 5000
    },
    PHYSICS: {
        FRICTION: 0.92,
        EASE: 0.05,
        REPULSE_RADIUS: 100,
        REPULSE_FORCE: 20
    }
};

let globalTime = 0;
const mouse = { x: -1000, y: -1000, radius: CONFIG.PHYSICS.REPULSE_RADIUS };

// ============================================================================
// UTILITIES & PERFORMANCE TOOLS
// ============================================================================

// Spatial Hash Grid for highly performant O(n) nearby particle connections
class SpatialHashGrid {
    constructor(bounds, cellSize) {
        this.bounds = bounds;
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    _hash(x, y) {
        const i = Math.floor(x / this.cellSize);
        const j = Math.floor(y / this.cellSize);
        return `${i},${j}`;
    }

    insert(client) {
        const hash = this._hash(client.x, client.y);
        if (!this.cells.has(hash)) {
            this.cells.set(hash, []);
        }
        this.cells.get(hash).push(client);
    }

    clear() {
        this.cells.clear();
    }

    findNearby(x, y, radius) {
        const results = [];
        const minI = Math.floor((x - radius) / this.cellSize);
        const maxI = Math.floor((x + radius) / this.cellSize);
        const minJ = Math.floor((y - radius) / this.cellSize);
        const maxJ = Math.floor((y + radius) / this.cellSize);

        for (let i = minI; i <= maxI; i++) {
            for (let j = minJ; j <= maxJ; j++) {
                const hash = `${i},${j}`;
                if (this.cells.has(hash)) {
                    results.push(...this.cells.get(hash));
                }
            }
        }
        return results;
    }
}

// ============================================================================
// SHAPE GENERATOR (Hidden Canvas Pixel Sampling)
// ============================================================================
class ShapeGenerator {
    constructor(width, height) {
        // Use OffscreenCanvas for better performance if supported
        if (window.OffscreenCanvas) {
            this.canvas = new OffscreenCanvas(width, height);
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        } else {
            this.canvas = document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        }
        this.width = width;
        this.height = height;
    }

    _clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    _samplePixels(stride = 3, densityWeight = 1.0) {
        const pixels = [];
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height).data;
        
        for (let y = 0; y < this.height; y += stride) {
            for (let x = 0; x < this.width; x += stride) {
                const i = (y * this.width + x) * 4;
                const alpha = imageData[i + 3];
                
                if (alpha > 128) {
                    // Random density culling
                    if (Math.random() < densityWeight) {
                        pixels.push({
                            x: x,
                            y: y,
                            color: `rgba(${imageData[i]}, ${imageData[i+1]}, ${imageData[i+2]}, ${alpha/255})`
                        });
                    }
                }
            }
        }
        // Shuffle array to ensure random distribution when assigning to particles
        for (let i = pixels.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pixels[i], pixels[j]] = [pixels[j], pixels[i]];
        }
        return pixels;
    }

    getIndiaMap() {
        this._clear();
        this.ctx.save();
        
        // Map Scale based on screen
        const scale = Math.min(this.width, this.height) * 0.00065;
        this.ctx.translate(this.width / 2, this.height / 2.2);
        this.ctx.scale(scale, scale);
        
        // Simplified but recognizable path for India map
        const indiaPath = new Path2D("M304.5,-452.8 C315,-445 320,-430 322,-415 C324,-395 330,-380 345,-365 C360,-350 375,-345 385,-325 C395,-300 395,-280 380,-260 C365,-240 345,-230 335,-210 C325,-190 325,-170 335,-150 C345,-130 365,-120 375,-100 C385,-80 385,-60 375,-40 C365,-20 345,-10 335,10 C325,30 325,50 335,70 C345,90 365,100 375,120 C385,140 385,160 375,180 C365,200 345,210 335,230 C325,250 325,270 335,290 C345,310 365,320 375,340 C385,360 385,380 375,400 C365,415 350,425 330,430 C310,435 290,435 270,430 C250,425 235,415 225,400 C215,380 215,360 225,340 C235,320 255,310 265,290 C275,270 275,250 265,230 C255,210 235,200 225,180 C215,160 215,140 225,120 C235,100 255,90 265,70 C275,50 275,30 265,10 C255,-10 235,-20 225,-40 C215,-60 215,-80 225,-100 C235,-120 255,-130 265,-150 C275,-170 275,-190 265,-210 C255,-230 235,-240 225,-260 C215,-280 215,-300 225,-325 C235,-345 250,-350 265,-365 C280,-380 286,-395 288,-415 C290,-430 295,-445 304.5,-452.8 Z");
        
        // Center the path coordinates
        this.ctx.translate(-290, 0); 
        
        this.ctx.fillStyle = CONFIG.COLORS.SAFFRON;
        this.ctx.fill(indiaPath);
        this.ctx.restore();

        return this._samplePixels(Math.max(2, Math.floor(this.width/500)), 1.5);
    }

    getFlag() {
        this._clear();
        const flagW = Math.min(this.width * 0.8, 800);
        const flagH = flagW * (2/3); // 3:2 proportion
        const xOffset = (this.width - flagW) / 2;
        const yOffset = (this.height - flagH) / 2;
        const bandH = flagH / 3;

        // Saffron Band
        this.ctx.fillStyle = CONFIG.COLORS.SAFFRON;
        this.ctx.fillRect(xOffset, yOffset, flagW, bandH);
        
        // White Band
        this.ctx.fillStyle = CONFIG.COLORS.WHITE;
        this.ctx.fillRect(xOffset, yOffset + bandH, flagW, bandH);
        
        // Green Band
        this.ctx.fillStyle = CONFIG.COLORS.GREEN;
        this.ctx.fillRect(xOffset, yOffset + bandH * 2, flagW, bandH);

        // Ashoka Chakra (24 spokes)
        const centerX = xOffset + flagW / 2;
        const centerY = yOffset + flagH / 2;
        const radius = (bandH * 0.8) / 2;

        this.ctx.strokeStyle = CONFIG.COLORS.BLUE;
        this.ctx.lineWidth = Math.max(2, flagW / 200);
        
        // Outer circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();

        // 24 Spokes
        this.ctx.beginPath();
        for(let i = 0; i < 24; i++) {
            const angle = (i * Math.PI * 2) / 24;
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(
                centerX + Math.cos(angle) * radius,
                centerY + Math.sin(angle) * radius
            );
        }
        this.ctx.stroke();

        return this._samplePixels(Math.max(2, Math.floor(this.width/400)), 1.2);
    }

    getText() {
        this._clear();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Responsive font size
        const fontSize = Math.min(this.width / 8, 120);
        this.ctx.font = `900 ${fontSize}px 'Montserrat', sans-serif`;
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.ctx.fillStyle = CONFIG.COLORS.SAFFRON;
        this.ctx.fillText("🇮🇳 HAPPY", centerX, centerY - fontSize * 1.2);
        
        this.ctx.fillStyle = CONFIG.COLORS.WHITE;
        this.ctx.fillText("INDEPENDENCE", centerX, centerY);
        
        this.ctx.fillStyle = CONFIG.COLORS.GREEN;
        this.ctx.fillText("DAY 🇮🇳", centerX, centerY + fontSize * 1.2);

        return this._samplePixels(Math.max(2, Math.floor(this.width/500)), 1.0);
    }
}

// ============================================================================
// PARTICLE ENTITIES
// ============================================================================
class Particle {
    constructor(x, y, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        
        this.targetX = x;
        this.targetY = y;
        
        this.size = Math.random() * 2 + 1;
        this.baseSize = this.size;
        
        const colors = [CONFIG.COLORS.SAFFRON, CONFIG.COLORS.WHITE, CONFIG.COLORS.GREEN];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.targetColor = this.color;
        
        this.speed = Math.random() * 0.04 + 0.02;
        this.randomOffset = Math.random() * Math.PI * 2;
    }

    setTarget(x, y, color) {
        this.targetX = x;
        this.targetY = y;
        this.targetColor = color;
    }

    update(stage) {
        // 1. Mouse Repulsion
        const dxMouse = this.x - mouse.x;
        const dyMouse = this.y - mouse.y;
        const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
        
        if (distMouseSq < mouse.radius * mouse.radius) {
            const distMouse = Math.sqrt(distMouseSq);
            const force = (mouse.radius - distMouse) / mouse.radius;
            const angle = Math.atan2(dyMouse, dxMouse);
            this.vx += Math.cos(angle) * force * CONFIG.PHYSICS.REPULSE_FORCE * 0.1;
            this.vy += Math.sin(angle) * force * CONFIG.PHYSICS.REPULSE_FORCE * 0.1;
        }

        // 2. State-Based Movement
        if (stage === 1) {
            // Free float with gentle bounds
            this.x += this.vx;
            this.y += this.vy;
            
            // Random wander
            this.vx += (Math.random() - 0.5) * 0.1;
            this.vy += (Math.random() - 0.5) * 0.1;
            
            // Velocity cap
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed > 2) {
                this.vx = (this.vx / currentSpeed) * 2;
                this.vy = (this.vy / currentSpeed) * 2;
            }
            
            // Wrap around edges softly
            if (this.x < 0 || this.x > window.innerWidth) this.vx *= -1;
            if (this.y < 0 || this.y > window.innerHeight) this.vy *= -1;

        } else {
            // Easing towards target
            let tx = this.targetX;
            let ty = this.targetY;
            
            // Apply waving effect if flag stage
            if (stage === 3) {
                // Realistic sine wave flag flutter based on X position and time
                const wave = Math.sin(tx * 0.01 + globalTime * 3) * 15;
                const wave2 = Math.cos(tx * 0.02 + globalTime * 2) * 5;
                ty += wave + wave2;
            }

            const dx = tx - this.x;
            const dy = ty - this.y;
            
            this.vx += dx * this.speed;
            this.vy += dy * this.speed;
            
            this.vx *= CONFIG.PHYSICS.FRICTION;
            this.vy *= CONFIG.PHYSICS.FRICTION;
            
            this.x += this.vx;
            this.y += this.vy;
        }

        // 3. Color interpolation (simplified: snaps in this engine for performance, but rendered with alpha)
        this.color = this.targetColor;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================================================
// FIREWORKS ENGINE (Canvas)
// ============================================================================
class FireworkParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = color;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.015;
        this.gravity = 0.1;
        this.size = Math.random() * 3 + 1;
    }
    update() {
        this.vx *= 0.95; // air resistance
        this.vy *= 0.95;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ============================================================================
// CONFETTI ENGINE (Canvas)
// ============================================================================
class Confetti {
    constructor(w, h) {
        this.x = Math.random() * w;
        this.y = Math.random() * h - h;
        this.w = Math.random() * 10 + 5;
        this.h = Math.random() * 5 + 2;
        const colors = [CONFIG.COLORS.SAFFRON, CONFIG.COLORS.WHITE, CONFIG.COLORS.GREEN, CONFIG.COLORS.BLUE];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.vy = Math.random() * 3 + 1;
        this.vx = Math.random() * 2 - 1;
        this.angle = Math.random() * 360;
        this.spin = Math.random() * 0.2 - 0.1;
    }
    update(h) {
        this.y += this.vy;
        this.x += this.vx + Math.sin(this.angle) * 0.5;
        this.angle += this.spin;
        if (this.y > h) this.y = -10;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    }
}

// ============================================================================
// BACKGROUND SYSTEM
// ============================================================================
class BackgroundSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.resize();
        this.initStars();
    }
    
    resize() {
        this.w = this.canvas.width = window.innerWidth;
        this.h = this.canvas.height = window.innerHeight;
    }
    
    initStars() {
        this.stars = [];
        for(let i=0; i<150; i++) {
            this.stars.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                r: Math.random() * 1.5,
                alpha: Math.random(),
                speed: Math.random() * 0.02
            });
        }
    }
    
    draw(stage) {
        // Dynamic gradient based on stage
        let grad = this.ctx.createRadialGradient(this.w/2, this.h/2, 0, this.w/2, this.h/2, this.w);
        
        if (stage === 5) {
            // Brighter celebration background
            grad.addColorStop(0, '#111522');
            grad.addColorStop(1, '#050505');
        } else {
            // Default dark background
            grad.addColorStop(0, '#0a0a0f');
            grad.addColorStop(1, '#000000');
        }
        
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.w, this.h);
        
        // Draw floating soft lights
        const t = Date.now() * 0.0005;
        this.ctx.globalCompositeOperation = 'lighter';
        
        // Saffron Glow
        this.drawGlow(this.w * 0.2 + Math.cos(t)*100, this.h * 0.3 + Math.sin(t)*100, CONFIG.COLORS.SAFFRON);
        // Green Glow
        this.drawGlow(this.w * 0.8 + Math.sin(t*0.8)*100, this.h * 0.7 + Math.cos(t*0.8)*100, CONFIG.COLORS.GREEN);
        
        this.ctx.globalCompositeOperation = 'source-over';

        // Draw twinkling stars
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            star.alpha += star.speed;
            if(star.alpha > 1 || star.alpha < 0) star.speed *= -1;
            this.ctx.globalAlpha = Math.abs(star.alpha) * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.r, 0, Math.PI*2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
    }

    drawGlow(x, y, color) {
        let g = this.ctx.createRadialGradient(x, y, 0, x, y, this.w * 0.4);
        g.addColorStop(0, `${color}22`); // low alpha hex
        g.addColorStop(1, 'transparent');
        this.ctx.fillStyle = g;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.w * 0.4, 0, Math.PI*2);
        this.ctx.fill();
    }
}

// ============================================================================
// MAIN ENGINE
// ============================================================================
class Engine {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        
        this.bgSystem = new BackgroundSystem('bgCanvas');
        this.shapeGen = new ShapeGenerator(window.innerWidth, window.innerHeight);
        
        this.particles = [];
        this.fireworks = [];
        this.confetti = [];
        this.grid = null;
        
        this.lastTime = 0;
        this.animationFrame = null;
        
        this.init();
        this.bindEvents();
        this.loop(0);
    }

    init() {
        this.resize();
        this.particles = [];
        
        // Initialize random particles for Stage 1
        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            this.particles.push(new Particle(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                this.canvas.width,
                this.canvas.height
            ));
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.bgSystem.resize();
        
        // Re-generate shape gen canvas on resize to match screen
        this.shapeGen = new ShapeGenerator(window.innerWidth, window.innerHeight);
        
        // If already passed stage 1, re-trigger current shape to adjust targets
        if (CONFIG.STAGE > 1) {
            this.setTargetsForStage(CONFIG.STAGE);
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        
        const updateMouse = (e) => {
            mouse.x = e.clientX || (e.touches && e.touches[0].clientX);
            mouse.y = e.clientY || (e.touches && e.touches[0].clientY);
        };
        
        const resetMouse = () => { mouse.x = -1000; mouse.y = -1000; };

        window.addEventListener('mousemove', updateMouse);
        window.addEventListener('touchmove', updateMouse, { passive: true });
        window.addEventListener('mouseleave', resetMouse);
        window.addEventListener('touchend', resetMouse);

        window.addEventListener('click', (e) => {
            if (CONFIG.STAGE === 5) this.createExplosion(e.clientX, e.clientY);
        });

        window.addEventListener('dblclick', (e) => {
            if (CONFIG.STAGE === 5) this.createMegaExplosion(e.clientX, e.clientY);
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('ui-container').classList.add('fade-out');
            this.triggerStage(2);
        });
    }

    setTargetsForStage(stage) {
        let pixels = [];
        
        if (stage === 2) pixels = this.shapeGen.getIndiaMap();
        else if (stage === 3) pixels = this.shapeGen.getFlag();
        else if (stage === 4) pixels = this.shapeGen.getText();

        if (pixels.length === 0) return;

        // Map available pixels to particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const targetPixel = pixels[i % pixels.length];
            p.setTarget(targetPixel.x, targetPixel.y, targetPixel.color);
            // Stagger speeds for organic assembly
            p.speed = Math.random() * 0.04 + 0.01;
        }
    }

    triggerStage(stage) {
        CONFIG.STAGE = stage;
        
        if (stage >= 2 && stage <= 4) {
            this.setTargetsForStage(stage);
        }

        if (stage === 2) {
            setTimeout(() => this.triggerStage(3), CONFIG.TIMINGS.MAP_TO_FLAG);
        } else if (stage === 3) {
            setTimeout(() => this.triggerStage(4), CONFIG.TIMINGS.FLAG_TO_TEXT);
        } else if (stage === 4) {
            setTimeout(() => this.triggerStage(5), CONFIG.TIMINGS.TEXT_TO_CELEBRATION);
        } else if (stage === 5) {
            document.getElementById('celebration-ui').classList.remove('hidden');
            this.initCelebration();
        }
    }

    initCelebration() {
        // Initialize Confetti
        for(let i=0; i<150; i++) {
            this.confetti.push(new Confetti(this.canvas.width, this.canvas.height));
        }
        
        // Auto fireworks loop
        setInterval(() => {
            if(Math.random() < 0.6) {
                this.createExplosion(
                    Math.random() * this.canvas.width,
                    Math.random() * (this.canvas.height * 0.6)
                );
            }
        }, 800);
        
        // Break particles apart slightly
        this.particles.forEach(p => {
            p.targetY += (Math.random() - 0.5) * 50;
            p.targetX += (Math.random() - 0.5) * 50;
        });
    }

    createExplosion(x, y, particleCount = 50) {
        const colors = [CONFIG.COLORS.SAFFRON, CONFIG.COLORS.WHITE, CONFIG.COLORS.GREEN, CONFIG.COLORS.BLUE];
        const exColor = colors[Math.floor(Math.random() * colors.length)];
        for(let i=0; i<particleCount; i++) {
            this.fireworks.push(new FireworkParticle(x, y, exColor));
        }
    }

    createMegaExplosion(x, y) {
        this.createExplosion(x, y, 150);
        setTimeout(() => this.createExplosion(x-50, y+50, 100), 200);
        setTimeout(() => this.createExplosion(x+50, y+50, 100), 400);
    }

    drawConnections() {
        // Only draw connections in Stage 1 to maintain performance, 
        // as forming dense images with lines looks messy and kills FPS.
        if (CONFIG.STAGE !== 1) return;

        // Initialize Spatial Grid for O(N) neighbor lookup
        this.grid = new SpatialHashGrid({w: this.canvas.width, h: this.canvas.height}, 50);
        
        this.ctx.lineWidth = 0.5;
        
        // Insert particles into grid
        for (let i = 0; i < this.particles.length; i++) {
            this.grid.insert(this.particles[i]);
        }

        // Check connections
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            const neighbors = this.grid.findNearby(p1.x, p1.y, 40);
            
            let connections = 0;
            for (let j = 0; j < neighbors.length; j++) {
                const p2 = neighbors[j];
                if (p1 === p2) continue;
                if (connections > 3) break; // Limit max connections per particle

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx*dx + dy*dy;

                if (distSq < 1600) { // 40^2
                    const alpha = 1 - (Math.sqrt(distSq) / 40);
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.2})`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                    connections++;
                }
            }
        }
    }

    loop(timestamp) {
        // Calculate Delta Time / Time in seconds
        globalTime = timestamp * 0.001;

        // Clear canvases
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Background
        this.bgSystem.draw(CONFIG.STAGE);

        // Update and draw Connections (Stage 1 only)
        this.drawConnections();

        // Update and draw Particles
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update(CONFIG.STAGE);
            this.particles[i].draw(this.ctx);
        }

        // Update and draw Confetti (Stage 5)
        if (CONFIG.STAGE === 5) {
            for (let i = 0; i < this.confetti.length; i++) {
                this.confetti[i].update(this.canvas.height);
                this.confetti[i].draw(this.ctx);
            }
        }

        // Update and draw Fireworks
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const fw = this.fireworks[i];
            fw.update();
            fw.draw(this.ctx);
            if (fw.alpha <= 0) {
                this.fireworks.splice(i, 1);
            }
        }

        this.animationFrame = requestAnimationFrame((t) => this.loop(t));
    }
}

// ============================================================================
// BOOTSTRAP
// ============================================================================
window.onload = () => {
    // Initiate Engine once DOM and resources are fully loaded
    const app = new Engine();
};

// visual-effects.js - END PORTAL PARTICLE SYSTEM
// THREE.js REQUIRED

class ParticleSystem {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        this.particles = null;
        this.mouseX = 0;
        this.mouseY = 0;

        this.init();
        this.animate();
    }

    init() {
        // Setup Renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        this.camera.position.z = 100;

        // END PORTAL PARTICLES - GREEN/TEAL FOCUSED with LARGE SQUARES
        const geometry = new THREE.BufferGeometry();
        const count = 8000; // MANY MORE particles
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const opacities = new Float32Array(count);

        // GREEN/TEAL HEAVY color palette (matching reference image)
        const greenDominant = [
            new THREE.Color(0x51806b), // Green-Teal
            new THREE.Color(0x194132), // Dark Green
            new THREE.Color(0x3d6e5a), // Mid Green
            new THREE.Color(0x2a5045), // Forest Green
        ];

        const tealAccents = [
            new THREE.Color(0x72bdc0), // Bright Teal
            new THREE.Color(0x5ba6b4), // Mid Teal
            new THREE.Color(0x55a1ae), // Light Teal
            new THREE.Color(0x3f889a), // Cyan
        ];

        const darkAccents = [
            new THREE.Color(0x0f1e23), // Almost black
            new THREE.Color(0x1a3a3a), // Dark teal
        ];

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // WIDER 3D space distribution
            positions[i3] = (Math.random() - 0.5) * 700;
            positions[i3 + 1] = (Math.random() - 0.5) * 700;
            positions[i3 + 2] = (Math.random() - 0.5) * 700;

            // COLOR DISTRIBUTION: 60% green, 30% teal, 10% dark
            const colorRoll = Math.random();
            let selectedColor;

            if (colorRoll < 0.6) {
                // 60% GREEN dominant
                selectedColor = greenDominant[Math.floor(Math.random() * greenDominant.length)];
            } else if (colorRoll < 0.9) {
                // 30% TEAL accents
                selectedColor = tealAccents[Math.floor(Math.random() * tealAccents.length)];
            } else {
                // 10% DARK accents
                selectedColor = darkAccents[Math.floor(Math.random() * darkAccents.length)];
            }

            colors[i3] = selectedColor.r;
            colors[i3 + 1] = selectedColor.g;
            colors[i3 + 2] = selectedColor.b;

            // VARYING SIZES - Include LARGE SQUARES (like reference image)
            const sizeRoll = Math.random();
            if (sizeRoll < 0.05) {
                // 5% VERY LARGE squares
                sizes[i] = 15 + Math.random() * 20;
            } else if (sizeRoll < 0.15) {
                // 10% LARGE squares
                sizes[i] = 8 + Math.random() * 12;
            } else if (sizeRoll < 0.35) {
                // 20% MEDIUM
                sizes[i] = 4 + Math.random() * 6;
            } else {
                // 65% SMALL particles
                sizes[i] = 1 + Math.random() * 3;
            }

            // VARYING OPACITY (40% - 100%)
            opacities[i] = 0.4 + Math.random() * 0.6;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

        // CUSTOM SHADER for SQUARE particles with per-particle opacity
        const material = new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute float opacity;
                varying vec3 vColor;
                varying float vOpacity;
                
                void main() {
                    vColor = color;
                    vOpacity = opacity;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vOpacity;
                
                void main() {
                    // SQUARE shape (not circle)
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = max(abs(center.x), abs(center.y));
                    if (dist > 0.5) discard;
                    
                    // Slight fade at edges for softer look
                    float edgeFade = 1.0 - smoothstep(0.4, 0.5, dist);
                    
                    gl_FragColor = vec4(vColor, vOpacity * edgeFade);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);

        // Events
        window.addEventListener('resize', () => this.onWindowResize(), false);
        document.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
    }

    onMouseMove(event) {
        this.mouseX = (event.clientX - window.innerWidth / 2) * 0.1;
        this.mouseY = (event.clientY - window.innerHeight / 2) * 0.1;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Gentle rotation
        this.particles.rotation.x += 0.0003;
        this.particles.rotation.y += 0.0005;

        // Interactive Parallax
        this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.05;
        this.camera.position.y += (-this.mouseY - this.camera.position.y) * 0.05;
        this.camera.lookAt(this.scene.position);

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem();
});

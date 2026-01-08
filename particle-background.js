// Three.js Animated Particle Background
// Creates an epic 3D particle field with mouse interaction

class ParticleBackground {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;

        this.init();
        this.animate();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            1,
            10000
        );
        this.camera.position.z = 1000;

        // Create particles
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const color1 = new THREE.Color(0x4299e1); // Blue
        const color2 = new THREE.Color(0xa855f7); // Purple

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Random positions
            positions[i3] = Math.random() * 2000 - 1000;
            positions[i3 + 1] = Math.random() * 2000 - 1000;
            positions[i3 + 2] = Math.random() * 2000 - 1000;

            // Gradient colors
            const mixedColor = color1.clone().lerp(color2, Math.random());
            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Create material
        const material = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        const container = document.getElementById('particle-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        }

        // Event listeners
        document.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onMouseMove(event) {
        this.mouseX = (event.clientX - this.windowHalfX) * 0.5;
        this.mouseY = (event.clientY - this.windowHalfY) * 0.5;
    }

    onWindowResize() {
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate particles
        this.particles.rotation.x += 0.0005;
        this.particles.rotation.y += 0.0005;

        // Mouse parallax
        this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.05;
        this.camera.position.y += (-this.mouseY - this.camera.position.y) * 0.05;
        this.camera.lookAt(this.scene.position);

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ParticleBackground();
});

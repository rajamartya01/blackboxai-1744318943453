// Global variables
let scene, camera, renderer, controls;
let showroomModel, carModel;
let isInteriorView = false;
let loadingManager;
let carModels = [];
let currentCarIndex = 0;

// Check WebGL support
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
        return false;
    }
}

// Show error message
function showError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div class="text-center">
                <div class="text-red-600 text-xl mb-4">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p>${message}</p>
                </div>
                <a href="index.html" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                    Return to Home
                </a>
            </div>
        `;
    }
}

// Initialize the scene
function init() {
    // Check WebGL support
    if (!checkWebGLSupport()) {
        showError('WebGL is not supported in your browser. Please try a different browser or enable WebGL.');
        return;
    }

    try {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);

        // Create camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(5, 2, 5);

        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        // Add lights
        setupLighting();

        // Add controls
        setupControls();

        // Create showroom environment
        createShowroomEnvironment();

        // Create car models
        createCarModels();

        // Add event listeners
        setupEventListeners();

        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        // Start animation loop
        animate();

    } catch (error) {
        console.error('Error initializing scene:', error);
        showError('An error occurred while loading the 3D showroom. Please try again later.');
    }
}

// Setup lighting
function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add spotlights
    const spotLight1 = createSpotlight(5, 5, 0);
    const spotLight2 = createSpotlight(-5, 5, 0);
    scene.add(spotLight1);
    scene.add(spotLight2);
}

// Create spotlight
function createSpotlight(x, y, z) {
    const spotlight = new THREE.SpotLight(0xffffff, 1);
    spotlight.position.set(x, y, z);
    spotlight.angle = Math.PI / 4;
    spotlight.penumbra = 0.1;
    spotlight.decay = 2;
    spotlight.distance = 200;
    spotlight.castShadow = true;
    return spotlight;
}

// Setup controls
function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;
}

// Create showroom environment
function createShowroomEnvironment() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.1,
        metalness: 0.5
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.1
    });

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 20),
        wallMaterial
    );
    backWall.position.set(0, 10, -25);
    scene.add(backWall);

    // Side walls
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 20),
        wallMaterial
    );
    leftWall.position.set(-25, 10, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 20),
        wallMaterial
    );
    rightWall.position.set(25, 10, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);
}

// Create a car model
function createCarModel(color) {
    const group = new THREE.Group();

    // Car body (Hyundai Aura proportions)
    const bodyGeometry = new THREE.BoxGeometry(1.7, 0.5, 3.995); // Actual Aura dimensions (scaled)
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    // Car roof (sedan profile)
    const roofGeometry = new THREE.BoxGeometry(1.65, 0.45, 2.0);
    const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
    roof.position.y = 0.9;
    roof.position.z = -0.4;
    // Add slight tilt to the roof for aerodynamic look
    roof.rotation.x = -0.05;
    roof.castShadow = true;
    group.add(roof);

    // Trunk (distinctive sedan feature)
    const trunkGeometry = new THREE.BoxGeometry(1.6, 0.35, 0.8);
    const trunk = new THREE.Mesh(trunkGeometry, bodyMaterial);
    trunk.position.set(0, 0.7, -1.5);
    trunk.castShadow = true;
    group.add(trunk);

    // Front grille (Hyundai signature cascading grille)
    const grilleGeometry = new THREE.BoxGeometry(1.4, 0.4, 0.1);
    const grilleMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x111111,
        metalness: 0.9,
        roughness: 0.2
    });
    const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
    grille.position.set(0, 0.4, 2.0);
    group.add(grille);

    // Interior
    const interiorGroup = new THREE.Group();
    
    // Dashboard
    const dashboardGeometry = new THREE.BoxGeometry(1.8, 0.3, 0.8);
    const dashboardMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.8
    });
    const dashboard = new THREE.Mesh(dashboardGeometry, dashboardMaterial);
    dashboard.position.set(0, 0.8, 1.2);
    interiorGroup.add(dashboard);

    // Steering wheel
    const steeringWheelGeometry = new THREE.TorusGeometry(0.2, 0.03, 16, 32);
    const steeringWheelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x111111,
        metalness: 0.7,
        roughness: 0.3
    });
    const steeringWheel = new THREE.Mesh(steeringWheelGeometry, steeringWheelMaterial);
    steeringWheel.position.set(-0.4, 0.9, 0.9);
    steeringWheel.rotation.x = Math.PI / 2;
    interiorGroup.add(steeringWheel);

    // Seats
    const seatGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const seatMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x222222,
        metalness: 0.3,
        roughness: 0.8
    });
    
    // Driver seat
    const driverSeat = new THREE.Mesh(seatGeometry, seatMaterial);
    driverSeat.position.set(-0.5, 0.7, 0);
    interiorGroup.add(driverSeat);

    // Passenger seat
    const passengerSeat = new THREE.Mesh(seatGeometry, seatMaterial);
    passengerSeat.position.set(0.5, 0.7, 0);
    interiorGroup.add(passengerSeat);

    group.add(interiorGroup);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.7
    });

    const wheelPositions = [
        { x: -1.2, z: 1.5 },  // Front Left
        { x: 1.2, z: 1.5 },   // Front Right
        { x: -1.2, z: -1.5 }, // Back Left
        { x: 1.2, z: -1.5 }   // Back Right
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos.x, 0.4, pos.z);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        group.add(wheel);
    });

    // Headlights
    const headlightGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16);
    const headlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.5
    });

    const headlightPositions = [
        { x: -0.8, z: 2.4 }, // Left
        { x: 0.8, z: 2.4 }   // Right
    ];

    headlightPositions.forEach(pos => {
        const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlight.position.set(pos.x, 0.5, pos.z);
        headlight.rotation.z = Math.PI / 2;
        group.add(headlight);
    });

    // Windows
    const windowMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x111111,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.7
    });

    // Windshield
    const windshieldGeometry = new THREE.PlaneGeometry(1.8, 1);
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.position.set(0, 1, 0.7);
    windshield.rotation.x = Math.PI / 3;
    group.add(windshield);

    // Rear window
    const rearWindowGeometry = new THREE.PlaneGeometry(1.8, 0.8);
    const rearWindow = new THREE.Mesh(rearWindowGeometry, windowMaterial);
    rearWindow.position.set(0, 1, -1.3);
    rearWindow.rotation.x = -Math.PI / 3;
    group.add(rearWindow);

    return group;
}

// Create car models
function createCarModels() {
    // Hyundai Aura colors: Polar White, Titan Grey, Typhoon Silver
    const carColors = [0xFFFFFF, 0x808080, 0xC0C0C0];
    const positions = [
        { x: 0, z: 0, rotation: 0 },          // Center car
        { x: 4, z: 2, rotation: -Math.PI/6 }, // Right car
        { x: -4, z: 2, rotation: Math.PI/6 }  // Left car
    ];

    positions.forEach((pos, index) => {
        const car = createCarModel(carColors[index]);
        car.position.set(pos.x, 0, pos.z);
        car.rotation.y = pos.rotation;
        scene.add(car);
        carModels.push(car);
    });

    // Adjust initial camera position for better view
    camera.position.set(8, 3, 8);
    controls.target.set(0, 0, 0);
    controls.update();
}

// Setup event listeners
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize, false);

    // Control buttons
    document.getElementById('rotate-left').addEventListener('click', () => rotateCar('left'));
    document.getElementById('rotate-right').addEventListener('click', () => rotateCar('right'));
    document.getElementById('zoom-in').addEventListener('click', () => zoomCamera('in'));
    document.getElementById('zoom-out').addEventListener('click', () => zoomCamera('out'));
    document.getElementById('toggle-interior').addEventListener('click', toggleInteriorView);

    // Keyboard controls
    window.addEventListener('keydown', handleKeyDown);
}

// Handle keyboard controls
function handleKeyDown(event) {
    const moveSpeed = 0.1;
    switch(event.key.toLowerCase()) {
        case 'w': moveCamera('forward', moveSpeed); break;
        case 's': moveCamera('backward', moveSpeed); break;
        case 'a': moveCamera('left', moveSpeed); break;
        case 'd': moveCamera('right', moveSpeed); break;
    }
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Car rotation
function rotateCar(direction) {
    const rotationSpeed = 0.1;
    if (direction === 'left') {
        carModels[currentCarIndex].rotation.y += rotationSpeed;
    } else {
        carModels[currentCarIndex].rotation.y -= rotationSpeed;
    }
}

// Camera zoom
function zoomCamera(direction) {
    const zoomSpeed = 1;
    if (direction === 'in' && controls.target.distanceTo(camera.position) > controls.minDistance) {
        camera.position.lerp(controls.target, 0.1);
    } else if (direction === 'out' && controls.target.distanceTo(camera.position) < controls.maxDistance) {
        camera.position.lerp(controls.target, -0.1);
    }
}

// Camera movement
function moveCamera(direction, speed) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up);

    switch(direction) {
        case 'forward':
            camera.position.addScaledVector(forward, speed);
            controls.target.addScaledVector(forward, speed);
            break;
        case 'backward':
            camera.position.addScaledVector(forward, -speed);
            controls.target.addScaledVector(forward, -speed);
            break;
        case 'left':
            camera.position.addScaledVector(right, -speed);
            controls.target.addScaledVector(right, -speed);
            break;
        case 'right':
            camera.position.addScaledVector(right, speed);
            controls.target.addScaledVector(right, speed);
            break;
    }
}

// Toggle interior view
function toggleInteriorView() {
    isInteriorView = !isInteriorView;
    if (isInteriorView) {
        // Position camera at driver's seat looking forward (refined for better view)
        camera.position.set(-0.45, 1.0, 0.3);
        controls.target.set(-0.45, 1.0, 1.2);
        
        // Adjust controls for interior view
        controls.minDistance = 0.1;
        controls.maxDistance = 1.2;
        controls.maxPolarAngle = Math.PI;
        controls.minPolarAngle = 0; // Allow looking up
        
        // Enhanced interior lighting
        const dashboardLight = new THREE.PointLight(0xffffff, 0.4);
        dashboardLight.position.set(0, 1.1, 0.6);
        dashboardLight.name = 'dashboardLight';
        scene.add(dashboardLight);
        
        const ambientInterior = new THREE.AmbientLight(0xffffff, 0.5);
        ambientInterior.name = 'ambientInterior';
        scene.add(ambientInterior);
        
        const steeringLight = new THREE.PointLight(0xffffff, 0.2);
        steeringLight.position.set(-0.4, 0.9, 0.4);
        steeringLight.name = 'steeringLight';
        scene.add(steeringLight);
    } else {
        // Reset to exterior view
        camera.position.set(5, 2, 5);
        controls.target.set(0, 0, 0);
        
        // Reset controls
        controls.minDistance = 3;
        controls.maxDistance = 10;
        controls.maxPolarAngle = Math.PI / 2;
        
        // Remove interior lights
        const dashboardLight = scene.getObjectByName('dashboardLight');
        if (dashboardLight) {
            scene.remove(dashboardLight);
        }
        
        const ambientInterior = scene.getObjectByName('ambientInterior');
        if (ambientInterior) {
            scene.remove(ambientInterior);
        }
    }
    
    // Update controls immediately
    controls.update();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Initialize the scene when the page loads
window.addEventListener('load', init);

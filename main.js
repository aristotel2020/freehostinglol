import * as THREE from 'three';
import { GameWorld, DroneManager, WORLD_SIZE, BLOCK_SIZE } from './world_logic.js';

let scene, camera, renderer, world, droneMgr;
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();

// UI elements
const infoPanel = document.getElementById('info-panel');
const infoText = document.getElementById('block-details');

let moveSpeed = 48.0; // Increased speed slightly for a larger map
let yaw = 0;
let pitch = 0;
const keys = {};

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x81eceb, 10, 350);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(50, 100, 50);
    scene.add(ambient, sun);

    // Logic Systems
    world = new GameWorld();
    droneMgr = new DroneManager();
    droneMgr.init();

    // World Generation Rendering
    const geometry = new THREE.BoxGeometry(9.8, 10, 9.8);
    const material = new THREE.MeshStandardMaterial({ color: 0x7a8ca3 });

    for (let x = 0; x < world.grid.length; x++) {
        for (let z = 0; z < world.grid[x].length; z++) {
            const blockData = world.grid[x][z];
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(blockData.pos);
            mesh.userData.originalData = blockData;
            scene.add(mesh);
        }
    }

    // Spawn Player in the center of the map
    const midX = Math.floor(WORLD_SIZE.width / 2);
    const midZ = Math.floor(WORLD_SIZE.depth / 2);
    const spawnBlock = world.grid[midX][midZ];
    camera.position.set(spawnBlock.pos.x, spawnBlock.pos.y + 20, spawnBlock.pos.z);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Input Handling
    window.addEventListener('keydown', (e) => { keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });

    document.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    window.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.5, Math.min(1.5, pitch));
        }
    });

    // Crosshair Raycasting logic
    window.addEventListener('mousedown', (e) => {
        // Only trigger interactions if we are actively controlling the camera
        if (document.pointerLockElement === renderer.domElement) {
            // Raycast directly from the center of the screen
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

            const hits = raycaster.intersectObjects(scene.children);
            if (hits.length > 0) {
                const hit = hits[0];
                // Only interact if within 50 units
                if (hit.distance < 50) {
                    const obj = hit.object;
                    if (obj.userData && obj.userData.originalData) {
                        infoPanel.style.display = 'block';
                        infoText.innerText = obj.userData.originalData.dataString;
                    }
                } else {
                    // Optional: show range warning or keep panel hidden
                    infoPanel.style.display = 'none';
                }
            }
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // 1. Update Drones
    if (droneMgr) droneMgr.update(delta);

    // 2. Camera Rotation - ENFORCING YXZ ORDER
    camera.rotation.set(pitch, yaw, 0, 'YXZ');

    // 3. Movement Logic
    const moveDir = new THREE.Vector3();
    const qForward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, yaw, 0));
    const qRight = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, yaw, 0));

    if (keys['KeyW']) moveDir.add(qForward);
    if (keys['KeyS']) moveDir.sub(qForward);
    if (keys['KeyA']) moveDir.sub(qRight);
    if (keys['KeyD']) moveDir.add(qRight);

    if (moveDir.length() > 0) {
        moveDir.normalize();
        camera.position.add(moveDir.multiplyScalar(moveSpeed * delta));
    }

    renderer.render(scene, camera);
}

init();
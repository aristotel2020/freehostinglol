import * as THREE from 'three';

export const WORLD_SIZE = { width: 100, depth: 100 };
export const BLOCK_SIZE = 10;

export const MATERIALS = {
    IRON: { name: 'Iron', price: 10, color: 0x888888 },
    SILICON: { name: 'Silicon', price: 5, color: 0x999999 },
    ALUMINUM: { name: 'Aluminum', price: 15, color: 0xcccccc },
    TITANIUM: { name: 'Titanium', price: 40, color: 0xaaaaaa },
    BORON: { name: 'Boron', price: 25, color: 0xbbbbbb },
    LITHIUM: { name: 'Lithium', price: 30, color: 0xcccccc },
    REGOLITH: { name: 'Regolith', price: 0, color: 0x444444 }
};

class Block {
    constructor(x, y, z) {
        this.pos = new THREE.Vector3(x, y, z);

        let title = "Rock Segment";
        if (y > 45) title = "Highland Ore";
        else if (y < 25) title = "Lowland Core";

        // Distribution logic for Minerals summing to 100%
        const items = ['IRON', 'SILICON', 'ALUMINUM', 'TITANIUM', 'BORON', 'LITHIUM', 'REGOLITH'];
        let distribution = {};

        // Generate weighted seeds
        let totalWeight = 0;
        items.forEach(key => {
            distribution[key] = Math.random() * 50;
            totalWeight += distribution[key];
        });

        // Normalize to exactly 100% and handle rounding
        let actualSum = 0;
        items.forEach(key => {
            distribution[key] = Math.round((distribution[key] / totalWeight) * 100);
            actualSum += distribution[key];
        });

        // Final pass to fix floating point/rounding issues
        if (actualSum !== 100) {
            const diff = 100 - actualSum;
            distribution['REGOLITH'] += diff;
        }

        let resultStr = "Minerals:";
        items.forEach(key => {
            const m = MATERIALS[key];
            resultStr += ` ${m.name}: ${distribution[key]}% (Val: ${m.price})`;
        });

        this.dataString = `Location: ${Math.floor(x/10)}, ${Math.floor(z/10)}\nBio: ${title}\n${resultStr}`;
    }
}

export class GameWorld {
    constructor() {
        this.grid = [];
        this.init();
    }
    init() {
        for (let x = 0; x < WORLD_SIZE.width; x++) {
            this.grid[x] = [];
            for (let z = 0; z < WORLD_SIZE.depth; z++) {
                const h = 35 + (Math.sin(x/8) * Math.cos(z/8)) * 15;
                // Passed strictly as x, y, z
                this.grid[x][z] = new Block(x * BLOCK_SIZE, h, z * BLOCK_SIZE);
            }
        }
    }
}

export class Drone {
    constructor(id, startPos) {
        this.id = id;
        this.pos = new THREE.Vector3().copy(startPos);
        this.state = 'IDLE';
        this.target = null;
        this.mesh = new THREE.Group();

        const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(1, 2, 4),
            new THREE.MeshStandardMaterial({color: 0xffffff})
        );
        body.rotation.x = Math.PI/2;
        this.mesh.add(body);
        this.mesh.position.copy(this.pos);
    }
    update(delta) {
        if (this.state === 'IDLE') { /* logic for search */ }
        if (this.mesh.rotation.y === 0 && Math.random() > 0.99) this.mesh.rotation.y += 0.1;
    }
}

export class DroneManager {
    constructor() { this.drones = []; }
    init() {
        for (let i = 0; i < 8; i++) {
            this.drones.push(new Drone(
                i,
                new THREE.Vector3(Math.random() * (WORLD_SIZE.width * BLOCK_SIZE), Math.random() * 40 + 20, Math.random() * (WORLD_SIZE.depth * BLOCK_SIZE))
            ));
        }
    }
    update(delta) { this.drones.forEach(d => d.update(delta)); }
}
import * as THREE from "three";
import { FlyControls } from "./controls/fly.js";
import { PointerLockControls } from "./controls/lock.js";
import { cyrb128, sfc32 } from "./math/rand.js";

const baseRandom = sfc32(0, 0, 0, 0);

let scale = 1000;
let todo = [];
const popOut = 250000;
const popIn = 200000;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    32000000,
);

scene.add(camera);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
});

// const controls = new OrbitControls(camera, renderer.domElement);
// const controls = new FlyControls(camera, renderer.domElement);
// controls.movementSpeed = 1000;
// controls.domElement = renderer.domElement;
const controls = new PointerLockControls(camera, document.body);
controls.dragToLook = false;
controls.autoForward = false;
controls.dragToLook = false;

const fly = new FlyControls(camera, renderer.domElement);
// fly.movementSpeed = scale * 256;
fly.movementSpeed = scale * 64;
fly.rollSpeed = 0;
fly.autoForward = false;
fly.dragToLook = false;

document.addEventListener('keydown', (event) => {
    if (event.key === '1') {
        fly.movementSpeed *= 0.5;
    }
    if (event.key === '2') {
        fly.movementSpeed /= 0.5;
    }
})

const degToRad = Math.PI / 180;
const radToDeg = 1 / degToRad;

const realGalaxy = (config) => {
    let pos = config.pos ?? new THREE.Vector3(0, 0, 0);
    let quaternion = config.quaternion;
    if (quaternion == null) {
        quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(new THREE.Vector3( 0,1,0 ), 0);
    }
    let pow = config.pow ?? 0.5;
    let angle = config.angle ?? 72.001;
    let count = config.count ?? 100000;
    let profileScale = config.profileScale ?? 0.20;
    let profilePow = config.ppow ?? 0.8;
    let profileOffset = config.profileOffset ?? 0.02;
    let random = config.random ?? baseRandom;

    const profile = (index) => {
        return (1 - index / count) * profileScale * Math.pow(random(), profilePow) + profileOffset;
    };

    const rand2 = () => {
        return random() - 0.5;
    };

    const rand = () => {
        return rand2();
    }

    const wiggle = (index) => {
        const v3 = new THREE.Vector3(rand(), rand(), rand()).normalize();
        const off = profile(index);
        v3.multiplyScalar(off);
        return v3;
    };

    const posSphere = (index) => {
        const theta = index * degToRad * angle;
        const ret = new THREE.Vector3(
            Math.cos(theta) * Math.pow(index / count, pow),
            0,
            Math.sin(theta) * Math.pow(index / count, pow),
        );
        ret.add(wiggle(index));
        ret.multiplyScalar(scale);
        return ret;
    };

    const geometry = new THREE.BufferGeometry();
    const position = [];
    for (let i = 0; i < count; i++) {
        const v3 = posSphere(i);
        v3.applyQuaternion(quaternion);
        v3.add(pos);
        position.push(v3.x, v3.y, v3.z);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
    const material = new THREE.PointsMaterial({
        size: 0.0003 * scale,
        sizeAttenuation: true,
        color: 'white',
    });
    const points = new THREE.Points(geometry, material);
    // points.position.copy(pos);
    // points.quaternion.copy(quaternion);
    scene.add(points);
    return points;
};

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
const material = new THREE.PointsMaterial({
    size: scale * 0.9,
    sizeAttenuation: true,
    color: 'white',
});
const fakeGalaxy = (config) => {
    const seed = config.seed;
    let point = new THREE.Points(geometry, material);
    scene.add(point);
    point.position.copy(config.pos);
    let real = false;
    todo.push(() => {
        if (config.pos.distanceTo(camera.position) < popIn && !real) {
            config.random = sfc32(seed[0], seed[1], seed[2], seed[3]);
            scene.remove(point);

            point = realGalaxy(config);
            real = true;
        }
        if (config.pos.distanceTo(camera.position) > popOut && real) {
            config.random = sfc32(seed[0], seed[1], seed[2], seed[3]);
            scene.remove(point);
            point.geometry.dispose();

            point = new THREE.Points(geometry, material);
            scene.add(point);
            point.position.copy(config.pos);
            real = false;
        }
    });
};

const galaxy = fakeGalaxy;

const randomQuaternion = () => {
    do {
        var x = baseRandom() * 2 - 1;
        var y = baseRandom() * 2 - 1;
        var z = x * x + y * y;
    } while (z > 1);
    do {
        var u = baseRandom() * 2 - 1;
        var v = baseRandom() * 2 - 1;
        var w = u * u + v * v;
    } while (w > 1);
    var s = Math.sqrt((1 - z) / w);
    return new THREE.Quaternion(x, y, s * u, s * v);
}

for (var i = 0; i < 10000; i++) {
    const points = 50000 * (baseRandom() * 0.9 + 0.1);
    const numArms = Math.floor(baseRandom() * 2 + 4);
    const swirl = Math.pow(baseRandom() * 2 - 1, 1) * 1600;
    const pos = new THREE.Vector3(baseRandom()*2-1, baseRandom()*2-1, baseRandom()*2-1);
    // if (pos.distanceTo(new THREE.Vector3(0, 0, 0)) > 1) {
        // continue;
    // }
    // const pos = new THREE.Vector3(0, 0, 0);
    // pos.multiplyScalar(Math.pow(baseRandom(), 3));
    // pos.multiplyScalar(2 - Math.pow(baseRandom(), 3));
    pos.multiplyScalar(4000000);
    galaxy({
        count: points,
        angle: 360 / numArms + swirl/points,
        pos: pos,
        quaternion: randomQuaternion(),
        seed: cyrb128([i]),
        pow: 3,
        ppow: 0.2,
    });
}

renderer.setSize(window.innerWidth, window.innerHeight);
let t = new Date();
const animate = () => {
    if (document.body.contains(renderer.domElement)) {
        requestAnimationFrame(animate);
        // setTimeout(animate, 0);
    }
    const ms = (new Date() - t);
    const b = new Date();
    fly.update(ms / 1000);
    for (const to of todo) {
        to();
    }
    const e = new Date();
    console.log(e - b);
    // angle += 0.001;
    renderer.render(scene, camera);
    t = new Date();
};

export const load = (domElement) => {
    // genSpheres();
    domElement.appendChild(renderer.domElement);
    animate();
    fly.domElement = domElement;
    domElement.addEventListener('click', function () {
        controls.lock();
    });
};

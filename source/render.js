import * as THREE from "three";
import { FlyControls } from "./controls/fly.js";
import { PointerLockControls } from "./controls/lock.js";

// let pow = -0.2;
let pow = 0.5;
// let angle = 222.4922;
let angle = 72.00012;
let count = 1000000;
let profileScale = 0.20;
let profilePow = 0.8;
let profileOffset = 0.02

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.x = 0;
camera.position.y = 120;
camera.lookAt(new THREE.Vector3(0, 0, 0));

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
fly.movementSpeed = 100;
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

const profile = (index) => {
    return (1 - index / count) * profileScale * Math.pow(Math.random(), profilePow) + profileOffset;
};

const rand2 = () => {
    return Math.random() - 0.5;
};

const rand = () => {
    return rand2();
}

const wiggle = (index) => {
    const v3 = new THREE.Vector3(rand(), rand(), rand()).normalize();
    const off = profile(index);
    v3.multiply(new THREE.Vector3(off, off, off));
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
    ret.multiplyScalar(100);
    return ret;
};

// const geometry = new THREE.BoxGeometry(k,k,k);
// const material = new THREE.MeshBasicMaterial({ color: 0xffff77 });
const geometry = new THREE.BufferGeometry();
const position = [];
for (let i = 0; i < count; i++) {
    const v3 = posSphere(i)
    position.push(v3.x, v3.y, v3.z);
}
geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
const material = new THREE.PointsMaterial({
    size: 0.01,
    sizeAttenuation: true,
});
const sphere = new THREE.Points(geometry, material);
scene.add(sphere);

// const newSphere = (index) => {
//     // const sphere = new THREE.Mesh(geometry, material)
//     const sphere = new THREE.Points(geometry, material);
//     sphere.position.set(posSphere(index));
//     scene.add(sphere);
//     return sphere;
// };

// const genSpheres = () => {
//     while (spheres.length < count) {
//         spheres.push(newSphere(spheres.length));
//     }
//     let index = startOffset;
//     for (const sphere of spheres) {
//         sphere.position.set(...posSphere(index++));
//     }
// };

renderer.setSize(window.innerWidth, window.innerHeight);
let t = new Date();
const animate = () => {
    requestAnimationFrame(animate);
    fly.update((new Date() - t) / 1000);
    // angle += 0.001;
    renderer.render(scene, camera);
    t = new Date();
}

export const load = (domElement) => {
    // genSpheres();
    domElement.appendChild(renderer.domElement);
    animate();
    fly.domElement = domElement;
    domElement.addEventListener('click', function () {
        controls.lock();
    });
};

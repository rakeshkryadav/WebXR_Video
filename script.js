import * as THREE from "three";
import { MindARThree } from "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";

const mindarThree = new MindARThree({
    container: document.body,
    imageTargetSrc: "cards.mind"
});

const { renderer, scene, camera } = mindarThree;

// Create anchor for target index 0
const anchor = mindarThree.addAnchor(0);

// Create video element
const videos = [];

for (let i = 0; i < 3; i++) {

    const anchor = mindarThree.addAnchor(i);

    const video = document.createElement("video");
    video.src = "video/video.mp4";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.load();

    const texture = new THREE.VideoTexture(video);

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.5625),
        new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            toneMapped: false
        })
    );

    anchor.group.add(plane);

    anchor.onTargetFound = async () => {
        console.log(`Target ${i} Found`);
        await video.play();
    };

    anchor.onTargetLost = () => {
        console.log(`Target ${i} Lost`);
        video.pause();
        video.currentTime = 0;
    };

    videos.push(video);
}

video.src = "video/video.mp4";
video.loop = true;
video.muted = true;
video.playsInline = true;
video.crossOrigin = "anonymous";
video.preload = "auto";
video.load();

// Create video texture
const videoTexture = new THREE.VideoTexture(video);

// Create material
const material = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.DoubleSide,
    toneMapped: false
});

// Plane size (16:9)
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 0.5625),
    material
);

anchor.group.add(plane);

// Play video when target is found
anchor.onTargetFound = async () => {
    console.log("Target Found");

    try {
        await video.play();
    } catch (err) {
        console.error("Video play failed:", err);
    }
};

// Pause when target is lost
anchor.onTargetLost = () => {
    console.log("Target Lost");
    video.pause();
    video.currentTime = 0;
};

await mindarThree.start();

renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});
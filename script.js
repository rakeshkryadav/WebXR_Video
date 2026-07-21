import * as THREE from "three";
import { MindARThree } from "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";

const mindarThree = new MindARThree({
    container: document.body,
    imageTargetSrc: "cards.mind"
});

const { renderer, scene, camera } = mindarThree;

// Create video element
const videos = [];

console.log("SCRIPT LOADED 01");

for (let i = 0; i < 3; i++) {

    const anchor = mindarThree.addAnchor(i);

    const video = document.createElement("video");
    video.src = "video/video.mp4";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
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

await mindarThree.start();

renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});
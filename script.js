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

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");

playBtn.addEventListener("click", async () => {
    for (const video of videos) {
        try {
            await video.play();
        } catch (e) {
            console.error(e);
        }
    }
});

pauseBtn.addEventListener("click", () => {
    for (const video of videos) {
        video.pause();
    }
});

renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});


// Share Button
var message = "Check out AR Experience!";
var url = "https://rakeshkryadav.github.io/WebXR_Video";

const shareBtn = document.getElementById("shareBtn");
const panel = document.querySelector(".panel");

shareBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.toggle("show");
});

// Hide when clicking outside
document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && !shareBtn.contains(e.target)) {
        panel.classList.remove("show");
    }
});


// Share Website
document.querySelectorAll(".card-btn").forEach(button => {
    button.addEventListener("click", () => {
        shareWebsite(
            button.dataset.image
        );
    });
});

async function shareWebsite(imagePath, text, url) {
    // Hide panel
        panel.classList.remove("show");

    try {
        await mindarThree.stop();

        const response = await fetch(imagePath);
        const blob = await response.blob();

        const extension = imagePath.split(".").pop();

        const file = new File(
            [blob],
            `share.${extension}`,
            { type: blob.type }
        );

        if (navigator.canShare && navigator.canShare({ files: [file] })) {

            await navigator.share({
                files: [file],
                text: text + "\n" + url
            });

        } else {
            alert("Your browser doesn't support file sharing.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        // Restart camera when the user returns
        try {
            await mindarThree.start();
        } catch (e) {}
    }
}
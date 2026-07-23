import * as THREE from "three";
import { MindARThree } from "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";

console.log("test 05");

const mindarThree = new MindARThree({
    container: document.body,
    imageTargetSrc: "cards.mind"
});

const { renderer, scene, camera } = mindarThree;

// Raycaster for touch/click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const clickableObjects = [];

for (let i = 0; i < 3; i++) {

    const anchor = mindarThree.addAnchor(i);

    // Video
    const video = document.createElement("video");
    video.src = "video/video.mp4";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.load();

    const texture = new THREE.VideoTexture(video);

    const videoPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.5625),
        new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            toneMapped: false
        })
    );

    anchor.group.add(videoPlane);

    // Play/Pause Button
    const playTexture = new THREE.TextureLoader().load("images/play.png");
    const pauseTexture = new THREE.TextureLoader().load("images/pause.png");

    // Single button
    const playPauseButton = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, 0.15),
        new THREE.MeshBasicMaterial({
            map: pauseTexture, // Video starts playing when target is found
            transparent: true
        })
    );

    playPauseButton.position.set(0, -0.38, 0.01);

    anchor.group.add(playPauseButton);

    // Save references for click detection
    clickableObjects.push({
        button: playPauseButton,
        video,
        playTexture,
        pauseTexture
    });

    // Auto play when target found
    anchor.onTargetFound = async () => {
        playPauseButton.material.map = playTexture;
        playPauseButton.material.needsUpdate = true;
    };

    anchor.onTargetLost = () => {
        video.pause();
        video.currentTime = 0;
        playPauseButton.material.map = playTexture;
        playPauseButton.material.needsUpdate = true;
    };
}

// Interaction Handle
function handleInteraction(event) {

    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const y = event.touches ? event.touches[0].clientY : event.clientY;

    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    clickableObjects.forEach((item) => {

        const hits = raycaster.intersectObject(item.button);

        if (hits.length > 0) {

            if (item.video.paused) {
                item.video.muted = false;
                item.video.play();
                item.button.material.map = item.pauseTexture;
                console.log("Play");
            } else {
                item.video.pause();
                item.button.material.map = item.playTexture;
                console.log("Pause");
            }

            item.button.material.needsUpdate = true;
        }

    });
}

window.addEventListener("pointerdown", handleInteraction);

// Start AR
await mindarThree.start();

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
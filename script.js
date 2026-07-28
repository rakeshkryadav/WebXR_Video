import * as THREE from "three";
import { MindARThree } from "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

console.log("test 28");

const mindarThree = new MindARThree({
    container: document.body,
    imageTargetSrc: "cards.mind",
    filterMinCF: 0.001,         // default: 0.001   (decrease the value to make it less jittery)
    filterBeta: 0,             // default: 1000    (increase the value to reduce the delay)
    warmupTolerance: 5,          // default: 5
    missTolerance: 0,           // default: 5
});

const { renderer, scene, camera } = mindarThree;

// Create a HemisphereLight and add it to the scene
scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

// Raycaster for touch/click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const clickableObjects = [];

const loader = new GLTFLoader();
const mixers = [];
const clock = new THREE.Clock();

const messageText = [
    "VAA wishes you Happy 80th Independence Day",
    "UFS Digital wishes you Happy 80th Independence Day",
    "UPICON wishes you Happy 80th Independence Day"
];

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
        new THREE.PlaneGeometry(1.8, 1.6),
        new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            toneMapped: false
        })
    );

    videoPlane.position.set(0, 1.5, 0);

    // Model Flag
    loader.load("model/model.glb", (gltf) => {

        gltf.scene.scale.set(0.6, 0.6, 0.6);
        gltf.scene.position.set(0, 0.5, 0);

        anchor.group.add(gltf.scene);

        if (gltf.animations.length > 0) {
            // Create an AnimationMixer
            const mixer = new THREE.AnimationMixer(gltf.scene);

            // Play all animations
            gltf.animations.forEach((clip) => {
                mixer.clipAction(clip).play();
            });

            mixers.push(mixer);
        }

    });

    // Model India gate
    loader.load("model/indiagate.glb", (gltf) => {

        gltf.scene.scale.set(0.6, 0.6, 0.6);
        gltf.scene.position.set(0.65, 0.5, 0);
        gltf.scene.rotation.set(0, 0, THREE.MathUtils.degToRad(45));

        anchor.group.add(gltf.scene);

    });

    // Text
    function createTextTexture(text) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = 1000;

        const fontSize = 100;
        const padding = 30;
        const lineHeight = fontSize + 15;

        context.font = `${fontSize}px Arial`;

        // Wrap text
        const maxWidth = canvas.width - padding * 2;

        const words = text.split(" ");
        const lines = [];
        let line = "";

        for (const word of words) {

            const testLine = line ? line + " " + word : word;

            if (context.measureText(testLine).width > maxWidth) {
                lines.push(line);
                line = word;
            }
            else {
                line = testLine;
            }
        }

        if (line) lines.push(line);

        // Resize canvas
        canvas.height = lines.length * lineHeight + padding * 2;

        // Reset after resizing
        context.font = `${fontSize}px Arial`;

        // Background
        context.beginPath();
        context.roundRect(0, 0, canvas.width, canvas.height, 40);
        context.fillStyle = "rgba(0,0,0,0.9)";
        context.fill();

        // Text
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "top";

        const topPadding = 30;
        const startY = topPadding;

        lines.forEach((line, i) => {

            context.fillText(
                line,
                canvas.width / 2,
                startY + i * lineHeight
            );

        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        return {
            texture,
            aspect: canvas.width / canvas.height
        };
    }

    // Create text texture
    const textData = createTextTexture(messageText[i]);

    const textMesh = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: textData.texture,
            transparent: true
        })
    );

    // Height of the sprite in world units
    const height = 0.6;

    // Width is automatically adjusted
    textMesh.scale.set(height * textData.aspect, height, 1);

    textMesh.position.set(0, -1, 0.01);


    // Play/Pause Button
    const playTexture = new THREE.TextureLoader().load("images/play.png");
    const pauseTexture = new THREE.TextureLoader().load("images/pause.png");

    // Single button
    const playPauseButton = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.3),
        new THREE.MeshBasicMaterial({
            map: pauseTexture, // Video starts playing when target is found
            transparent: true
        })
    );

    playPauseButton.position.set(0, 1.5, 0.01);

    anchor.group.add(videoPlane);
    anchor.group.add(playPauseButton);
    anchor.group.add(textMesh);

    // Save references for click detection
    clickableObjects.push({
        button: playPauseButton,
        videoPlane,
        video,
        playTexture,
        pauseTexture,
        hideTimer: null
    });

    // Auto play when target found
    anchor.onTargetFound = () => {
        playPauseButton.visible = true;
        playPauseButton.material.map = playTexture;
        playPauseButton.material.needsUpdate = true;
    };

    anchor.onTargetLost = () => {
        video.pause();
        video.currentTime = 0;

        playPauseButton.visible = true;
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

        // Click on button
        const buttonHit = raycaster.intersectObject(item.button);

        if (buttonHit.length > 0 && item.video.paused) {

            item.video.muted = false;
            item.video.play();

            item.button.visible = true;
            item.button.material.map = item.pauseTexture;
            item.button.material.needsUpdate = true;

            // Cancel previous timer
            if (item.hideTimer) clearTimeout(item.hideTimer);

            // Hide after 1 second
            item.hideTimer = setTimeout(() => {
                item.button.visible = false;
            }, 1000);

            return;
        }

        // Click on video
        const videoHit = raycaster.intersectObject(item.videoPlane);

        if (videoHit.length > 0 && !item.video.paused) {

            item.video.pause();

            if (item.hideTimer) clearTimeout(item.hideTimer);

            item.button.visible = true;
            item.button.material.map = item.playTexture;
            item.button.material.needsUpdate = true;
        }

    });

}

window.addEventListener("pointerdown", handleInteraction);

// Start AR
await mindarThree.start();

renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();

    mixers.forEach((mixer) => {
        mixer.update(delta);
    });

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
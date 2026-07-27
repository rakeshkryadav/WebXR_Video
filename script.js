import * as THREE from "three";
import { MindARThree } from "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

console.log("test 14");

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

const messageText = "UPICON wishes you Happy 80th Independence Day";

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
        new THREE.PlaneGeometry(0.9, 0.8),
        new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            toneMapped: false
        })
    );

    videoPlane.position.set(0, 1.5, 0);

    // Model
    loader.load("model.glb", (gltf) => {

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

    // Text
    function createTextTexture(text) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        const fontSize = 100;
        const paddingX = 50;
        const paddingY = 25;
        const radius = 20;

        context.font = `${fontSize}px Arial`;

        // Measure text
        const textWidth = context.measureText(text).width;

        // Resize canvas according to text
        canvas.width = Math.ceil(textWidth + paddingX * 2);
        canvas.height = fontSize + paddingY * 2;

        // Need to set font again after resizing
        context.font = `${fontSize}px Arial`;

        // Background
        context.fillStyle = "rgba(0,0,0,0.9)";
        context.beginPath();
        context.roundRect(
            0,
            0,
            canvas.width,
            canvas.height,
            radius
        );
        context.fill();

        // Text
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(
            text,
            canvas.width / 2,
            canvas.height / 2
        );

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        return {
            texture,
            aspect: canvas.width / canvas.height
        };
    }

    // Create text texture
    const textData = createTextTexture(messageText);

    const textMesh = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: textData.texture,
            transparent: true
        })
    );

    // Height of the sprite in world units
    const height = 0.15;

    // Width is automatically adjusted
    textMesh.scale.set(height * textData.aspect, height, 1);

    textMesh.position.set(0, -0.52, 0.01);


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
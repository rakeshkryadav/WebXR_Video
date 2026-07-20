import * as THREE from "three";
import { MindARThree } from "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const mindarThree = new MindARThree({
    container: document.body,
    imageTargetSrc: "cards.mind",
    filterMinCF: 0.001,         // default: 0.001   (decrease the value to make it less jittery)
    filterBeta: 0,             // default: 1000    (increase the value to reduce the delay)
    warmupTolerance: 5,          // default: 5
    missTolerance: 0,           // default: 5
});

const { renderer, scene, camera } = mindarThree;

scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

const loader = new GLTFLoader();
const clock = new THREE.Clock();

const mixers = [];
const billboards = [];

const textFiles = [
    "vaaText.glb",
    "ufsText.glb",
    "upiconText.glb"
];

// Create an anchor for each image target
for (let i = 0; i < 3; i++) {

    const anchor = mindarThree.addAnchor(i);

    const billboard = new THREE.Group();
    anchor.group.add(billboard);
    billboards.push(billboard);

    // Load the model
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

    // Load the same text
    loader.load(textFiles[i], (gltf) => {

        gltf.scene.scale.set(0.6, 0.6, 0.6);
        gltf.scene.position.set(0, -0.5, 0);

        billboard.add(gltf.scene);

    });
}

await mindarThree.start();

document.addEventListener("visibilitychange", async () => {
    if (document.hidden) {
        try {
            await mindarThree.stop();
        } catch (e) {}
    } else {
        try {
            await mindarThree.start();
        } catch (e) {}
    }
});

renderer.setAnimationLoop(() => {

    const delta = clock.getDelta();

    mixers.forEach((mixer) => mixer.update(delta));

    billboards.forEach((billboard) => {
        billboard.lookAt(camera.position);
    });

    renderer.render(scene, camera);

});

// Share Button
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
                text: "Check out AR Experience!\nhttps://rakeshkryadav.github.io/WebXR_Project"
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
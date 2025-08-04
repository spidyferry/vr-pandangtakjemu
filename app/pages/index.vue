<script setup lang="ts">
import * as THREE from 'three';
import { LDrawConditionalLineMaterial, RGBELoader } from 'three/examples/jsm/Addons.js';
import { Text } from 'troika-three-text';
import { TeleportHelper } from '~/composables/helpers/TeleportHelper';
import { CarouselHelper, InputField, Keyboard, LoadingHelper, Register, Template } from '~/composables/index';
import type { BoundingBox } from '~/composables/types/BoundingBox.type';
import type { ClickableMesh } from '~/composables/types/ClickableMesh.type';
import type { Rating } from '~/composables/types/Rating.type';

const container = ref<HTMLDivElement>();
const canvas = ref<HTMLCanvasElement>();
const loadingContainer = ref<HTMLDivElement>();
const progress = ref<HTMLDivElement>();
const loadingText = ref<HTMLDivElement>();

let template: InstanceType<typeof Template.VR> | null = null;
let register: Register;
let WorldPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
let CardSpacing: number = .6;
let carousel: CarouselHelper;
let keyboard: Keyboard;
let usernameField: InputField;
let passwordField: InputField
let loginForm: THREE.Group;
let loadingHelper: LoadingHelper | null = null;

onMounted(async () => {
    if (!container.value) return;

    template = new Template.VR(container.value);
    template.Renderer.setAnimationLoop(animate);
    register = new Register();
    const backsound = template.setAudio('/sounds/sounds-effect-nature.mp3');

    template.Renderer.xr.addEventListener('sessionstart', () => {
        backsound.play();
    })

    if (loadingContainer.value && progress.value && loadingText.value && loadingContainer.value) {
        loadingHelper = new LoadingHelper(
            {
                loadingContainer: loadingContainer.value,
                loadingManager: template.LoadingManager,
                progressHtml: progress.value,
                textHtml: loadingText.value
            }
        );
    }

    getActiveCamera()?.getWorldPosition(WorldPosition);
    await HandleTeleports();
});


const getActiveCamera = () => {
    const cam = template?.Renderer.xr.getCamera();
    if (!cam) return;
    return cam.isArrayCamera ? cam.cameras[0] : cam;
}

const HandleTeleports = async () => {
    if (!template?.Renderer) return;

    const teleport = await TeleportHelper.create({
        type: 'point',
        renderer: template.Renderer,
        loadingManager: template?.LoadingManager,
        pointData: {
            env: [
                '/hdr/1.jpg',
                '/hdr/2.jpg',
                '/hdr/3.jpg',
                '/hdr/4.jpg',
                '/hdr/5.jpg',
                '/hdr/6.jpg'
            ],
            config: [
                {
                    points: [
                        new THREE.Vector3(3, 0, 0),
                    ], // 3, 0, 0
                    target: [1],
                    rotation: [
                        new THREE.Vector3(0, -90, 0),
                    ]// -90
                },
                {
                    points: [
                        new THREE.Vector3(-2, 0, -1.2), //mundur 
                        new THREE.Vector3(2, 0, 1.2) // maju
                    ],
                    target: [0, 2],
                    rotation: [
                        new THREE.Vector3(0, 60, 0),
                        new THREE.Vector3(0, -120, 0)
                    ]
                },
                {
                    points: [
                        new THREE.Vector3(.5, 0, -1.5), // kiri
                        new THREE.Vector3(-1.5, 0, 2.25), //tengah
                        new THREE.Vector3(1, 0, 3), // kanan
                        new THREE.Vector3(2, 0, -4) // mundur
                    ],
                    target: [3, 5, 4, 1],
                    rotation: [
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(0, 90, 0),
                        new THREE.Vector3(0, 180, 0),
                        new THREE.Vector3(0, -45, 0)
                    ]
                },
                {
                    points: [new THREE.Vector3(-.5, 0, 3)],
                    target: [2],
                    rotation: [new THREE.Vector3(0, 180, 0)]
                },
                {
                    points: [new THREE.Vector3(-2.5, 0, 1.5)],
                    target: [2],
                    rotation: [new THREE.Vector3(0, 60, 0)]
                },
                {
                    points: [new THREE.Vector3(-2.5, 0, -2)],
                    target: [2],
                    rotation: [new THREE.Vector3(0, 50, 0)]
                },
            ]
        }
    });

    teleport.groups.forEach(group => {
        template?.Scene.add(group);
    });

    const env = teleport.hdrTextures[0];
    if (env && template?.Scene) {
        template.Scene.environment = env;
        template.Scene.background = env;
    }

    register.addFeatures({
        requiredFeatures: ['teleport-point'],
        data: {
            controllers: template?.Controllers,
            renderer: template?.Renderer,
            domElement: container.value,
            teleportPoint: {
                groups: teleport.groups,
                scene: template!.Scene,
                camera: template.Camera,
            }
        }
    });
}


const animate = () => {
    if (register) {
        const delta = template?.Clock?.getDelta() ?? 0;
        const elapsed = template?.Clock?.elapsedTime ?? 0;
        register.update(delta, elapsed);
    }

    if (template?.orbitControls) template.orbitControls.update()
    template?.render();
}
</script>

<template>
    <div>
        <div ref="loadingContainer" class="loading-overlay">
            <div class="loading-content">
                <div class="spinner"></div>
                <p ref="loadingText"></p>
                <div class="progress-bar">
                    <div ref="progress" class="progress"></div>
                </div>
            </div>
        </div>

        <div ref="container" style="width: 100%; height: 100%;">
        </div>
    </div>
</template>

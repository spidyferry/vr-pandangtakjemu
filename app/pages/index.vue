<script setup lang="ts">
import * as THREE from 'three';
import { TeleportHelper } from '~/composables/helpers/TeleportHelper';
import { LoadingHelper, Register, Template } from '~/composables/index';


const container = ref<HTMLDivElement>();
const loadingContainer = ref<HTMLDivElement>();
const progress = ref<HTMLDivElement>();
const loadingText = ref<HTMLDivElement>();

const showAudioPrompt = ref<boolean>(true);
const showAudioPopup = ref<boolean>(true);
let backsound: THREE.Audio | null = null;
let introSound: THREE.Audio | null = null;


let template: InstanceType<typeof Template.VR> | null = null;
let register: Register;
let WorldPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

onMounted(async () => {
    if (!container.value) return;

    template = new Template.VR(container.value);
    container.value.appendChild(template?.Renderer.domElement);
    template.orbitControls.target.set(3, 1.2, 0);

    template.Renderer.setAnimationLoop(animate);
    register = new Register();

    if (loadingContainer.value && progress.value && loadingText.value && loadingContainer.value) {
        new LoadingHelper(
            {
                loadingContainer: loadingContainer.value,
                loadingManager: template.LoadingManager,
                progressHtml: progress.value,
                textHtml: loadingText.value,
                template: template
            }
        );
    }

    getActiveCamera()?.getWorldPosition(WorldPosition);
    await HandleTeleports();

    backsound = template.setAudio('/sounds/sounds-effect-nature.mp3', true);
    introSound = template.setAudio('/sounds/intro.mp3', false);


    if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
                showAudioPrompt.value = false;
                template?.Renderer.xr.addEventListener('sessionstart', () => {
                    if (!backsound?.isPlaying) {
                        backsound?.play();
                        introSound?.play();
                    }
                })
            } else {
                showAudioPrompt.value = true;
            }
        }).catch(() => {
            showAudioPrompt.value = true;
        });
    } else {
        showAudioPrompt.value = true;
    }
});

const handleAudioConsent = async (consent: boolean) => {
    showAudioPrompt.value = false;

    if (consent && template) {
        try {
            backsound?.play();
            introSound?.play();
        } catch (err) {
            console.warn("Gagal memutar audio:", err);
        }
    }
};


const getActiveCamera = () => {
    const cam = template?.Renderer.xr.getCamera();
    if (!cam) return;
    return cam.isArrayCamera ? cam.cameras[0] : cam;
}

const HandleTeleports = async () => {
    if (!template?.Renderer) return;

    const teleport = await TeleportHelper.create({
        type: 'point',
        template: template,
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
                        new THREE.Vector3(3, 1.2, 0),
                    ], // 3, 0, 0
                    target: [1],
                    rotation: [
                        new THREE.Vector3(0, -90, 0),
                    ],// -90
                    tts: [
                        '/sounds/Lorong Tracking.mp3'

                    ],
                    name: [
                        'Lorong Tracking'
                    ]
                },
                {
                    points: [
                        new THREE.Vector3(-2, 1.2, -1.2), //mundur 
                        new THREE.Vector3(2, 1.2, 1.2) // maju
                    ],
                    target: [0, 2],
                    rotation: [
                        new THREE.Vector3(0, 60, 0),
                        new THREE.Vector3(0, -120, 0)
                    ],
                    tts: [
                        '/sounds/Gerbang Tracking.mp3',
                        '/sounds/Lapangan Mangrove.mp3'
                    ],
                    name: [
                        'Gerbang Area Tracking',
                        'Lapangan Mangrove'
                    ]
                },
                {
                    points: [
                        new THREE.Vector3(.5, 1.2, -1.5), // kiri
                        new THREE.Vector3(-1.5, 1.2, 2.25), //tengah
                        new THREE.Vector3(1, 1.2, 3), // kanan
                        new THREE.Vector3(2, 1.2, -4) // mundur
                    ],
                    target: [3, 5, 4, 1],
                    rotation: [
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(0, 90, 0),
                        new THREE.Vector3(0, 180, 0),
                        new THREE.Vector3(0, -45, 0)
                    ],
                    tts: [
                        '/sounds/Pojok Literasi.mp3',
                        '/sounds/Lorong Cinta.mp3',
                        '/sounds/View Negara Jiran.mp3',
                        '/sounds/Lorong Tracking.mp3',
                    ], name: [
                        'Pojok Literasi',
                        'Lorong Cinta',
                        'View Negara Jiran',
                        'Lorong Tracking'
                    ]
                },
                {
                    points: [new THREE.Vector3(-.5, 1.2, 3)],
                    target: [2],
                    rotation: [new THREE.Vector3(0, 180, 0)],
                    tts: [
                        '/sounds/Lapangan Mangrove.mp3',
                    ], name: [
                        'Lapangan Mangrove'
                    ]
                },
                {
                    points: [new THREE.Vector3(-2.5, 1.2, 1.5)],
                    target: [2],
                    rotation: [new THREE.Vector3(0, 60, 0)],
                    tts: [
                       '/sounds/Lapangan Mangrove.mp3',
                    ], name: [
                        'Lapangan Mangrove'
                    ]
                },
                {
                    points: [new THREE.Vector3(-2.5, 1.2, -2)],
                    target: [2],
                    rotation: [new THREE.Vector3(0, 50, 0)],
                    tts: [
                        '/sounds/Lapangan Mangrove.mp3',
                    ], name: [
                        'Lapangan Mangrove'
                    ]
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

    await register.addFeatures({
        requiredFeatures: ['teleport-point'],
        data: {
            controllers: template?.Controllers,
            renderer: template?.Renderer,
            domElement: container.value,
            teleportPoint: {
                groups: teleport.groups,
                scene: template!.Scene,
                camera: template.Camera,
                orbitControls: template?.orbitControls
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

    if (template?.orbitControls) {
        template.orbitControls.update()
    }
    template?.Renderer.render(template?.Scene, template?.Camera);
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

        <!-- Popup untuk enable audio -->
        <div v-if="showAudioPrompt" class="audio-popup">
            <div class="audio-popup-content">
                <p>Aktifkan suara?</p>
                <div class="buttons">
                    <button @click="handleAudioConsent(true)">Ya</button>
                    <button @click="handleAudioConsent(false)">Tidak</button>
                </div>
            </div>
        </div>


        <div ref="container" style="width: 100%; height: 100%;">
        </div>
    </div>
</template>

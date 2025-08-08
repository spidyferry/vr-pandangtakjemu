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
const showHowTo = ref<boolean>(false);
let backsound: THREE.Audio | null = null;
let introSound: THREE.Audio | null = null;


let template: InstanceType<typeof Template.VR> | null = null;
let register: Register;
let WorldPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

onMounted(async () => {
    if (!container.value) return;

    template = new Template.VR(container.value);
    // container.value.appendChild(template?.Renderer.domElement);
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
                showHowTo.value = false;
                template?.Renderer.xr.addEventListener('sessionstart', () => {
                    if (!backsound?.isPlaying) {
                        backsound?.play();
                        introSound?.play();
                    }
                })
            } else {
                showHowTo.value = true;
            }
        }).catch(() => {
            showHowTo.value = true;
        });
    } else {
        showHowTo.value = true;
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

        <!-- Popup untuk enable audio 
        <div v-if="showAudioPrompt" class="audio-popup">
            <div class="audio-popup-content">
                <p>Aktifkan suara?</p>
                <div class="buttons">
                    <button @click="handleAudioConsent(true)">Ya</button>
                    <button @click="handleAudioConsent(false)">Tidak</button>
                </div>
            </div>
        </div>-->

        <div v-if="showHowTo" class="howto-panel" role="region" aria-label="Panduan penggunaan WebVR">
            <h1 class="title">Cara Pakai WebVR di Oculus</h1>
            <ol class="steps">
                <li class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h2>Nyalakan Oculus 🔌</h2>
                        <p>Tekan tombol <strong>power</strong> di headset sampai layar menyala. Jika minta PIN, masukkan
                            PIN yang biasa dipakai.</p>
                    </div>
                </li>

                <li class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h2>Pastikan Baterai Cukup 🔋</h2>
                        <p>Jika ikon baterai merah, colok charger dulu. Tunggu sedikit sampai indikator baterai tidak
                            merah lagi (±30 menit kalau kosong).</p>
                    </div>
                </li>

                <li class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h2>Hubungkan ke Wi-Fi 🌐</h2>
                        <p>Gunakan controller → buka <em>Settings</em> → pilih <strong>Wi-Fi</strong> → pilih Wi-Fi
                            rumah → masukkan password.</p>
                    </div>
                </li>

                <li class="step">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h2>Buka Aplikasi Browser di Oculus 🌍</h2>
                        <p>Cari aplikasi <strong>Browser</strong> (ikon bola dunia). Buka, lalu ketik atau tempel alamat
                            website VR yang diberikan (contoh: <code>https://vr.pandangtakjemu.com</code>).</p>
                    </div>
                </li>

                <li class="step">
                    <div class="step-number">5</div>
                    <div class="step-content">
                        <h2>Tekan "Enter VR" di Halaman 👓</h2>
                        <p>Di halaman web cari tombol <strong>Enter VR</strong> atau ikon kacamata. Arahkan laser
                            controller ke tombol itu dan tekan trigger.</p>
                    </div>
                </li>

                <li class="step">
                    <div class="step-number">6</div>
                    <div class="step-content">
                        <h2>Menjelajah dengan Aman 🪑</h2>
                        <p>Duduk yang nyaman, pandang ke kiri/kanan/atas/bawah untuk melihat. Gerak kepala pelan-pelan
                            supaya tidak pusing.</p>
                    </div>
                </li>

                <li class="step">
                    <div class="step-number">7</div>
                    <div class="step-content">
                        <h2>Keluar dari Mode VR ↩️</h2>
                        <p>Tekan tombol <strong>Oculus/Menu</strong> pada controller kanan lalu pilih <strong>Exit
                                VR</strong> atau tombol kembali.</p>
                    </div>
                </li>
            </ol>

            <div class="tips">
                <h3>Tips Singkat</h3>
                <ul>
                    <li>Kalau pusing, lepaskan headset, tarik napas, istirahat 5 menit.</li>
                    <li>Kalau gambar buram, sesuaikan posisi headset di kepala sampai jelas.</li>
                    <li>Minta bantuan orang terdekat kalau kesulitan—jangan ragu minta tolong 😉</li>
                </ul>
            </div>

            <p class="note">Catatan: langkah di atas umum untuk WebVR. Jika halaman butuh izin akses kamera / motion,
                pilih <em>Allow</em> jika muncul pop-up.</p>
        </div>

        <div ref="container" style="width: 100%; height: 100%;">
        </div>
    </div>
</template>

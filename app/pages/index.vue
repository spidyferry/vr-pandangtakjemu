<script setup lang="ts">
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { Text } from 'troika-three-text';
import { TeleportHelper } from '~/composables/helpers/TeleportHelper';
import { CarouselHelper, InputField, Keyboard, Register, Template } from '~/composables/index';
import type { BoundingBox } from '~/composables/types/BoundingBox.type';
import type { ClickableMesh } from '~/composables/types/ClickableMesh.type';
import type { Rating } from '~/composables/types/Rating.type';

const container = ref<HTMLDivElement>();
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




onMounted(() => {
    if (!container.value) return;

    template = new Template.VR(container.value);
    template.Renderer.setAnimationLoop(animate);

    register = new Register();

    if (loadingContainer.value && progress.value && loadingText.value) {
        const loadingHelper = new LoadingHelper(
            {
                loadingManager: template.LoadingManager,
                loadingContainer: loadingContainer.value,
                progressHtml: progress.value,
                textHtml: loadingText.value,
            }
        );
    }


    template.Camera.getWorldPosition(WorldPosition);
    HandleTeleports();
    HandleWorkers();
    HandleKeyboard();
});

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
                    points: [new THREE.Vector3(3, 0, 0)],
                    target: [1]
                },
                {
                    points: [
                        new THREE.Vector3(-1.5, 0, -.8),
                        new THREE.Vector3(2, 0, 1.2)
                    ],
                    target: [0, 2]
                },
                {
                    points: [
                        new THREE.Vector3(.5, 0, -1.5),
                        new THREE.Vector3(-1.5, 0, 2.25),
                        new THREE.Vector3(1, 0, 3)
                    ],
                    target: [3, 5, 4]
                },
                {
                    points: [],
                    target: []
                },
                {
                    points: [],
                    target: []
                },
                {
                    points: [],
                    target: []
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
            teleportPoint: {
                groups: teleport.groups,
                scene: template!.Scene
            }
        }
    })
}

const HandleKeyboard = () => {
    loginForm = new THREE.Group();

    keyboard = new L3.Keyboard();
    loginForm.add(keyboard);

    usernameField = new L3.InputField({ label: 'Username' });
    usernameField.position.set(0, 0.25, -0.025);
    loginForm.add(usernameField);

    passwordField = new L3.InputField({ label: 'Password' });
    passwordField.position.set(0, 0.25 / 2, -0.025);
    loginForm.add(passwordField);

    template?.Scene.add(loginForm);

    register.addFeatures({
        requiredFeatures: ['keyboard'],
        data: {
            controllers: template?.Controllers,
            renderer: template?.Renderer,
            keyboard: {
                mesh: keyboard,
                inputField: [usernameField, passwordField]
            }
        }
    })
}

const Workers = () => {
    const post = (url: string, payload: Record<string, any>) => {
        template?.LoadingManager?.itemStart(url);
        return new Promise((resolve, reject) => {
            const worker = new Worker(new URL('../composables/workers/Post.Worker.ts', import.meta.url), { type: 'module' });


            worker.onmessage = (e) => {
                if (e.data.success) {
                    template?.LoadingManager?.itemEnd(url);
                    resolve(e.data.data);
                } else {
                    template?.LoadingManager?.itemError(url);
                    reject(new Error(e.data.error));
                }
            };

            worker.onerror = (e) => {
                template?.LoadingManager?.itemError(url);
                reject(new Error(`Worker error: ${e.message}`));
            };

            worker.postMessage({ url, payload });
        });
    };

    const get = (url: string, payload: Record<string, any>) => {
        template?.LoadingManager?.itemStart(url);
        return new Promise((resolve, reject) => {
            const worker = new Worker(new URL('../composables/workers/Get.Worker.ts', import.meta.url), { type: 'module' });

            worker.onmessage = (e) => {
                if (e.data.success) {
                    template?.LoadingManager?.itemEnd(url);
                    resolve(e.data.data);
                } else {
                    template?.LoadingManager?.itemError(url);
                    reject(new Error(e.data.error));
                }
            };

            worker.onerror = (e) => {
                template?.LoadingManager?.itemError(url);
                reject(new Error(`Worker error: ${e.message}`));
            };

            worker.postMessage({ url, payload });
        });
    };


    return { get, post }
}

const HandleWorkers = async () => {
    const payload = {
        jsonrpc: "2.0",
        params: {},
    };

    const worker = Workers();
    // https://market.pandangtakjemu.com/jellyfish/get/product/http
    const data = await worker.get('https://fakestoreapi.com/products', payload);

    HandleContent(data);

}

const HandleContent = async (data: any) => {
    carousel = new CarouselHelper({ title: 'Pandang Tak Jemu Shop', debugClipping: false });
    carousel.position.set(WorldPosition.x, WorldPosition.y, -.5);
    //template?.Scene.add(carousel);

    const length = data.length;
    const lastIndex = data.length - 1;
    const lastCardX = lastIndex * CardSpacing;
    const scrollableWidth = Math.max(0, lastCardX);
    const minScroll = 0;
    const maxScroll = scrollableWidth;

    const width = .5;
    const height = .25;

    carousel.SetScroll(minScroll, maxScroll);

    for (let i = 0; i < length; i++) {
        const item = data[i];

        if (!item.quantity) item.quantity = 1;
        if (!item.rating) {
            item.rating = {
                rate: 4.9,
                count: 120
            };
        }


        const card = handleCard(width, height);
        card.userData.itemId = item.id;
        card.position.set(i * CardSpacing, 0, 0.001);

        card.geometry.computeBoundingBox();
        const rawBoundingBox = card.geometry.boundingBox;
        if (!rawBoundingBox) return;

        const image = await handleImage(item.image ?? item.link_image, width, height);
        image.position.set(rawBoundingBox.max.x * 0.7, 0, 0.001);
        card.add(image);

        const title = handleTitle(item.name ?? item.title, rawBoundingBox, width);
        card.add(title);

        const buyButton = handleButtonBuy(width, height);
        buyButton.userData.itemId = item.id;
        buyButton.userData.item = item;
        buyButton.position.set(0, rawBoundingBox.min.y * 0.8, 0.001);
        card.add(buyButton);

        const price = handlePrice(item.price, rawBoundingBox);
        card.add(price);

        const rate = handleRate(item.rating, rawBoundingBox);
        card.add(rate);

        const count = handleCount(item, rawBoundingBox);
        card.add(count);

        carousel.children.forEach(child => {
            if (child instanceof THREE.Group && child.isGroup) {
                child.add(card)
            }
        })
    }
    register.addFeatures({ requiredFeatures: ['carousel'], data: { carousel: { mesh: carousel }, controllers: template?.Controllers, renderer: template?.Renderer } })
}

const handleCard = (width: number, height: number) => {

    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        clipShadows: true,
        alphaToCoverage: true,
        clippingPlanes: carousel.clippingPlanes
    })
    const card = new THREE.Mesh(geometry, material);

    return card;
}

const handleImage = async (image: string, width: number, height: number) => {
    const loader = new THREE.TextureLoader(template?.LoadingManager);
    const texture = await loader.loadAsync(image);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.needsUpdate = true;

    const aspect = texture.image.width / texture.image.height;
    const imageWidth = height * aspect;
    const geometry = new THREE.PlaneGeometry(imageWidth, height);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        clipShadows: true,
        alphaToCoverage: true,
        clippingPlanes: carousel.clippingPlanes
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'image';
    imageWidth > 0.3 ? mesh.scale.set(0.3, 0.3, 0.3) : mesh.scale.set(0.5, 0.5, 0.5);

    return mesh;
}

const handleTitle = (title: string, boundingBox: BoundingBox, width: number) => {
    const content = new Text();
    content.material.side = THREE.FrontSide;
    content.fontSize = 0.015;
    content.fontStyle = 'normal';
    content.textAlign = 'center';
    content.overflowWrap = 'break-word';
    content.whiteSpace = 'normal';
    content.anchorX = 'center';
    content.anchorY = 'top';
    content.direction = 'ltr';
    content.maxWidth = width * 0.9;
    content.color = 0x000000;
    content.text = title;
    content.position.set(0, boundingBox.max.y * 0.95, 0.001);
    content.name = `title ${title}`;
    content.material.clippingPlanes = carousel.clippingPlanes;
    content.sync();

    return content;
}

const handleButtonBuy = (width: number, height: number) => {
    const geometry = new THREE.PlaneGeometry(width / 4, height / 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0x228B22,
        clipShadows: true,
        alphaToCoverage: true,
        clippingPlanes: carousel.clippingPlanes
    })
    const buttonMesh = new THREE.Mesh(geometry, material) as ClickableMesh;
    buttonMesh.name = `button buy`;

    const text = new Text();
    text.material.side = THREE.FrontSide;
    text.fontSize = 0.015;
    text.fontStyle = 'normal';
    text.textAlign = 'center';
    text.overflowWrap = 'break-word';
    text.whiteSpace = 'normal';
    text.anchorX = 'center';
    text.anchorY = 'middle';
    text.direction = 'ltr';
    text.maxWidth = (width / 4) * 0.9;
    text.color = 0xffffff;
    text.text = 'ADD TO CART';
    text.position.set(0, 0, 0.001);
    text.material.clippingPlanes = carousel.clippingPlanes;
    text.sync();

    buttonMesh.add(text);

    buttonMesh.onClick = () => {
        return buttonMesh.userData?.item;
    }

    return buttonMesh;
}

const handlePrice = (price: number, boundingBox: BoundingBox) => {
    const content = new Text();
    content.name = 'price'
    content.material.side = THREE.FrontSide;
    content.fontSize = 0.012;
    content.fontStyle = 'normal';
    content.textAlign = 'center';
    content.overflowWrap = 'break-word';
    content.whiteSpace = 'normal';
    content.anchorX = 'left';
    content.anchorY = 'top';
    content.direction = 'ltr';
    content.maxWidth = 0.9;
    content.color = 0x333333;
    content.text = `Price :\n $${price}`;
    content.material.clipShadows = true;
    content.material.alphaToCoverage = true;
    content.position.set(boundingBox.min.x * .9, 0, 0.001);
    content.material.clippingPlanes = carousel.clippingPlanes;
    content.sync();
    return content;
}


const handleRate = (rating: Rating, boundingBox: BoundingBox) => {
    const rate = Math.min(Math.max(rating.rate, 0), 5);
    const count = rating.count;

    const stars = [];
    for (let i = 0; i < 5; i++) {
        if (i < Math.floor(rate)) {
            stars.push({ symbol: '★', type: 'full' });
        } else if (i < rate) {
            stars.push({ symbol: '⯨', type: 'half' });
        } else {
            stars.push({ symbol: '☆', type: 'empty' });
        }
    }

    const starsString = stars.map(s => s.symbol).join('');
    const content = new Text();
    content.name = 'rate';
    content.text = `Rate : \n${starsString} (${count})`;
    content.fontSize = 0.012;
    content.color = 0x333333;
    content.fontStyle = 'normal';
    content.textAlign = 'center';
    content.overflowWrap = 'break-word';
    content.whiteSpace = 'normal';
    content.anchorX = 'left';
    content.anchorY = 'top';
    content.direction = 'ltr';
    content.material.clipShadows = true;
    content.material.alphaToCoverage = true;
    content.position.set(boundingBox.min.x * .65, 0, 0.001);
    content.material.clippingPlanes = carousel.clippingPlanes;
    content.sync();
    return content;
}

const handleCount = (data: any, boundingBox: BoundingBox) => {

    const group = new THREE.Group();
    group.position.x = .04;

    const Quantity = new Text();
    Quantity.name = 'quantity';
    Quantity.material.side = THREE.FrontSide;
    Quantity.fontSize = 0.012;
    Quantity.fontStyle = 'normal';
    Quantity.textAlign = 'center';
    Quantity.overflowWrap = 'break-word';
    Quantity.whiteSpace = 'normal';
    Quantity.anchorX = 'left';
    Quantity.anchorY = 'top';
    Quantity.direction = 'ltr';
    Quantity.color = 0x333333;
    Quantity.text = 'Quantity : \n 1';
    Quantity.position.set(boundingBox.min.x * .3, 0, 0.001);
    Quantity.material.clippingPlanes = carousel.clippingPlanes;
    group.add(Quantity);

    Quantity.sync();
    const minusMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.012, 0.012),
        new THREE.MeshBasicMaterial({
            color: 0x228B22,
            clipShadows: true,
            alphaToCoverage: true,
            clippingPlanes: carousel.clippingPlanes
        })
    ) as ClickableMesh;

    const minusText = new Text();
    minusText.material.side = THREE.FrontSide;
    minusText.fontSize = 0.012;
    minusText.fontStyle = 'normal';
    minusText.textAlign = 'center';
    minusText.overflowWrap = 'break-word';
    minusText.whiteSpace = 'normal';
    minusText.anchorX = 'center';
    minusText.anchorY = 'middle';
    minusText.direction = 'ltr';
    minusText.maxWidth = 0.012 * 0.9;
    minusText.color = 0xffffff;
    minusText.text = '-';
    minusText.position.set(0, 0.0015, 0.001);
    minusText.material.clippingPlanes = carousel.clippingPlanes;
    minusMesh.position.set(boundingBox.min.x * .3, -0.024, 0.001);
    minusMesh.add(minusText);
    group.add(minusMesh);
    minusText.sync();

    const plusMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.012, 0.012),
        new THREE.MeshBasicMaterial({
            color: 0x228B22,
            clipShadows: true,
            alphaToCoverage: true,
            clippingPlanes: carousel.clippingPlanes
        })
    ) as ClickableMesh;

    const plusText = new Text();
    plusText.material.side = THREE.FrontSide;
    plusText.fontSize = 0.012;
    plusText.fontStyle = 'normal';
    plusText.textAlign = 'center';
    plusText.overflowWrap = 'break-word';
    plusText.whiteSpace = 'normal';
    plusText.anchorX = 'center';
    plusText.anchorY = 'middle';
    plusText.direction = 'ltr';
    plusText.maxWidth = 0.012 * 0.9;
    plusText.color = 0xffffff;
    plusText.text = '+';
    plusText.material.clippingPlanes = carousel.clippingPlanes;
    plusText.position.set(0, 0.0015, 0.001);
    plusMesh.position.set(-.015, -0.024, 0.001);

    plusMesh.add(plusText);
    group.add(plusMesh);
    plusText.sync();

    minusMesh.name = 'button decrement';
    plusMesh.name = 'button increment';
    minusMesh.userData.type = 'decrement';
    plusMesh.userData.type = 'increment';
    plusMesh.userData.itemId = data.id;
    minusMesh.userData.itemId = data.id;


    minusMesh.onClick = () => {
        let price: any;
        let buttonBuy: any;

        carousel.children.forEach(child => {
            if (child instanceof THREE.Group && child.isGroup) {
                child.children.forEach(grandChild => {
                    if (grandChild.userData.itemId === plusMesh.userData.itemId) {
                        price = grandChild.getObjectByName('price');
                        buttonBuy = grandChild.getObjectByName('button buy');
                    }
                })

            }
        })


        const item = data.find((val: { id: any; }) => val.id === plusMesh.userData.itemId);
        item.quantity = Math.max(1, item.quantity - 1);
        item.totalPrice = (item.quantity * item.price);

        Quantity.text = `Quantity : \n ${item.quantity}`;
        Quantity.sync();

        if (!price) return;

        price.text = `Price :\n $${item.totalPrice.toFixed(2)}`;
        price.sync();

        buttonBuy.userData.item = item;
    }


    plusMesh.onClick = () => {
        let price: any;
        let buttonBuy: any;

        carousel.children.forEach(child => {
            if (child instanceof THREE.Group && child.isGroup) {
                child.children.forEach(grandChild => {
                    if (grandChild.userData.itemId === plusMesh.userData.itemId) {
                        price = grandChild.getObjectByName('price');
                        buttonBuy = grandChild.getObjectByName('button buy');
                    }
                })

            }
        })

        const item = data.find((val: { id: any; }) => val.id === plusMesh.userData.itemId);

        item.quantity = Math.max(1, item.quantity + 1);
        item.totalPrice = (item.quantity * item.price);

        Quantity.text = `Quantity : \n ${item.quantity}`;
        Quantity.sync();

        price.text = `Price :\n $${item.totalPrice.toFixed(2)}`;
        price.sync();

        buttonBuy.userData.item = item;

    }

    return group;
}


const animate = () => {
    if (register) {
        const delta = template?.Clock?.getDelta() ?? 0;
        const elapsed = template?.Clock?.elapsedTime ?? 0;
        register.update(delta, elapsed);
    }

    if (template?.Camera) {
        if (carousel) carousel.update(template.Camera);

        if (loginForm) {
            template.Camera.getWorldPosition(WorldPosition);
            const offset = new THREE.Vector3(0, -0.125, -0.5);
            offset.applyQuaternion(template.Camera.quaternion);
            const targetPosition = WorldPosition.clone().add(offset);
            loginForm.position.lerp(targetPosition, 0.1);
            const targetQuaternion = template.Camera.quaternion.clone();
            loginForm.quaternion.slerp(targetQuaternion, 0.1);
        }
    }

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

        <div ref="container"></div>
    </div>
</template>

<style scoped>
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(15, 15, 15, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
}

.loading-content {
    text-align: center;
    color: #ffffff;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 300px;
    width: 80%;
    padding: 2rem;
    background: rgba(30, 30, 30, 0.9);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.spinner {
    width: 48px;
    height: 48px;
    margin: 0 auto 1rem;
    border: 5px solid rgba(255, 255, 255, 0.2);
    border-top: 5px solid #4fc3f7;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.progress-bar {
    margin-top: 1rem;
    height: 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    overflow: hidden;
}

.progress {
    height: 100%;
    background: linear-gradient(to right, #4fc3f7, #81d4fa);
    transition: width 0.3s ease-in-out;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>

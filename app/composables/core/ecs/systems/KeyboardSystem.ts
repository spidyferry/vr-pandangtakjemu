import { type Attributes, System } from 'ecsy';
import { Object3DComponent } from '../components/Object3DComponent';
import { KeyboardComponent } from '../components/KeyboardComponent';
import { Keyboard } from '../../../helpers/Keyboard';
import { Camera, Mesh } from 'three';
import { CarouselComponent } from '../components/CarouselComponent';

export class KeyboardSystem extends System {
    private worker?: Worker;

    override init(attributes?: Attributes): void {
        this.worker = new Worker(
            new URL('../../../workers/Post.Worker.ts', import.meta.url),
            { type: 'module' }
        );
    }

    execute(delta: number, time: number): void {
        this.queries.keyboard?.results.forEach(entity => {
            const component = entity.getMutableComponent(KeyboardComponent);
            const object = entity.getComponent(Object3DComponent)?.object;

            switch (component?.state) {
                case 'pressed': {
                    if (!component.wasPressed) {
                        component.wasPressed = true;
                        if (object?.parent instanceof Keyboard) {

                            if (object.userData.label === 'enter') {

                                if (typeof object.userData.onClick === 'function') {
                                    const result = object.userData.onClick?.();

                                    if (result) {
                                        console.log(result);

                                        component.isLoggedIn = true;

                                        this.queries.carousel?.results.forEach(entity => {
                                            const component = entity.getMutableComponent(CarouselComponent);
                                            if (!component) return;
                                            component.isLoggedIn = true;
                                        });
                                    }

                                }

                                /*
                                const payload = {
                                    username: "admin",
                                    password: "123"
                                };

                                console.log('[KeyboardSystem] Sending payload to worker:', payload);

                                if (!this.worker) return;

                                this.worker.postMessage({
                                    url: 'https://market.pandangtakjemu.com/action/jellyfish/credential/user',
                                    payload,
                                });

                                this.worker.onmessage = (e) => {
                                    const { success, data, error } = e.data;
                                    if (success) {
                                        console.log('[KeyboardSystem] Worker response:', data);
                                    } else {
                                        console.error('[KeyboardSystem] Worker error:', error);
                                    }
                                };
                                */
                            } else {
                                object.parent.handleKeyPress(object.userData.label);
                            }

                        }
                    }
                    break;
                }

                case 'hover': {
                    if (object && object.scale.x !== 1.2) {
                        object.scale.set(1.2, 1.2, 1.2);
                    }
                    break;
                }

                case 'show': {
                    const parent = component.keyboard?.parent;
                    if (!parent) return;

                    if (!parent.visible) {
                        parent.visible = true;

                        parent.traverse(child => {
                            child.updateMatrixWorld(true);
                            if ((child as Mesh).isMesh) {
                                const mesh = child as Mesh;
                                mesh.geometry?.computeBoundingBox();
                                mesh.geometry?.computeBoundingSphere();
                            }
                        });
                    }

                    component.state = 'none';
                    break;
                }

                case 'hide': {
                    const parent = component.keyboard?.parent;
                    if (!parent) return;

                    parent.visible = false;

                    parent.traverse(child => {
                        child.updateMatrixWorld(true);
                        if ((child as Mesh).isMesh) {
                            const mesh = child as Mesh;
                            mesh.geometry?.computeBoundingBox();
                            mesh.geometry?.computeBoundingSphere();
                        }
                    });

                    component.state = 'none';
                    break;
                }


                default: {
                    if (object && object.scale.x !== 1) {
                        object.scale.set(1, 1, 1);
                    }
                }
            }
        });
    }

}

KeyboardSystem.queries = {
    keyboard: {
        components: [KeyboardComponent]
    },

    carousel: {
        components: [CarouselComponent]
    }
};

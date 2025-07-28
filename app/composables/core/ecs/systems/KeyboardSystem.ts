import { type Attributes, System } from 'ecsy';
import { Object3DComponent } from '../components/Object3DComponent';
import { KeyboardComponent } from '../components/KeyboardComponent';
import { Keyboard } from '../../../helpers/Keyboard';
import { Camera } from 'three';

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
                                    const result = object.userData.onClick?.(component.camera, 1, 2);

                                    if (result) {
                                        console.log(result);
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
                            }

                            object.parent.handleKeyPress(object.userData.label);
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
    }
};

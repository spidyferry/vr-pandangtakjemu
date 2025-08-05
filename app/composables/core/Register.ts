import { type Entity, World } from 'ecsy';
import {
    type ComponentConstructor,
    Component,
    type SystemConstructor,
    System
} from 'ecsy';
import * as THREE from 'three';
import { ControllerComponent } from './ecs/components/ControllerComponent';
import { ControllerSystem } from './ecs/systems/ControllerSystem';
import { Object3DComponent } from './ecs/components/Object3DComponent';
import { ButtonComponent } from './ecs/components/ButtonComponent';
import { ButtonSystem } from './ecs/systems/ButtonSystem';
import { Audio, Group, Mesh, Vector3, WebGLRenderer } from 'three';
import { DraggableReturnComponent } from './ecs/components/DraggableReturnComponent';
import { DraggableReturnSystem } from './ecs/systems/DraggableReturnSystem';
import { DraggableDefaultComponent } from './ecs/components/DraggableDefaultComponent';
import { DraggableDefaultSystem } from './ecs/systems/DraggableDefaultSystem';
import { MovementFPSComponent } from './ecs/components/MovementFPSComponent';
import { TeleportDefaultComponent } from './ecs/components/TeleportDefaultComponent';
import { TeleportDefaultSystem } from './ecs/systems/TeleportDefaultSystem';
import { KeyboardComponent } from './ecs/components/KeyboardComponent';
import { KeyboardSystem } from './ecs/systems/KeyboardSystem';
import { Keyboard } from '../helpers/Keyboard';
import { InputFieldComponent } from './ecs/components/InputFieldComponent';
import { InputField } from '../helpers/InputField';
import { InputFieldSystem } from './ecs/systems/InputFieldSystem';
import { CarouselComponent } from './ecs/components/CarouselComponent';
import type { CarouselHelper } from '#imports';
import { TeleportPointComponent } from './ecs/components/TeleportPointComponent';
import { TeleportPointSystem } from './ecs/systems/TeleportPointSystem';
import { MouseComponent } from './ecs/components/MouseComponent';
import { MouseSystem } from './ecs/systems/MouseSystem';
import type { OrbitControls } from 'three/examples/jsm/Addons.js';


/**
 * Supported feature flags.
 */
export type FeatureType =
    'button' |
    'keyboard' |
    'draggable-return' |
    'draggable-default' |
    'movement' |
    'teleport-default' |
    'teleport-point' |
    'carousel';


/**
 * Configuration object passed to Register.addFeatures().
 */
export interface DataOptions {
    requiredFeatures?: FeatureType[];
    data?: {
        controllers?: Group[];
        renderer?: WebGLRenderer;
        domElement?: HTMLElement;
        draggableReturn?: {
            mesh: Mesh;
            clickSound?: Audio;
            hoverSound?: Audio;
        };
        draggableDefault?: {
            mesh: Mesh;
            clickSound?: Audio;
            hoverSound?: Audio;
        };
        button?: {
            mesh: Mesh;
            clickSound?: Audio;
            hoverSound?: Audio;
            onClick: () => void;
        };
        movement?: {
            player: Group;
        },
        teleportDefault?: {
            floor: Mesh;
            point: Vector3;
            player: Group;
            marker: Mesh;
        },
        teleportPoint?: {
            groups: Group[];
            scene: THREE.Scene;
            camera: THREE.PerspectiveCamera,
            orbitControls: OrbitControls
        },
        keyboard?: {
            camera: THREE.Camera,
            mesh: Keyboard,
            inputField: InputField[],
            afterLoggedIn: any;
        },
        carousel?: {
            mesh: CarouselHelper
        }
    };
}

/**
 * ECS Register class for component/system initialization and feature-based entity setup.
 */
export class Register {
    public world: World;

    constructor() {
        this.world = new World();

        this._registerComponent(Object3DComponent);
        this._registerComponent(ControllerComponent);
        this._registerComponent(ButtonComponent);

        //this._registerComponent(MovementFPSComponent);
        //this._registerComponent(TeleportDefaultComponent);
        //this._registerComponent(KeyboardComponent);
        //this._registerComponent(InputFieldComponent);
        //this._registerComponent(CarouselComponent);
        this._registerComponent(TeleportPointComponent);
        this._registerComponent(MouseComponent);

        this._registerSystem(ControllerSystem);
        //this._registerSystem(ButtonSystem);
        //this._registerSystem(TeleportDefaultSystem);
        //this._registerSystem(KeyboardSystem);
        //this._registerSystem(InputFieldSystem);
        this._registerSystem(TeleportPointSystem);
        this._registerSystem(MouseSystem);
    }

    /**
     * Creates and returns a new ECS entity.
     */
    public createEntity() {
        return this.world.createEntity();
    }

    /**
     * Registers and configures features into ECS.
     */
    public addFeatures(options: DataOptions = {}): void {
        const { requiredFeatures = [], data } = options;

        for (const feature of requiredFeatures) {
            switch (feature) {
                case 'button': {
                    if (
                        !data?.renderer ||
                        !data.controllers ||
                        !data.button?.mesh ||
                        !data.button.clickSound ||
                        !data.button.hoverSound ||
                        !data.button.onClick
                    ) {
                        console.warn('[Register] Incomplete data provided for "button" feature.');
                        break;
                    }

                    const entity = this.createEntity();

                    entity.addComponent(ControllerComponent, {
                        controllers: data.controllers,
                        renderer: data.renderer,
                        world: this.world,
                    });

                    entity.addComponent(Object3DComponent, {
                        object: data.button.mesh,
                    });

                    entity.addComponent(ButtonComponent, {
                        clickSound: data.button.clickSound,
                        hoverSound: data.button.hoverSound,
                        onClick: data.button.onClick,
                    });

                    break;
                }

                case 'keyboard': {
                    options.data?.keyboard?.mesh.children.forEach(child => {
                        if (child instanceof THREE.Mesh && child.isMesh) {
                            const entity = this.createEntity();
                            entity.addComponent(ControllerComponent, {
                                controllers: data?.controllers,
                                renderer: data?.renderer,
                                world: this.world,
                            });
                            entity.addComponent(Object3DComponent, { object: child });

                            entity.addComponent(KeyboardComponent, { keyboard: options.data?.keyboard?.mesh, camera: options.data?.keyboard?.camera });
                            entity.addComponent(CarouselComponent, { carousel: options.data?.keyboard?.afterLoggedIn });
                        }
                    });


                    options.data?.keyboard?.inputField.forEach(input => {
                        const child = input.children[0];
                        if (child instanceof THREE.Mesh && child.isMesh) {
                            const entity = this.createEntity();
                            entity.addComponent(ControllerComponent, {
                                controllers: data?.controllers,
                                renderer: data?.renderer,
                                world: this.world,
                            });
                            entity.addComponent(Object3DComponent, { object: child });
                            entity.addComponent(InputFieldComponent);
                        }
                    })
                    break;
                }


                case 'draggable-return': {
                    this._registerComponent(DraggableReturnComponent);
                    this._registerSystem(DraggableReturnSystem);

                    const entity = this.createEntity();
                    entity.addComponent(ControllerComponent, {
                        controllers: data?.controllers,
                        renderer: data?.renderer,
                        world: this.world,
                    });
                    entity.addComponent(Object3DComponent, { object: data?.draggableReturn?.mesh });
                    entity.addComponent(DraggableReturnComponent);
                    break;
                }

                case 'draggable-default': {
                    this._registerComponent(DraggableDefaultComponent);
                    this._registerSystem(DraggableDefaultSystem);

                    const entity = this.createEntity();
                    entity.addComponent(ControllerComponent, {
                        controllers: data?.controllers,
                        renderer: data?.renderer,
                        world: this.world
                    });
                    entity.addComponent(Object3DComponent, { object: data?.draggableReturn?.mesh });
                    entity.addComponent(DraggableDefaultComponent);
                }

                case 'movement': {
                    const entity = this.createEntity();
                    entity.addComponent(ControllerComponent, {
                        controllers: data?.controllers,
                        renderer: data?.renderer,
                        world: this.world
                    });
                    entity.addComponent(MovementFPSComponent, { player: data?.movement?.player })
                    break;
                }

                case 'teleport-default': {
                    const entity = this.createEntity();
                    entity.addComponent(ControllerComponent, {
                        controllers: data?.controllers,
                        renderer: data?.renderer,
                        world: this.world
                    });

                    entity.addComponent(Object3DComponent, { object: data?.teleportDefault?.floor });
                    entity.addComponent(TeleportDefaultComponent, {
                        point: data?.teleportDefault?.point,
                        player: data?.teleportDefault?.player,
                        marker: data?.teleportDefault?.marker,
                    });
                    break;
                }

                case 'teleport-point': {
                    data?.teleportPoint?.groups.forEach(group => {
                        group.children.forEach(child => {
                            if (child instanceof THREE.Mesh && child.isMesh) {
                                const entity = this.createEntity();
                                entity.addComponent(ControllerComponent, {
                                    controllers: data?.controllers,
                                    renderer: data?.renderer,
                                    world: this.world
                                });
                                entity.addComponent(Object3DComponent, { object: child });
                                entity.addComponent(TeleportPointComponent, { groups: data?.teleportPoint?.groups, scene: data?.teleportPoint?.scene, orbitControls: data?.teleportPoint?.orbitControls, camera: data?.teleportPoint?.camera });
                            }
                        })
                    });
                    if (navigator.xr) {
                        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                            if (supported) {
                                data?.teleportPoint?.groups.forEach(group => {
                                    group.children.forEach(child => {
                                        if (child instanceof THREE.Mesh && child.isMesh) {
                                            const entity = this.createEntity();
                                            entity.addComponent(ControllerComponent, {
                                                controllers: data?.controllers,
                                                renderer: data?.renderer,
                                                world: this.world
                                            });
                                            entity.addComponent(Object3DComponent, { object: child });
                                            entity.addComponent(TeleportPointComponent, { groups: data?.teleportPoint?.groups, scene: data?.teleportPoint?.scene, orbitControls: data?.teleportPoint?.orbitControls, camera: data?.teleportPoint?.camera });
                                        }
                                    })
                                });
                            } else {
                                data?.teleportPoint?.groups.forEach(group => {
                                    group.children.forEach(child => {
                                        if (child instanceof THREE.Mesh && child.isMesh) {
                                            const entity = this.createEntity();
                                            entity.addComponent(MouseComponent, {
                                                camera: data?.teleportPoint?.camera,
                                                pointer: new THREE.Vector2(-9999, -9999),
                                                renderer: data?.renderer,
                                                domElement: data?.domElement
                                            })
                                            entity.addComponent(Object3DComponent, { object: child });
                                            entity.addComponent(TeleportPointComponent, { groups: data?.teleportPoint?.groups, scene: data?.teleportPoint?.scene, orbitControls: data?.teleportPoint?.orbitControls, camera: data?.teleportPoint?.camera });
                                        }
                                    })
                                });
                            }
                        }).catch(() => {
                            data?.teleportPoint?.groups.forEach(group => {
                                group.children.forEach(child => {
                                    if (child instanceof THREE.Mesh && child.isMesh) {
                                        const entity = this.createEntity();
                                        entity.addComponent(MouseComponent, {
                                            camera: data?.teleportPoint?.camera,
                                            pointer: new THREE.Vector2(-9999, -9999),
                                            renderer: data?.renderer,
                                            domElement: data?.domElement
                                        })
                                        entity.addComponent(Object3DComponent, { object: child });
                                        entity.addComponent(TeleportPointComponent, { groups: data?.teleportPoint?.groups, scene: data?.teleportPoint?.scene, orbitControls: data?.teleportPoint?.orbitControls, camera: data?.teleportPoint?.camera });
                                    }
                                })
                            });
                        });
                    } else {
                        data?.teleportPoint?.groups.forEach(group => {
                            group.children.forEach(child => {
                                if (child instanceof THREE.Mesh && child.isMesh) {
                                    const entity = this.createEntity();
                                    entity.addComponent(MouseComponent, {
                                        camera: data?.teleportPoint?.camera,
                                        pointer: new THREE.Vector2(-9999, -9999),
                                        renderer: data?.renderer,
                                        domElement: data?.domElement
                                    })
                                    entity.addComponent(Object3DComponent, { object: child });
                                    entity.addComponent(TeleportPointComponent, { groups: data?.teleportPoint?.groups, scene: data?.teleportPoint?.scene, orbitControls: data?.teleportPoint?.orbitControls, camera: data?.teleportPoint?.camera });
                                }
                            })
                        });
                    }


                    break;
                }

                case 'carousel': {
                    const entity = this.createEntity();
                    entity.addComponent(ControllerComponent, {
                        controllers: data?.controllers,
                        renderer: data?.renderer,
                        world: this.world
                    });
                    entity.addComponent(Object3DComponent, { object: data?.carousel?.mesh });
                    entity.addComponent(CarouselComponent, { carousel: data?.carousel?.mesh });
                    break;
                }

                default: {
                    console.warn(`[Register] Unknown feature: "${feature}"`);
                }
            }
        }
    }

    /**
     * Updates all ECS systems with delta and time.
     */
    public update(delta: number, time: number): void {
        this.world.execute(delta, time);
    }

    /**
     * Safely registers a component to the world if not already registered.
     */
    private _registerComponent(component: ComponentConstructor<Component<unknown>>): void {
        if (!this.world.hasRegisteredComponent(component)) {
            this.world.registerComponent(component);
        }
    }

    /**
     * Safely registers a system to the world if not already present.
     */
    private _registerSystem(system: SystemConstructor<System>): void {
        if (!this.world.getSystem(system)) {
            this.world.registerSystem(system);
        }
    }

    private _isSupported(entity: Entity, options: DataOptions) {
        const data = options.data;

        if (navigator && navigator.xr) {
            console.log(navigator.xr)
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    entity.addComponent(ControllerComponent, {
                        controllers: data?.controllers,
                        renderer: data?.renderer,
                        world: this.world
                    });

                } else {
                    console.log('immersive-vr not supported');
                    entity.addComponent(MouseComponent, {
                        camera: data?.teleportPoint?.camera,
                        pointer: new THREE.Vector2(),
                        renderer: data?.renderer
                    })
                }
            }).catch(() => {
                entity.addComponent(MouseComponent, {
                    camera: data?.teleportPoint?.camera,
                    pointer: new THREE.Vector2(),
                    renderer: data?.renderer
                })
            });
        } else {

        }
    }
}

import { type Attributes, type Entity, System } from 'ecsy';
import { ControllerComponent } from '../components/ControllerComponent';
import * as THREE from 'three';
import { Object3DComponent } from '../components/Object3DComponent';
import { ButtonComponent } from '../components/ButtonComponent';
import { DraggableReturnComponent } from '../components/DraggableReturnComponent';
import { DraggableDefaultComponent } from '../components/DraggableDefaultComponent';
import { MovementFPSComponent } from '../components/MovementFPSComponent';
import { TeleportDefaultComponent } from '../components/TeleportDefaultComponent';
import { KeyboardComponent } from '../components/KeyboardComponent';
import { InputFieldComponent } from '../components/InputFieldComponent';
import { CarouselComponent } from '../components/CarouselComponent';
import type { CarouselHelper } from '#imports';
import { TeleportPointComponent } from '../components/TeleportPointComponent';

export class ControllerSystem extends System {
    private previousButtonStates!: { left: boolean[]; right: boolean[]; };
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private matrix: THREE.Matrix4 = new THREE.Matrix4();


    override init(attributes?: Attributes): void {
        this.previousButtonStates = {
            left: [],
            right: []
        };
    }

    execute(delta: number, time: number): void {
        const currentlyHovered = new Set<Entity>();

        this.queries.controllers?.results.forEach(controllerEntity => {
            const components = controllerEntity.getComponent(ControllerComponent);
            const object = controllerEntity.getComponent(Object3DComponent)?.object;
            if (!components || !object || !object.parent?.visible) return;

            const session = components.renderer.xr.getSession();
            if (!session) return;

            session.inputSources.forEach((source: XRInputSource & { gamepad: Gamepad }) => {
                const handedness = source.handedness;

                const controller = components.controllers.find(c => c.userData.handedness === handedness);
                if (!controller) return;

                this._handleJoystic(source, controller, controllerEntity, delta);

                const intersections = this._getIntersections(controller, object);
                const intersection = intersections[0];
                const gamepad = source.gamepad;

                if (intersection) {
                    if (!controller.userData.isHover) {
                        controller.userData.isHover = true;
                        controller.userData.lineReset = false;
                    }

                    currentlyHovered.add(controllerEntity);

                    this._onHover(source, controllerEntity, gamepad, intersection);
                    this._updateLine(controller, intersection);

                    gamepad?.buttons.forEach((b: GamepadButton, i: number) => {
                        if (handedness !== 'left' && handedness !== 'right') return;

                        const prev = this.previousButtonStates[handedness]?.[i];
                        if (b.pressed || prev) {
                            this._handleButton(b, i, controller, controllerEntity, intersection, gamepad, components.renderer);
                        }
                    });


                } else {
                    if (!controller.userData.lineReset) {
                        this._resetLine(controller);
                        controller.userData.lineReset = true;
                        controller.userData.isHover = false;
                    }
                }
            });
        });

        this.queries.interactables?.results.forEach(entity => {
            if (
                (entity.hasComponent(ButtonComponent) ||
                    entity.hasComponent(KeyboardComponent) ||
                    entity.hasComponent(CarouselComponent) ||
                    entity.hasComponent(TeleportPointComponent)) &&
                !currentlyHovered.has(entity)
            ) {
                this._onUnhover(entity);
            }
        });

    }

    private _onHover(source: XRInputSource, entity: Entity, gamepad: Gamepad, intersection: THREE.Intersection) {

        if (entity.hasComponent(ButtonComponent)) {
            const component = entity.getMutableComponent(ButtonComponent);
            if (!component) return;

            if (component.currState !== 'hovered') component.currState = 'hovered';
            if (
                gamepad &&
                'hapticActuators' in gamepad &&
                Array.isArray(gamepad.hapticActuators) &&
                gamepad.hapticActuators.length > 0 &&
                typeof gamepad.hapticActuators[0].pulse === 'function'
            ) {
                gamepad.hapticActuators[0].pulse(0.2, 40);
            }

        }

        if (entity.hasComponent(KeyboardComponent)) {
            const component = entity.getMutableComponent(KeyboardComponent);
            if (!component) return;

            if (component.state !== 'hover') component.state = 'hover';
        }

        if (entity.hasComponent(CarouselComponent)) {
            const component = entity.getMutableComponent(CarouselComponent);
            if (!component) return;
            if (component.state !== 'hover') component.state = 'hover';

            if (gamepad && gamepad.axes.length >= 2) {
                if (!gamepad.axes[2]) return;
                const horizontal = gamepad.axes[2] * .1;

                if (horizontal === 0) return;
                const layer = intersection.object as CarouselHelper;
                layer?.Scroll(horizontal);
            }
        }

        if (entity.hasComponent(TeleportPointComponent)) {
            const component = entity.getMutableComponent(TeleportPointComponent);
            if (!component) return;
            if (component.state !== 'teleport') component.state = 'hover';
        }
    }


    private _onUnhover(entity: Entity) {
        if (entity.hasComponent(ButtonComponent)) {
            const component = entity.getMutableComponent(ButtonComponent);
            if (!component) return;

            if (component.currState === 'hovered') component.currState = 'none';
        }

        if (entity.hasComponent(KeyboardComponent)) {
            const component = entity.getMutableComponent(KeyboardComponent);
            if (!component) return;

            if (component.state === 'hover') component.state = 'none';
        }

        if (entity.hasComponent(CarouselComponent)) {
            const component = entity.getMutableComponent(CarouselComponent);
            if (!component) return;
            if (component.state !== 'none') component.state = 'none';
        }

        if (entity.hasComponent(TeleportPointComponent)) {
            const component = entity.getMutableComponent(TeleportPointComponent);
            if (!component) return;

            if (component.state === 'hover') component.state = 'none';
        }
    }


    private _handleJoystic(source: XRInputSource, controller: THREE.Group, entity: Entity, delta: number) {

        const handedness = source.handedness;
        const gamepad = source.gamepad;

        if (!gamepad || !entity.hasComponent(MovementFPSComponent)) return;

        const component = entity.getMutableComponent(MovementFPSComponent);
        if (!component) return;

        if (handedness === 'left' && handedness === controller.userData.handedness) {
            const inputX = gamepad.axes[2];
            const inputZ = gamepad.axes[3];
            const forward = new THREE.Vector3(inputX, 0, inputZ);
            const speed = 0.025;

            if (forward.x === 0 && forward.z === 0) return
            forward.normalize();
            forward.multiplyScalar(speed);

            forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), component.player.rotation.y);

            const nextPosition = component.player.position.clone().add(forward);
            component.player.position.copy(nextPosition);

        }

        if (handedness === 'right' && handedness === controller.userData.handedness) {
            const inputX = gamepad.axes[2];
            if (!inputX) return;
            const speed = THREE.MathUtils.degToRad(90);

            if (Math.abs(inputX) > 0.1) component.player.rotation.y -= inputX * speed * delta;

        }
    }


    private _updateLine(controller: THREE.Group, intersection: THREE.Intersection) {
        const line = controller.getObjectByName(`line-${controller.userData.handedness}`);
        if (line) line.scale.z = intersection.distance;
    }

    private _resetLine(controller: THREE.Group) {
        const line = controller.getObjectByName(`line-${controller.userData.handedness}`);
        if (line) line.scale.z = 1;
    }

    private _updateColor(controller: THREE.Group, color: number) {
        const handedness = controller.userData.handedness as 'left' | 'right';
        const line = controller.getObjectByName(`line-${handedness}`) as THREE.Line;

        if (line && line.material instanceof THREE.LineBasicMaterial) {
            line.material.color.set(color);
        }
    }

    private _handleButton(
        button: GamepadButton,
        index: number,
        controller: THREE.Group,
        entity: Entity,
        intersection: THREE.Intersection,
        gamepad: Gamepad,
        renderer: THREE.WebGLRenderer
    ) {
        const side = controller.userData.handedness as 'left' | 'right';

        if (!this.previousButtonStates[side]) {
            this.previousButtonStates[side] = [];
        }

        const wasPressed = this.previousButtonStates[side][index] || false;

        if (button.pressed) {
            this._StartTeleport(entity, intersection.point, renderer);

            if (!wasPressed) {
                this._StartAction(index, controller, entity, intersection, renderer);

                if (
                    gamepad &&
                    'hapticActuators' in gamepad &&
                    Array.isArray(gamepad.hapticActuators) &&
                    gamepad.hapticActuators.length > 0 &&
                    typeof gamepad.hapticActuators[0].pulse === 'function'
                ) {
                    gamepad.hapticActuators[0].pulse(.5, 80);
                }

            }
        } else if (!button.pressed && wasPressed) {
            this._EndAction(index, controller, entity);
        }

        this.previousButtonStates[side][index] = button.pressed;
    }

    private _StartTeleport(entity: Entity, point: THREE.Vector3, renderer: THREE.WebGLRenderer) {

        if (entity.hasComponent(TeleportDefaultComponent)) {
            const component = entity.getMutableComponent(TeleportDefaultComponent);
            if (!component) return;

            component.point = point;
            component.renderer = renderer;
            component.baseReferenceSpace = renderer.xr.getReferenceSpace();
            component.marker?.position.copy(point);
        }
    }


    private _StartAction(index: number, controller: THREE.Group, entity: Entity, intersection: THREE.Intersection, renderer: THREE.WebGLRenderer) {
        switch (index) {
            case 0:
                this._updateColor(controller, 0x22d3ee);
                this._handleSelect(controller, entity, intersection, renderer);
                break;
            case 1:
                this._updateColor(controller, 0x22d3ee);
                this._handleSnap(controller, entity);
                break;

            case 4:
                this._updateColor(controller, 0x22d3ee);
                this._handleClose(controller, entity);
        }
    }

    private _handleClose(controller: THREE.Group, entity: Entity) {
        if (entity.hasComponent(KeyboardComponent)) {
            const component = entity.getMutableComponent(KeyboardComponent);
            if (!component) return;
            console.log(component.keyboard);

        }
    }

    private _EndAction(index: number, controller: THREE.Group, entity: Entity) {
        if (entity.hasComponent(ButtonComponent)) {
            const component = entity.getMutableComponent(ButtonComponent);
            if (!component) return;

            if (component.currState !== 'released') {
                component.currState = 'released';
                this._updateColor(controller, 0xffffff);
            }
        }

        if (entity.hasComponent(DraggableReturnComponent)) {
            const component = entity.getMutableComponent(DraggableReturnComponent);
            if (!component) return;

            component.state = 'to-be-detached';
            component.attachedPointer = null;
            this._updateColor(controller, 0xffffff);
        }

        if (entity.hasComponent(DraggableDefaultComponent)) {
            const component = entity.getMutableComponent(DraggableDefaultComponent);
            if (!component) return;

            component.state = 'to-be-detached';
            component.attachedPointer = null;
            this._updateColor(controller, 0xffffff);
        }

        if (entity.hasComponent(TeleportDefaultComponent)) {
            const component = entity.getMutableComponent(TeleportDefaultComponent);
            if (!component) return;

            component.state = 'teleport';
            this._updateColor(controller, 0xffffff);
        }

        if (entity.hasComponent(KeyboardComponent)) {
            const component = entity.getMutableComponent(KeyboardComponent);
            if (!component) return;

            component.state = 'none';
            component.wasPressed = false;
            this._updateColor(controller, 0xffffff);
        }

        if (entity.hasComponent(InputFieldComponent)) {
            const component = entity.getMutableComponent(InputFieldComponent)
            if (!component) return;

            component.state = 'none';
            this._updateColor(controller, 0xffffff);
        }

        if (entity.hasComponent(TeleportPointComponent)) {
            const component = entity.getMutableComponent(TeleportPointComponent);
            if (!component) return;
            
            console.log(component);
            component.state = 'none';
            this._updateColor(controller, 0xffffff);
        }
    }

    private _handleSnap(controller: THREE.Group, entity: Entity) {
        if (entity.hasComponent(DraggableReturnComponent)) {
            const draggable = entity.getMutableComponent(DraggableReturnComponent);
            if (draggable) {
                draggable.state = 'to-be-draggable';
                draggable.attachedPointer = controller;
            }
        }

        if (entity.hasComponent(DraggableDefaultComponent)) {
            const draggable = entity.getMutableComponent(DraggableDefaultComponent);
            if (draggable) {
                draggable.state = 'to-be-draggable';
                draggable.attachedPointer = controller;
            }
        }
    }

    private _handleSelect(controller: THREE.Group, entity: Entity, intersection: THREE.Intersection, renderer: THREE.WebGLRenderer) {

        if (entity.hasComponent(ButtonComponent)) {
            const component = entity.getMutableComponent(ButtonComponent);
            if (!component) return;
            if (component.currState !== 'pressed') component.currState = 'pressed';
        }

        if (entity.hasComponent(DraggableReturnComponent)) {
            const draggable = entity.getMutableComponent(DraggableReturnComponent);
            if (!draggable) return;

            draggable.state = 'to-be-attached';
            draggable.attachedPointer = controller;
        }

        if (entity.hasComponent(DraggableDefaultComponent)) {
            const component = entity.getMutableComponent(DraggableDefaultComponent);
            if (!component) return;

            component.state = 'to-be-attached';
            component.attachedPointer = controller;
        }

        if (entity.hasComponent(TeleportDefaultComponent)) {
            const component = entity.getMutableComponent(TeleportDefaultComponent);
            if (!component) return;

            component.point = intersection.point;
            component.renderer = renderer;
            component.baseReferenceSpace = renderer.xr.getReferenceSpace();
            component.marker?.position.copy(intersection.point);
        }

        if (entity.hasComponent(KeyboardComponent)) {
            const component = entity.getMutableComponent(KeyboardComponent);
            if (!component) return;

            component.state = 'pressed';
        }

        if (entity.hasComponent(InputFieldComponent)) {
            const component = entity.getMutableComponent(InputFieldComponent)
            if (!component) return;

            component.state = 'active';
        }

        if (entity.hasComponent(TeleportPointComponent)) {
            const component = entity.getMutableComponent(TeleportPointComponent);
            if (!component) return;

            component.state = 'teleport';
        }
    }


    private _getIntersections(controller: THREE.Group, object: THREE.Object3D) {
        this.matrix.identity().extractRotation(controller.matrixWorld);
        controller.updateMatrixWorld();
        this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.matrix);

        return this.raycaster.intersectObject(object, true);
    }


}

ControllerSystem.queries = {
    controllers: {
        components: [ControllerComponent, Object3DComponent]
    },
    interactables: {
        components: [Object3DComponent]
    }
};


/*
import { type Attributes, type Entity, System } from 'ecsy';
import { ControllerComponent } from '../components/ControllerComponent';
import * as THREE from 'three';
import { Object3DComponent } from '../components/Object3DComponent';
import { ButtonComponent } from '../components/ButtonComponent';
import { DraggableReturnComponent } from '../components/DraggableReturnComponent';
import { DraggableDefaultComponent } from '../components/DraggableDefaultComponent';
import { MovementFPSComponent } from '../components/MovementFPSComponent';
import { TeleportDefaultComponent } from '../components/TeleportDefaultComponent';
import { KeyboardComponent } from '../components/KeyboardComponent';
import { InputFieldComponent } from '../components/InputFieldComponent';
import { CarouselComponent } from '../components/CarouselComponent';
import type { CarouselHelper } from '#imports';
import { TeleportPointComponent } from '../components/TeleportPointComponent';

export class ControllerSystem extends System {
    private previousButtonStates!: { left: boolean[]; right: boolean[]; };

    override init(attributes?: Attributes): void {
        this.previousButtonStates = {
            left: [],
            right: []
        };
    }

    execute(delta: number, time: number): void {
        const currentlyHovered = new Set<Entity>();

        this.queries.controllers?.results.forEach(entity => {
            const components = entity.getComponent(ControllerComponent);
            const object = entity.getComponent(Object3DComponent)?.object;
            if (!components || !object) return;

            const session = components.renderer.xr.getSession();
            if (!session) return;

            session.inputSources.forEach((source: XRInputSource & { gamepad: Gamepad }) => {
                const handedness = source.handedness;
                const side = handedness as 'left' | 'right';
                const controller = components.controllers.find(c => c.userData.handedness === handedness);
                if (!controller) return;

                const intersections = this._getIntersections(controller, object);

                const intersection = intersections[0];
                const gamepad = source.gamepad;

                if (!this.previousButtonStates[side]) this.previousButtonStates[side] = [];


                if (gamepad) {
                    gamepad.buttons.forEach((b: GamepadButton, i: number) => {
                        const wasPressed = this.previousButtonStates[side][i] || false;

                        this._handleButton(b, i, controller, entity, intersection, gamepad, components.renderer, wasPressed);

                        this.previousButtonStates[side][i] = b.pressed;
                    });
                }
                if (intersection) {

                    console.log(intersection.object)
                    if (!controller.userData.isHover) {
                        controller.userData.isHover = true;
                        controller.userData.lineReset = false;
                    }

                    currentlyHovered.add(entity);
                    this._onHover(source, entity, gamepad, intersection);
                    this._updateLine(controller, intersection);
                } else {
                    if (!controller.userData.lineReset) {
                        this._resetLine(controller);
                        controller.userData.lineReset = true;
                        controller.userData.isHover = false;
                    }

                    const isHovered = currentlyHovered.has(entity);
                    const object3DComponent = entity.getComponent(Object3DComponent);
                    if (!object3DComponent) return;

                    if (!isHovered && object3DComponent.object.userData.isPreviouslyHovered) {
                        this._onUnhover(entity);
                        object3DComponent.object.userData.isPreviouslyHovered = false;
                    } else if (isHovered && !object3DComponent.object.userData.isPreviouslyHovered) {
                        object3DComponent.object.userData.isPreviouslyHovered = true;
                    }
                }

            });
        });
    }

    private _onHover(source: XRInputSource, entity: Entity, gamepad: Gamepad, intersection: THREE.Intersection) {
        if (!entity) return;

        if (entity.hasComponent(ButtonComponent)) {
            const component = entity.getMutableComponent(ButtonComponent);
            if (!component) return;

            if (component.currState !== 'hovered') component.currState = 'hovered';
            if (
                gamepad &&
                'hapticActuators' in gamepad &&
                Array.isArray(gamepad.hapticActuators) &&
                gamepad.hapticActuators.length > 0 &&
                typeof gamepad.hapticActuators[0].pulse === 'function'
            ) {
                gamepad.hapticActuators[0].pulse(0.2, 40);
            }
        }

        if (entity.hasComponent(KeyboardComponent)) {
            const component = entity.getMutableComponent(KeyboardComponent);
            if (!component) return;

            if (component.state !== 'hover') component.state = 'hover';
        }

        if (entity.hasComponent(CarouselComponent)) {
            const component = entity.getMutableComponent(CarouselComponent);
            if (!component) return;
            if (component.state !== 'hover') component.state = 'hover';

            if (gamepad && gamepad.axes.length >= 2) {
                if (!gamepad.axes[2]) return;
                const horizontal = gamepad.axes[2] * .1;

                if (horizontal === 0) return;
                const layer = intersection.object as CarouselHelper;
                if (layer && typeof layer.Scroll === 'function') {
                    layer.Scroll(horizontal);
                }
            }
        }

        if (entity.hasComponent(TeleportPointComponent)) {
            const component = entity.getMutableComponent(TeleportPointComponent);
            if (!component) return;
            if (component.state !== 'teleport') component.state = 'hover';
        }
    }

    private _onUnhover(entity: Entity) {
        if (!entity) return;

        if (entity.hasComponent(ButtonComponent)) {
            const component = entity.getMutableComponent(ButtonComponent);
            if (!component) return;

            if (component.currState === 'hovered') component.currState = 'none';
        }

        if (entity.hasComponent(KeyboardComponent)) {
            const component = entity.getMutableComponent(KeyboardComponent);
            if (!component) return;

            if (component.state === 'hover') component.state = 'none';
        }

        if (entity.hasComponent(CarouselComponent)) {
            const component = entity.getMutableComponent(CarouselComponent);
            if (!component) return;
            if (component.state !== 'none') component.state = 'none';
        }

        if (entity.hasComponent(TeleportPointComponent)) {
            const component = entity.getMutableComponent(TeleportPointComponent);
            if (!component) return;

            if (component.state === 'hover') component.state = 'none';
        }
    }

    private _updateLine(controller: THREE.Group, intersection: THREE.Intersection) {
        const line = controller.getObjectByName(`line-${controller.userData.handedness}`);
        if (line) line.scale.z = intersection.distance;
    }

    private _resetLine(controller: THREE.Group) {
        const line = controller.getObjectByName(`line-${controller.userData.handedness}`);
        if (line) line.scale.z = 1;
    }

    private _updateColor(controller: THREE.Group, color: number) {
        const handedness = controller.userData.handedness as 'left' | 'right';
        const line = controller.getObjectByName(`line-${handedness}`) as THREE.Line;

        if (line && line.material instanceof THREE.LineBasicMaterial) {
            line.material.color.set(color);
        }
    }

    private _handleButton(
        button: GamepadButton,
        index: number,
        controller: THREE.Group,
        entity: Entity,
        intersection: THREE.Intersection | undefined,
        gamepad: Gamepad,
        renderer: THREE.WebGLRenderer,
        wasPressed: boolean
    ) {
        const side = controller.userData.handedness as 'left' | 'right';
        if (button.pressed && !wasPressed) {
            if (
                gamepad &&
                'hapticActuators' in gamepad &&
                Array.isArray(gamepad.hapticActuators) &&
                gamepad.hapticActuators.length > 0 &&
                typeof gamepad.hapticActuators[0].pulse === 'function'
            ) {
                gamepad.hapticActuators[0].pulse(.5, 80);
            }

            console.log(`${side} clicked on index ${index} with no intersection`)
        }

        if (intersection) {
            if (button.pressed && !wasPressed) {
                this._updateColor(controller, 0x22d3ee);
                switch (index) {
                    case 0:
                        this._handleSelect(controller, entity, intersection, renderer);
                        break;
                    case 1:
                        this._handleSnap(controller, entity);
                        break;
                }
                if (entity.hasComponent(TeleportPointComponent) && index === 0) {
                    this._StartTeleport(entity, intersection.point, renderer);
                }
            } else if (!button.pressed && wasPressed) {
                this._EndAction(index, controller, entity);
            }
        } else {
            if (!button.pressed && wasPressed) {
                switch (index) {
                    case 4:
                        if (entity.hasComponent(KeyboardComponent)) {
                            const component = entity.getMutableComponent(KeyboardComponent);
                            if (component && component.state === 'hide' || component?.state === 'show') {
                                this._updateColor(controller, 0xffffff);
                            }
                        }
                        break;
                }
            }
        }

    }

    private _StartTeleport(entity: Entity, point: THREE.Vector3, renderer: THREE.WebGLRenderer) {

        if (entity.hasComponent(TeleportDefaultComponent)) {
            const component = entity.getMutableComponent(TeleportDefaultComponent);
            if (!component) return;

            component.point = point;
            component.renderer = renderer;
            component.baseReferenceSpace = renderer.xr.getReferenceSpace();
            if (component.marker) {
                component.marker.position.copy(point);
            }
        }
    }

    private _EndAction(index: number, controller: THREE.Group, entity: Entity) {
        if (!entity) return;

        if (entity.hasComponent(ButtonComponent)) {
            const component = entity.getMutableComponent(ButtonComponent);
            if (!component) return;

            if (component.currState !== 'released') {
                component.currState = 'released';
                this._updateColor(controller, 0xffffff);
            }
        }

        if (entity.hasComponent(DraggableReturnComponent)) {
            const component = entity.getMutableComponent(DraggableReturnComponent);
            if (!component) return;

            component.state = 'to-be-detached';
            component.attachedPointer = null;
            this._updateColor(controller, 0xffffff);
        }

        if (entity.hasComponent(DraggableDefaultComponent)) {
            const component = entity.getMutableComponent(DraggableDefaultComponent);
            if (!component) return;

            component.state = 'to-be-detached';
            component.attachedPointer = null;
            this._updateColor(controller, 0xffffff);
        }

        if (entity.hasComponent(TeleportDefaultComponent)) {
            const component = entity.getMutableComponent(TeleportDefaultComponent);
            if (!component) return;

            component.state = 'teleport';
            this._updateColor(controller, 0xffffff);
        }

        if (entity.hasComponent(KeyboardComponent)) {
            const component = entity.getMutableComponent(KeyboardComponent);
            if (!component) return;

            if (index === 0) {
                component.state = 'none';
                component.wasPressed = false;
            }
            this._updateColor(controller, 0xffffff);
        }

        if (entity.hasComponent(InputFieldComponent)) {
            const component = entity.getMutableComponent(InputFieldComponent)
            if (!component) return;

            component.state = 'none';
            this._updateColor(controller, 0xffffff);
        }

        if (entity.hasComponent(TeleportPointComponent)) {
            const component = entity.getMutableComponent(TeleportPointComponent);
            if (!component) return;

            component.state = 'none';
            this._updateColor(controller, 0xffffff);
        }
    }

    private _handleSnap(controller: THREE.Group, entity: Entity) {
        if (!entity) return;

        if (entity.hasComponent(DraggableReturnComponent)) {
            const draggable = entity.getMutableComponent(DraggableReturnComponent);
            if (draggable) {
                draggable.state = 'to-be-draggable';
                draggable.attachedPointer = controller;
            }
        }

        if (entity.hasComponent(DraggableDefaultComponent)) {
            const draggable = entity.getMutableComponent(DraggableDefaultComponent);
            if (draggable) {
                draggable.state = 'to-be-draggable';
                draggable.attachedPointer = controller;
            }
        }
    }

    private _handleSelect(controller: THREE.Group, entity: Entity, intersection: THREE.Intersection, renderer: THREE.WebGLRenderer) {
        if (!entity) return;

        if (entity.hasComponent(ButtonComponent)) {
            const component = entity.getMutableComponent(ButtonComponent);
            if (!component) return;
            if (component.currState !== 'pressed') component.currState = 'pressed';
        }

        if (entity.hasComponent(DraggableReturnComponent)) {
            const draggable = entity.getMutableComponent(DraggableReturnComponent);
            if (!draggable) return;

            draggable.state = 'to-be-attached';
            draggable.attachedPointer = controller;
        }

        if (entity.hasComponent(DraggableDefaultComponent)) {
            const component = entity.getMutableComponent(DraggableDefaultComponent);
            if (!component) return;

            component.state = 'to-be-attached';
            component.attachedPointer = controller;
        }

        if (entity.hasComponent(TeleportDefaultComponent)) {
            const component = entity.getMutableComponent(TeleportDefaultComponent);
            if (!component) return;

            component.point = intersection.point;
            component.renderer = renderer;
            component.baseReferenceSpace = renderer.xr.getReferenceSpace();
            if (component.marker) {
                component.marker.position.copy(intersection.point);
            }
        }

        if (entity.hasComponent(KeyboardComponent)) {
            const component = entity.getMutableComponent(KeyboardComponent);
            if (!component) return;

            component.state = 'pressed';
        }

        if (entity.hasComponent(InputFieldComponent)) {
            const component = entity.getMutableComponent(InputFieldComponent)
            if (!component) return;

            component.state = 'active';
        }

        if (entity.hasComponent(TeleportPointComponent)) {
            const component = entity.getMutableComponent(TeleportPointComponent);
            if (!component) return;
            console.log(component.state)
            component.state = 'teleport';
            console.log(component.state)
        }
    }

    private _getIntersections(controller: THREE.Group, object: THREE.Mesh) {
        const tempMatrix = new THREE.Matrix4();
        const raycaster = new THREE.Raycaster();
        raycaster.far = 1000;
        tempMatrix.identity().extractRotation(controller.matrixWorld);
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
        controller.updateMatrixWorld();
        return raycaster.intersectObject(object, false);
    }
}

ControllerSystem.queries = {
    controllers: {
        components: [ControllerComponent],
    },
};

*/
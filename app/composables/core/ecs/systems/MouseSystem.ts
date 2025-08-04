import { Object3D, Raycaster } from 'three';
import { System, type Entity } from 'ecsy';
import { MouseComponent } from '../components/MouseComponent';
import { Object3DComponent } from '../components/Object3DComponent';
import { TeleportPointComponent } from '../components/TeleportPointComponent';

export class MouseSystem extends System {
    private listenerRegistered = false;

    execute(): void {
        const mouseEntity = this.queries.mouse?.results[0];
        if (!mouseEntity) return;

        const mouse = mouseEntity.getComponent(MouseComponent);
        if (!mouse || !mouse.domElement) return;

        // ✅ Setup event listeners (once)
        if (!this.listenerRegistered) {
            this._registerEventListeners(mouse);
            this.listenerRegistered = true;
        }

        // ✅ Handle hover detection every frame
        const intersections = this._getIntersections(mouse);
        const hoveredObject = intersections[0]?.object;

        for (const entity of this.queries.teleportables!.results) {
            const object = entity.getComponent(Object3DComponent)?.object;
            const teleport = entity.getMutableComponent(TeleportPointComponent);
            if (!object || !teleport) continue;

            const isHovered =
                hoveredObject === object || object.children.includes(hoveredObject as Object3D);

            if (isHovered) {
                if (teleport.state !== 'teleport') teleport.state = 'hover';
            } else {
                if (teleport.state !== 'teleport') teleport.state = 'none';
            }
        }
    }

    private _registerEventListeners(mouse: MouseComponent): void {
        const element = mouse.domElement!;
        element.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            mouse.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        });

        element.addEventListener('click', () => {
            const intersections = this._getIntersections(mouse);
            if (intersections.length === 0) return;

            const clickedObject = intersections[0]?.object;
            if (!clickedObject) return;

            const entity = this._findEntityByObject(clickedObject);
            if (!entity?.hasComponent(TeleportPointComponent)) return;

            const teleport = entity.getMutableComponent(TeleportPointComponent);
            if (teleport) teleport.state = 'teleport';

            console.log('Clicked teleport point:', clickedObject);
        });
    }

    private _getIntersections(mouse: MouseComponent) {
        const raycaster = new Raycaster();
        raycaster.setFromCamera(mouse.pointer, mouse.camera);

        const objects: Object3D[] = [];
        for (const entity of this.queries.teleportables!.results) {
            const object = entity.getComponent(Object3DComponent)?.object;
            if (object) {
                object.updateMatrixWorld(true);
                objects.push(object);
            }
        }

        return raycaster.intersectObjects(objects, true);
    }

    private _findEntityByObject(target: Object3D): Entity | undefined {
        return this.queries.teleportables?.results.find((entity) => {
            const object = entity.getComponent(Object3DComponent)?.object;
            return object === target || object?.children.includes(target);
        });
    }
}

MouseSystem.queries = {
    mouse: {
        components: [MouseComponent],
    },
    teleportables: {
        components: [Object3DComponent, TeleportPointComponent],
    },
};

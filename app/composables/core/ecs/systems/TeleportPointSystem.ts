import { System } from "ecsy";
import { TeleportPointComponent } from "../components/TeleportPointComponent";
import { Object3DComponent } from "../components/Object3DComponent";
import { Color, EquirectangularReflectionMapping, Mesh, MeshStandardMaterial, Texture } from "three";

export class TeleportPointSystem extends System {
    override execute(delta: number, time: number): void {
        this.queries.telportPoint?.results.forEach(entity => {
            const component = entity.getMutableComponent(TeleportPointComponent);
            const object = entity.getComponent(Object3DComponent)?.object;

            switch (component?.state) {
                case 'teleport': {
                    if (component.scene) {
                        if (object && object.userData.texture instanceof Texture) {
                            object.userData.texture.mapping = EquirectangularReflectionMapping;
                            component.scene.environment = object.userData.texture;
                            component.scene.background = object.userData.texture;
                        }
                    }

                    if(component.groups){
                        component.groups.forEach((group, index) => {
                            group.visible = index === object?.userData.target;
                        });
                    }

                    component.state = 'none';
                    break;
                }

                case 'hover': {
                    const mesh = object as Mesh;
                    if (!mesh) return;

                    if (mesh.material instanceof MeshStandardMaterial && mesh.material.color.getHex() !== 0x00ff00) {
                        mesh.material.color.set(0x00ff00);
                    }

                    break;
                }


                default: {
                    const mesh = object as Mesh;
                    if (!mesh) return;

                    if (mesh.material instanceof MeshStandardMaterial && mesh.material.color.getHex() !== 0xd6d4d4) {
                        mesh.material.color.set(0xd6d4d4);
                    }

                    break;
                }
            }
        });
    }
}

TeleportPointSystem.queries = {
    telportPoint: {
        components: [TeleportPointComponent, Object3DComponent]
    }
}
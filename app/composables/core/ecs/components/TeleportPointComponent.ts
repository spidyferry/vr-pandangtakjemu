import { Component, Types } from 'ecsy';
import type { Color, Group, PerspectiveCamera, Scene } from 'three';
import type { OrbitControls } from 'three/examples/jsm/Addons.js';

export class TeleportPointComponent extends Component<TeleportPointComponent> {
    state: 'none' | 'teleport' | 'hover' = 'none';
    groups: Group[] | null = null;
    camera?: PerspectiveCamera;
    scene: Scene | null = null;
    orbitControls?: OrbitControls;
}

TeleportPointComponent.schema = {
    state: { type: Types.String, default: 'none' },
    groups: { type: Types.Ref, default: null },
    camera: { type: Types.Ref, default: null },
    scene: { type: Types.Ref, default: null },
    orbitControls: { type: Types.Ref, default: null },
};

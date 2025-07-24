import { Component, Types } from 'ecsy';
import type { Color, Group, Scene } from 'three';

export class TeleportPointComponent extends Component<TeleportPointComponent> {
    state: 'none' | 'teleport' | 'hover' = 'none';
    groups: Group[] | null = null;
    originalColor: Color | null = null;
    scene: Scene | null = null;
}

TeleportPointComponent.schema = {
    state: { type: Types.String, default: 'none' },
    groups: { type: Types.Ref, default: null },
    originalColor: { type: Types.Ref, default: null },
    scene: { type: Types.Ref, default: null },
};

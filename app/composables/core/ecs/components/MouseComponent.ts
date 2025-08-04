import { Object3D, PerspectiveCamera, Vector2, WebGLRenderer } from 'three';
import { Component, Types } from 'ecsy';

export class MouseComponent extends Component<MouseComponent> {
    pointer: Vector2 = new Vector2(0, 0);
    camera!: PerspectiveCamera;
    renderer!: WebGLRenderer;
    domElement?: HTMLElement;
}

MouseComponent.schema = {
    pointer: { type: Types.Ref, default: () => new Vector2() },
    camera: { type: Types.Ref },
    renderer: { type: Types.Ref },
    domElement: { type: Types.Ref },
};
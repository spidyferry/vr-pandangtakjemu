import { Component, Types } from "ecsy";
import { Audio, Mesh } from "three";

export class CarouselComponent extends Component<CarouselComponent> {
    state: 'none' | 'hover' | 'show' | 'hide' = 'none';
    carousel: Mesh | undefined;
    isLoggedIn: boolean = false;
}

CarouselComponent.schema = {
    state: { type: Types.String, default: 'none' },
    carousel: { type: Types.Ref, default: null },
    isLoggedIn: { type: Types.Boolean, default: false }
};

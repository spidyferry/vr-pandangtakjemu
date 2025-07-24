import { Component, Types } from "ecsy";
import { Audio } from "three";

export class CarouselComponent extends Component<CarouselComponent> {
    state: 'none' | 'hover' = 'none';
}

CarouselComponent.schema = {
    state: { type: Types.String, default: 'none' }
};

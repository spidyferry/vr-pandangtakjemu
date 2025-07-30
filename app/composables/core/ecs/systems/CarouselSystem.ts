import { type Attributes, System } from 'ecsy';
import { CarouselComponent } from '../components/CarouselComponent';
import type { Mesh } from 'three';

export class CarouselSystem extends System {
    override init(attributes?: Attributes): void { }

    execute(delta: number, time: number): void {
        this.queries.carousel?.results.forEach(entity => {
            const component = entity.getMutableComponent(CarouselComponent);


        });
    }

}

CarouselSystem.queries = {
    carousel: {
        components: [CarouselComponent]
    }
};

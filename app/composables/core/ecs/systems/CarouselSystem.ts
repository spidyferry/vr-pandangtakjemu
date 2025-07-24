import { type Attributes, System } from 'ecsy';
import { CarouselComponent } from '../components/CarouselComponent';

export class CarouselSystem extends System {
    override init(attributes?: Attributes): void { }

    execute(delta: number, time: number): void {
        this.queries.carousel?.results.forEach(entity => {
            const carousel = entity.getMutableComponent(CarouselComponent);

            switch (carousel?.state) {
                case 'hover':
                    break;
            }
        });
    }

}

CarouselSystem.queries = {
    carousel: {
        components: [CarouselComponent]
    }
};

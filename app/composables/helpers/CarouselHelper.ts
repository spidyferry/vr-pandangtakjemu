import {
    FrontSide,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    Plane,
    Vector3,
    Group,
    MathUtils,
    PlaneHelper
} from "three";
import type { BoundingBox } from "../types/index";
import { Text } from "troika-three-text";

export class CarouselHelper extends Mesh {
    private _minScroll = 0;
    private _maxScroll = 0;

    public readonly clippingPlanes: Plane[] = [];
    private readonly originalPlanes = new Map<Plane, Plane>();

    constructor({ title = "VR SHOP", debugClipping = false }: { title: string, debugClipping?: boolean }) {
        const geometry = new PlaneGeometry(1, 0.5);
        const material = new MeshBasicMaterial({
            color: 0x000000,
            side: FrontSide,
            transparent: true,
            opacity: 0.7
        });

        super(geometry, material);
        this.add(new Group());

        const clipLeft = new Plane(new Vector3(1, 0, 0), 0.4);
        const clipRight = new Plane(new Vector3(-1, 0, 0), 0.4);
        const clipTop = new Plane(new Vector3(0, -1, 0), 2);
        const clipBottom = new Plane(new Vector3(0, 1, 0), -1.35);

        this.clippingPlanes.push(clipLeft, clipTop, clipRight, clipBottom);

        for (const plane of this.clippingPlanes) {
            this.originalPlanes.set(plane, plane.clone());
        }

        if (debugClipping) {
            this.add(new PlaneHelper(clipLeft, 5, 0xff0000));   
            this.add(new PlaneHelper(clipRight, 5, 0x00ff00));  
            this.add(new PlaneHelper(clipTop, 5, 0x0000ff));   
            this.add(new PlaneHelper(clipBottom, 5, 0xffff00)); 
        }

        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        if (boundingBox) {
            this._createTitle(title, boundingBox);
        }
    }

    private _createTitle(title: string, boundingBox: BoundingBox) {
        const content = new Text();
        content.material.side = FrontSide;
        content.fontSize = 0.03;
        content.textAlign = "center";
        content.overflowWrap = "break-word";
        content.whiteSpace = "normal";
        content.anchorX = "center";
        content.anchorY = "top";
        content.direction = "ltr";
        content.maxWidth = 0.9;
        content.color = 0xffffff;
        content.text = title;
        content.position.set(0, boundingBox.max.y * 0.9, 0.001);
        content.sync();
        this.add(content);
    }

    public SetScroll(min: number, max: number) {
        this._maxScroll = max;
        this._minScroll = min;
    }

    public Scroll(delta: number) {
        this.children.forEach(child => {
            if (child instanceof Group && child.isGroup) {
                const newX = child.position.x - delta;
                child.position.x = MathUtils.clamp(newX, -this._maxScroll, this._minScroll);
            }
        });
    }

    public getOriginalPlane(p: Plane): Plane | undefined {
        return this.originalPlanes.get(p);
    }
}

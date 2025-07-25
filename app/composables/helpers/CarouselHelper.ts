import {
    FrontSide,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    Plane,
    Vector3,
    Group,
    MathUtils,
    PlaneHelper,
    Camera,
    Matrix4,
    MeshStandardMaterial,
} from "three";
import { Text } from "troika-three-text";
import type { BoundingBox } from "../types/index";

export class CarouselHelper extends Mesh {
    private _minScroll = 0;
    private _maxScroll = 0;

    public readonly clippingPlanes: Plane[] = [];
    private readonly originalPlanes: Plane[] = [];

    private _followTarget = new Vector3();
    private _offset = new Vector3(0, 0, -1);
    private _debugHelpers: PlaneHelper[] = [];

    constructor({
        title = "VR SHOP",
        width = 1,
        height = 0.5,
        debugClipping = false,
    }: {
        title: string;
        width?: number;
        height?: number;
        debugClipping?: boolean;
    }) {
        const geometry = new PlaneGeometry(width, height);
        const material = new MeshBasicMaterial({
            color: 0x000000,
            side: FrontSide,
            transparent: true,
            opacity: 0.7,
        });

        super(geometry, material);

        const contentGroup = new Group();
        this.add(contentGroup);

        // Define clipping planes **relative to geometry bounds**
        const clipLeft = new Plane(new Vector3(1, 0, 0), width / 2); // right side
        const clipRight = new Plane(new Vector3(-1, 0, 0), width / 2); // left side
        const clipTop = new Plane(new Vector3(0, -1, 0), height / 2); // top
        const clipBottom = new Plane(new Vector3(0, 1, 0), height / 2); // bottom

        this.originalPlanes.push(clipLeft, clipRight, clipTop, clipBottom);

        // Create local clipping planes
        for (let i = 0; i < this.originalPlanes.length; i++) {
            const local = new Plane();
            const original = this.originalPlanes[i];
            if (!original) continue;

            local.copy(original).applyMatrix4(this.matrix);
            this.clippingPlanes.push(local);
        }

        // Debug helpers
        if (debugClipping) {
            const helpers = [
                new PlaneHelper(clipLeft, 1, 0xff0000),
                new PlaneHelper(clipRight, 1, 0x00ff00),
                new PlaneHelper(clipTop, 1, 0x0000ff),
                new PlaneHelper(clipBottom, 1, 0xffff00),
            ];
            for (const h of helpers) {
                this.add(h);
                this._debugHelpers.push(h);
            }
        }

        // Title text
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        if (boundingBox) {
            this._createTitle(title, boundingBox);
        }
    }

    private _createTitle(title: string, bounds: BoundingBox) {
        const text = new Text();
        text.text = title;
        text.fontSize = 0.03;
        text.anchorX = "center";
        text.anchorY = "top";
        text.maxWidth = 0.9;
        text.color = 0xffffff;
        text.position.set(0, bounds.max.y * 0.9, 0.001);
        text.sync();
        this.add(text);
    }

    public SetScroll(min: number, max: number) {
        this._minScroll = min;
        this._maxScroll = max;
    }

    public Scroll(delta: number) {
        this.children.forEach((child) => {
            if (child instanceof Group) {
                const newX = child.position.x - delta;
                child.position.x = MathUtils.clamp(newX, -this._maxScroll, this._minScroll);
            }
        });
    }

    public updateClippingPlanes() {
        this.updateMatrixWorld(true);
        for (let i = 0; i < this.originalPlanes.length; i++) {
            const original = this.originalPlanes[i];
            if (!original) return;

            const clipped = this.clippingPlanes[i];
            if (!clipped) return;
            clipped.copy(original).applyMatrix4(this.matrixWorld);
        }

        // this.traverse((obj) => {
        //     if (obj instanceof Mesh) {
        //         const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        //         for (const mat of materials) {
        //             if ("clippingPlanes" in mat) {
        //                 mat.clippingPlanes = this.clippingPlanes;
        //                 mat.clipIntersection = true;
        //                 mat.needsUpdate = true;
        //             }
        //         }
        //     }
        // });
    }

    public followCamera(camera: Camera) {
        this._followTarget.copy(this._offset).applyQuaternion(camera.quaternion).add(camera.position);
        this.position.lerp(this._followTarget, 0.1);
        this.lookAt(camera.position);
        this.updateClippingPlanes();
    }
}

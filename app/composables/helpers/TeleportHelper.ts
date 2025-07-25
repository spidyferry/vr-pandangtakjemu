import {
    CircleGeometry,
    DoubleSide,
    EquirectangularReflectionMapping,
    Group,
    LoadingManager,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PlaneGeometry,
    Texture,
    Vector3
} from "three";
import { RGBELoader } from "three/examples/jsm/Addons.js";

type DefaultOptions = {
    type: 'default';
    loadingManager?: LoadingManager;
    defaultData?: {
        size?: number;
        color?: number;
    };
};

type PointOptions = {
    type: 'point';
    loadingManager?: LoadingManager;
    pointData?: {
        env: string[];
        config: {
            points: Vector3[];
            target: number[];
        }[];
    };
};

type TeleportHelperOptions = DefaultOptions | PointOptions;

export class TeleportHelper {
    private _loadingManager?: LoadingManager;

    public groups: Group[] = [];

    public hdrTextures: Record<number, Texture> = {};

    public marker?: Mesh;

    public floor?: Mesh;

    private constructor() { }

    static async create(options: TeleportHelperOptions): Promise<TeleportHelper> {
        const helper = new TeleportHelper();
        helper._loadingManager = options.loadingManager;

        switch (options.type) {
            case 'default':
                helper._createDefault(options.defaultData);
                break;
            case 'point':
                await helper._createPointBased(options.pointData);
                break;
        }

        return helper;
    }

    public showGroup(index: number) {
        this.groups.forEach((group, i) => {
            group.visible = i === index;
        });
    }

    private _createDefault(data?: { size?: number; color?: number }) {
        const size = data?.size ?? 4.8;
        const color = data?.color ?? 0xbcbcbc;

        const material = new MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.25,
        });

        const geometry = new PlaneGeometry(size, size).rotateX(-Math.PI / 2);

        this.marker = new Mesh(geometry.clone(), material.clone());
        this.floor = new Mesh(geometry.clone(), material.clone());
    }

    private async _createPointBased(data?: {
        env: string[];
        config: {
            points: Vector3[];
            target: number[];
        }[];
    }) {
        if (!data?.env?.length || !this._loadingManager) return;

        await Promise.all(
            data.env.map((path, index) =>
                this._loadHDR(path).then(texture => {
                    texture.name = `HDR_${index}`;
                    this.hdrTextures[index] = texture;
                })
            )
        );

        data.config.forEach((config, groupIndex) => {
            const group = new Group();
            group.name = `TeleportGroup_${groupIndex}`;

            config.points.forEach((point, pointIndex) => {
                const material = new MeshStandardMaterial({
                    color: 0xd6d4d4,
                    side: DoubleSide
                });

                const geometry = new CircleGeometry(0.25, 32).rotateX(-Math.PI / 2);
                const circle = new Mesh(geometry, material);
                circle.position.copy(point);

                const targetIndex = config.target[pointIndex];
                if (typeof targetIndex === 'number') {
                    circle.userData.texture = this.hdrTextures[targetIndex];
                    circle.userData.target = targetIndex;               
                }

                group.add(circle);
            });

            group.visible = groupIndex === 0;
            this.groups.push(group);
        });
    }

    private _loadHDR(path: string): Promise<Texture> {
        return new Promise((resolve, reject) => {
            new RGBELoader(this._loadingManager).load(
                path,
                texture => {
                    texture.mapping = EquirectangularReflectionMapping;
                    resolve(texture);
                },
                undefined,
                err => {
                    console.error(`Failed to load HDR: ${path}`, err);
                    reject(err);
                }
            );
        });
    }
}

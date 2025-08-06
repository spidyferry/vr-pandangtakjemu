import { HDRJPGLoader } from "@monogrid/gainmap-js";
import {
    CircleGeometry,
    DoubleSide,
    EquirectangularReflectionMapping,
    Euler,
    Group,
    LoadingManager,
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PlaneGeometry,
    PMREMGenerator,
    Quaternion,
    Texture,
    TextureLoader,
    Vector3,
    WebGLRenderer
} from "three";
import { RGBELoader } from "three/examples/jsm/Addons.js";
import { Text } from "troika-three-text";
import type { CreateEngine } from "../core/Engine";

type DefaultOptions = {
    type: 'default';
    loadingManager?: LoadingManager;
    template?: CreateEngine;
    defaultData?: {
        size?: number;
        color?: number;
    };
};

type PointOptions = {
    type: 'point';
    loadingManager?: LoadingManager;
    template?: CreateEngine;
    pointData?: {
        env: string[];
        config: {
            points: Vector3[];
            target: number[];
            rotation: Vector3[];
            tts: string[]
            name: string[]
        }[];
    };
};

type TeleportHelperOptions = DefaultOptions | PointOptions;

export class TeleportHelper {
    public groups: Group[] = [];
    public hdrTextures: Record<number, Texture> = {};
    public marker?: Mesh;
    public floor?: Mesh;

    private _loadingManager?: LoadingManager;
    private _template?: CreateEngine;
    private _pmremGenerator?: PMREMGenerator;

    private constructor() { }

    static async create(options: TeleportHelperOptions): Promise<TeleportHelper> {
        const helper = new TeleportHelper();
        helper._loadingManager = options.loadingManager;

        if (options.type === 'point') {
            helper._template = options.template;
        }
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

        const geometry = new PlaneGeometry(size, size); //.rotateX(-Math.PI / 2);

        this.marker = new Mesh(geometry.clone(), material.clone());
        this.floor = new Mesh(geometry.clone(), material.clone());
    }

    private async _createPointBased(data?: {
        env: string[];
        config: {
            rotation: Vector3[];
            points: Vector3[];
            target: number[];
            tts: string[];
            name: string[]
        }[];
    }) {
        if (!data?.env?.length || !this._loadingManager) return;

        if (this._template?.Renderer) {
            this._pmremGenerator = new PMREMGenerator(this._template?.Renderer);
            this._pmremGenerator.compileEquirectangularShader()
        }

        await Promise.all(
            data.env.map((path, index) =>
                this._loadEnv(path).then(texture => {
                    texture.name = `HDR_${index}`;
                    this.hdrTextures[index] = texture;
                })
            )
        );

        data.config.forEach((config, groupIndex) => {
            const group = new Group();
            group.name = `TeleportGroup_${groupIndex}`;

            config.points.forEach((point, pointIndex) => {
                const textureLoader = new TextureLoader(this._loadingManager);
                const texture = textureLoader.load('/images/Arrow.png');

                const material = new MeshStandardMaterial({
                    color: 0xd6d4d4,
                    side: DoubleSide,
                    map: texture
                });

                const geometry = new CircleGeometry(0.25, 32);//.rotateX(-Math.PI / 2);
                const circle = new Mesh(geometry, material);
                circle.position.copy(point);


                if (config.tts) {
                    const url = config.tts[pointIndex];
                    if(!url) return;

                    const audio = this._template?.setAudio(url, false);
                    circle.userData.sound = audio;
                }

                const targetIndex = config.target[pointIndex];
                if (typeof targetIndex === 'number') {
                    circle.userData.texture = this.hdrTextures[targetIndex];
                    circle.userData.target = targetIndex;
                }

                const name = config.name?.[pointIndex];
                if (name) {
                    const label = this._createText(name);
                    label.position.set(point.x, point.y + 0.4, point.z); // offset ke atas
                    group.add(label);

                    const rotation = config.rotation?.[pointIndex];
                    if (rotation instanceof Vector3) {
                        const euler = new Euler(
                            MathUtils.degToRad(rotation.x),
                            MathUtils.degToRad(rotation.y),
                            MathUtils.degToRad(rotation.z)
                        );
                        circle.rotation.copy(euler);
                        label.rotation.copy(euler);
                    }
                }

                group.add(circle);
            });

            group.visible = groupIndex === 0;
            this.groups.push(group);
        });
    }

    private _createText(name: string): Text {
        const text = new Text();
        text.text = name;
        text.fontSize = 0.25;
        text.color = 0x4293f5;
        text.anchorX = 'center';
        text.anchorY = 'bottom';
        text.outlineWidth = 0.005;
        text.outlineColor = 'white';

        text.sync();

        return text;
    }
    private _loadEnv(path: string): Promise<Texture> {
        const isJPG = path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png');

        if (isJPG) {
            const loader = new HDRJPGLoader(this._template?.Renderer);
            return new Promise(async (resolve, reject) => {
                try {
                    const result = await loader.loadAsync(path);
                    const texture = result.renderTarget?.texture;

                    if (!texture) {
                        reject(new Error('HDRJPGLoader returned no texture'));
                        return;
                    }

                    texture.mapping = EquirectangularReflectionMapping;
                    texture.needsUpdate = true;

                    const pmrem = this._pmremGenerator?.fromEquirectangular(texture);
                    result.dispose();

                    if (!pmrem) {
                        reject(new Error('Failed to generate PMREM'));
                        return;
                    }

                    resolve(texture);
                } catch (err) {
                    console.error(`Failed to load HDRJPG: ${path}`, err);
                    reject(err);
                }
            });
        } else {
            const loader = new RGBELoader(this._loadingManager);
            return new Promise((resolve, reject) => {
                loader.load(
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

}

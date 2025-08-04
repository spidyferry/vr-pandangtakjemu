import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { optionalFeatures } from '../../config/webvr.config';
import { CreateEngine } from '../../core/Engine';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


export class VR extends CreateEngine {
    constructor(container: HTMLElement) {
        super();

        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    this.Renderer.xr.enabled = true;
                    container.appendChild(
                        VRButton.createButton(this.Renderer, {
                            optionalFeatures: optionalFeatures
                        })
                    );
                } else {
                    this.initFallback(container);
                }
            }).catch(() => {
                this.initFallback(container);
            });
        } else {
            this.initFallback(container);
        }
    }

    private initFallback(container: HTMLElement) {
        container.appendChild(this.Renderer.domElement);
    }

}

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { optionalFeatures } from '../../config/webvr.config';
import { CreateEngine } from '../../core/Engine';

export class VR extends CreateEngine {
    constructor(container: HTMLElement) {
        super();

        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    this.Renderer.xr.enabled = true;
                    container.appendChild(this.Renderer.domElement);
                    container.appendChild(
                        VRButton.createButton(this.Renderer, {
                            optionalFeatures: optionalFeatures
                        })
                    );
                }
            })
        } 
    }
}

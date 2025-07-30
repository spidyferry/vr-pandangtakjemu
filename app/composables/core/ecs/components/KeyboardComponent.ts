import { Component, Types } from 'ecsy';
import { InputField } from '../../../helpers/InputField';
import { Keyboard } from '../../../helpers/Keyboard';
import type { Camera } from 'three';
import type { Group } from 'three/examples/jsm/libs/tween.module.js';

export class KeyboardComponent extends Component<KeyboardComponent> {
    state: 'none' | 'pressed' | 'hover' | 'show' | 'hide' = 'none';
    wasPressed: boolean = false;
    inputField?: InputField;
    keyboard?: Keyboard;
    group?: Group;
    camera?: Camera;
    isLoggedIn: boolean = false;
}

KeyboardComponent.schema = {
    state: { type: Types.String, default: 'none' },
    wasPressed: { type: Types.Boolean, default: false },
    inputField: { type: Types.Ref, default: null },
    keyboard: { type: Types.Ref, default: null },
    camera: { type: Types.Ref, default: null },
    isLoggedIn: { type: Types.Boolean, default: false },
};

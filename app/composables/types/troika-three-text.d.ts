declare module 'troika-three-text' {
  import {
    Mesh,
    BufferGeometry,
    Material,
    ColorRepresentation,
    Object3D
  } from 'three'

  export class Text extends Mesh<BufferGeometry, Material> {
    constructor()

    /** Text content */
    text: string

    /** Font URL (TTF/WOFF/etc.) */
    font: string

    fontSize: number
    fontStyle?: string
    fontWeight?: string | number // e.g., "bold", 400, etc.
    lang?: string
    letterSpacing?: number
    lineHeight?: number
    maxWidth?: number
    overflowWrap?: 'normal' | 'break-word'
    textAlign?: 'left' | 'center' | 'right' | 'justify'

    anchorX?: 'left' | 'center' | 'right' | number
    anchorY?: 'top' | 'top-baseline' | 'top-cap' | 'top-ex' | 'middle' | 'bottom' | 'bottom-baseline' | number

    color?: ColorRepresentation
    fillOpacity?: number

    /** Optional curved layout */
    curveRadius?: number

    /** Z-fighting offset (depth bias) */
    depthOffset?: number

    /** Layout direction */
    direction?: 'auto' | 'ltr' | 'rtl'

    /** Outline styling */
    outlineWidth?: number | string
    outlineColor?: ColorRepresentation
    outlineOpacity?: number
    outlineBlur?: number

    /** Stroke styling */
    strokeWidth?: number | string
    strokeColor?: ColorRepresentation
    strokeOpacity?: number

    whiteSpace?: 'normal' | 'nowrap' | 'pre-wrap'

    /** Background styling */
    backgroundColor?: ColorRepresentation
    backgroundOpacity?: number
    padding?: number | string

    /** SDF (signed distance field) font quality */
    sdfGlyphSize?: number

    /** Manually trigger text layout + geometry rebuild */
    sync(): void

    /** Overrides from Mesh */
    geometry: BufferGeometry
    material: Material
    isMesh: true
    type: string
  }

  /** Preload a font before using it */
  export function preloadFont(options: {
    font: string
    characters?: string
  }): void
}

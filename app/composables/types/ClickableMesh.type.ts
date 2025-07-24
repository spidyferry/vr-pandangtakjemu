import type { Mesh } from "three";

export type ClickableMesh = Mesh & {
    onClick?: () => void;
};
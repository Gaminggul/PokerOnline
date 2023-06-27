import React from "react";
import { useTexture, useGLTF } from "@react-three/drei";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import type { CardId } from "../code/cards";

type GLTFResult = GLTF & {
    nodes: {
        Card: THREE.Mesh;
    };
    materials: {
        front: THREE.MeshStandardMaterial;
        back: THREE.MeshStandardMaterial;
        gap: THREE.MeshStandardMaterial;
    };
};

export function Card3d({ front, back }: { front: CardId; back: CardId }) {
    const { nodes, materials } = useGLTF("/card.glb") as GLTFResult;

    const frontTexture = useTexture(`/cards/${front}.svg`);
    const backTexture = useTexture(`/cards/${back}.svg`);

    materials.front.map = frontTexture;
    materials.back.map = backTexture;

    return (
        <mesh geometry={nodes.Card.geometry} material={materials.front}>
            <primitive object={nodes.Card} />
        </mesh>
    );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import type { CardId } from "../code/cards";
import { degToRad } from "three/src/math/MathUtils";
import type { GLTF } from "three-stdlib";
import { MeshStandardMaterial } from "three";
import * as THREE from "three";

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

function useSVGTexture(url: string, width: number): THREE.Texture | null {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        const image = new Image();

        image.onload = () => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            // Compute the height based on the aspect ratio of the original image
            const height = (image.height / image.width) * width;

            // Adjust the canvas size
            canvas.width = width;
            canvas.height = height;

            if (context) {
                context.drawImage(image, 0, 0, width, height);
                const texture = new THREE.Texture(canvas);
                texture.needsUpdate = true;
                setTexture(texture);
            }
        };

        image.src = url;

        return () => {
            if (texture) texture.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, width]);

    return texture;
}

export function Card3d({ card }: { card: CardId | "hidden" }) {
    const { nodes } = useGLTF("/card.glb") as GLTFResult;
    const frontTexture = useSVGTexture(`/cards/${card}.svg`, 2000);
    const backTexture = useSVGTexture(`/cards/hidden.svg`, 2000);

    const clonedMesh = useMemo(() => nodes.Card.clone(), [nodes.Card]);

    const materialFront = useMemo(
        () =>
            frontTexture &&
            new MeshStandardMaterial({ map: frontTexture, transparent: true }),
        [frontTexture],
    );
    const materialBack = useMemo(
        () =>
            backTexture &&
            new MeshStandardMaterial({ map: backTexture, transparent: true }),
        [backTexture],
    );
    const gap_material = useMemo(
        () => new MeshStandardMaterial({ color: "white" }),
        [],
    );

    if (!materialFront || !materialBack) {
        return null;
    }

    clonedMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            switch ((child.material as { name?: string })?.name) {
                case "front":
                    child.material = materialFront;
                    break;
                case "back":
                    child.material = materialBack;
                    break;
                case "gap":
                    child.material = gap_material;
                    break;
            }
        }
    });

    return (
        <mesh
            geometry={clonedMesh.geometry}
            rotation={[degToRad(90), degToRad(90), 0]}
            scale={[1, 1, -1]}
        >
            <primitive object={clonedMesh} />
        </mesh>
    );
}

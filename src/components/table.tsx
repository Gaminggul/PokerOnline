import { type CardId } from "../code/cards";
import type {
    VisualGameState,
    PlayerAction,
} from "../code/game_data";
import { useEffect, useRef, useState } from "react";
import { panic } from "functional-utilities";
import { Canvas, useFrame } from "@react-three/fiber";
import { Card3d } from "../component3/card";
import { degToRad } from "three/src/math/MathUtils";

type TableComponent = (props: {
    state: VisualGameState;
    submit_action: (action: PlayerAction) => void;
    restart_action: () => void;
}) => JSX.Element;

export const Table: TableComponent = ({
    state,
}) => {
    const you =
        state.players.find((p) => p.you) ??
        state.players[0] ??
        panic("No players");
    return (
        <Canvas>
            <group>
                {[you.card1, you.card2].map((card, i) => {
                    return (
                        <group key={i} position={[(i * 2 - 1) * 1.2, -2, 0]}>
                            <AnimatedCard card={card}></AnimatedCard>
                        </group>
                    );
                })}
            </group>
            <ambientLight intensity={0.8} />
        </Canvas>
    );
};

function AnimatedCard({ card }: { card: CardId | "hidden" }) {
    const [front, setFront] = useState(card);
    const groupRef = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        if (groupRef.current) {
            const shouldHide = card === "hidden";
            const targetRotation = shouldHide ? degToRad(-180) : 0;

            const delta = clock.getElapsedTime();

            // Assuming a rotation around the x axis, modify as needed
            groupRef.current.rotation.y +=
                (targetRotation - groupRef.current.rotation.y) * delta * 0.1; // Change 0.5 to adjust speed
        }
    });

    useEffect(() => {
        if (card !== "hidden") {
            setFront(card);
        }
    }, [card]);

    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y = degToRad(-180);
        }
    }, []);

    return (
        <group ref={groupRef}>
            <Card3d card={front}></Card3d>
        </group>
    );
}

import { v4 } from "uuid";
import { Layout } from "../components/layout";
import dynamic from "next/dynamic";
import { useState } from "react";

// Import SinglePlayer dynamically
const SinglePlayer = dynamic(() => import("../components/single_player"), {
    ssr: false,
});

function Game() {
    const [gameId] = useState("SinglePlayer");
    return (
        <Layout show_banner={false}>
            {gameId && typeof gameId === "string" ? (
                <SinglePlayer id={gameId} />
            ) : (
                <div>Game not found</div>
            )}
        </Layout>
    );
}

export default Game;

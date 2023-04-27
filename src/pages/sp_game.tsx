import { v4 } from "uuid";
import { Layout } from "../components/layout";
import SinglePlayer from "../components/single_player";
import { useState } from "react";

function Game() {
    const [gameId] = useState(v4);
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

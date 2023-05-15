import type { PlayerAction } from "../code/game_data";
import Table from "./table";
import { useState } from "react";
import { v4 } from "uuid";
import { SPGameState } from "../code/classes/sp_game_state";

const start_user_data = [
    {
        chips: 1000,
        id: v4(),
        name: "Player 1",
    },
    {
        chips: 1000,
        id: v4(),
        name: "Player 2",
    },
];

function SinglePlayer({ id }: { id: string }) {
    const [spGameState, setSpGameState] = useState<SPGameState>(
        SPGameState.generate(id, start_user_data)
    );

    function action_handler(action: PlayerAction) {
        setSpGameState(() =>
            spGameState.action(
                action,
                spGameState.instance.get_current_player().get_pid()
            )
        );
    }

    return (
        <>
            <Table
                submit_action={action_handler}
                state={spGameState.instance.visualize(
                    spGameState.instance.get_current_player().get_pid()
                )}
                restart_action={() => {
                    setSpGameState(spGameState.restart());
                }}
            />
        </>
    );
}

export default SinglePlayer;

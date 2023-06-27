import type { PlayerAction } from "../code/game_data";
import Table from "./table";
import { useState } from "react";
import { v4 } from "uuid";
import { SPGameState } from "../code/classes/sp_game_state";
import {
    NonEmptyArray,
    at,
    isNonEmptyArray,
    panic,
} from "functional-utilities";

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
] satisfies NonEmptyArray<any>;

function SinglePlayer({ id }: { id: string }) {
    const [spGameState, setSpGameState] = useState<SPGameState>(
        SPGameState.generate(id, start_user_data, "texas_holdem")
    );

    const current =
        spGameState.instance.awaited_players()[0] ??
        at(spGameState.instance.players, 0);

    function action_handler(action: PlayerAction) {
        setSpGameState(() => spGameState.action(action, current.get_pid()));
    }

    return (
        <>
            <Table
                submit_action={action_handler}
                state={spGameState.instance.visualize(current.get_pid())}
                restart_action={() => {
                    setSpGameState(spGameState.restart());
                }}
            />
        </>
    );
}

export default SinglePlayer;

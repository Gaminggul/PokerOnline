import type { PlayerAction } from "../code/game_data";
import { Table } from "./table";
import { useCallback, useEffect, useState } from "react";
import { v4 } from "uuid";
import { SPGameState } from "../code/classes/sp_game_state";
import { type NonEmptyArray, at } from "functional-utilities";
import { type BotConfig, getBotAction } from "../code/bot";

const start_user_data = [
    {
        chips: 1000,
        id: v4(),
        name: "Player 0",
        bot: { riskiness: 0.5, randomness: 0 },
    },
    {
        chips: 1000,
        id: v4(),
        name: "Player 1",
        bot: undefined,
    },
    {
        chips: 1000,
        id: v4(),
        name: "Player 2",
        bot: { riskiness: 0.5, randomness: 0.5 },
    },
    {
        chips: 1000,
        id: v4(),
        name: "Player 3",
        bot: { riskiness: 0.2, randomness: 0.2 },
    },
] satisfies NonEmptyArray<{
    chips: number;
    id: string;
    name: string;
    bot: undefined | BotConfig;
}>;

function SinglePlayer({ id }: { id: string }) {
    const [spGameState, setSpGameState] = useState<SPGameState>(
        SPGameState.generate(id, start_user_data, "texas_holdem"),
    );

    const current =
        spGameState.instance.awaited_players()[0] ??
        at(spGameState.instance.players, 0);

    const action_handler = useCallback(
        (action: PlayerAction) => {
            let new_state = spGameState.action(action, current.get_pid());
            console.log(new_state);
            let loop_count = 0;
            while (true) {
                loop_count++;
                if (loop_count > start_user_data.length * 2) {
                    throw new Error("Loop count exceeded");
                }
                const next_player = new_state.instance.awaited_players()[0];
                if (!next_player || !next_player.bot) {
                    setSpGameState(new_state);
                    break;
                }

                const bot_action = getBotAction(
                    new_state.instance.visualize(next_player.get_pid()),
                    next_player.bot,
                );
                console.log(bot_action);
                new_state = new_state.action(bot_action, next_player.get_pid());
                console.log(new_state);
            }
            setSpGameState(new_state);
        },
        [current, spGameState],
    );

    useEffect(() => {
        const startPlayer = spGameState.instance.awaited_players()[0];
        if (startPlayer && startPlayer.bot) {
            console.log(spGameState);
            const bot_action = getBotAction(
                spGameState.instance.visualize(startPlayer.get_pid()),
                startPlayer.bot,
            );
            console.log(bot_action);
            action_handler(bot_action);
        }
    }, [spGameState, action_handler]);

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

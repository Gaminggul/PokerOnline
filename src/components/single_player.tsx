import type { PlayerAction } from "../code/game_data";
import { useCallback, useEffect, useRef } from "react";
import { v4 } from "uuid";
import { SPGameState } from "../code/classes/sp_game_state";
import { type NonEmptyArray, at } from "functional-utilities";
import { type BotConfig, getBotAction } from "../code/bot";
import { useRerender } from "../utils/use_rerender";
import { TableOld } from "./table_old";

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
    const rerender = useRerender();
    const spGameState = useRef<SPGameState>(
        SPGameState.generate(id, start_user_data, "texas_holdem"),
    );

    const current_player =
        spGameState.current.instance.current_game_state.awaited_players()[0] ??
        at(spGameState.current.instance.current_game_state.players, 0);

    const action_handler = useCallback(
        (action: PlayerAction) => {
            spGameState.current.action(action, current_player.get_pid());
            let loop_count = 0;
            while (true) {
                loop_count++;
                if (loop_count > start_user_data.length * 2) {
                    throw new Error("Loop count exceeded");
                }
                const next_player =
                    spGameState.current.instance.current_game_state.awaited_players()[0];
                if (!next_player || !next_player.bot) {
                    break;
                }

                const bot_action = getBotAction(
                    spGameState.current.instance.visualize(
                        next_player.get_pid(),
                    ),
                    next_player.bot,
                );
                console.log(bot_action);
                spGameState.current.action(bot_action, next_player.get_pid());
            }
            rerender();
        },
        [current_player, spGameState],
    );

    useEffect(() => {
        const startPlayer =
            spGameState.current.instance.current_game_state.awaited_players()[0];
        if (startPlayer && startPlayer.bot) {
            console.log(spGameState);
            const bot_action = getBotAction(
                spGameState.current.instance.visualize(startPlayer.get_pid()),
                startPlayer.bot,
            );
            console.log(bot_action);
            action_handler(bot_action);
        }
    }, [spGameState, action_handler]);

    return (
        <>
            <TableOld
                submit_action={action_handler}
                state={spGameState.current.instance.visualize(
                    current_player.get_pid(),
                )}
                restart_action={() => {
                    spGameState.current.restart();
                    rerender();
                }}
            />
        </>
    );
}

export default SinglePlayer;

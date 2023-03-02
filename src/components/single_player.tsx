import type {
    TableState,
    TableStateAction,
    VisualPlayerState,
    VisualTableState,
} from "../scripts/table_state";
import { error, range, tuple_zip } from "functional-utilities";
import Table from "./table";
import { useState } from "react";
import { v4 } from "uuid";
import {
    type PlayerData,
    compute_next_state,
    generate_game,
} from "../scripts/game";
import { CardId } from "../scripts/cards";

type ExtraData = {
    name: string;
};

function create_table_state() {
    
}

function SinglePlayer(props: { id: string }) {
    const [playerData, setPlayerData] = useState<PlayerData<ExtraData>[]>(
        range(8).map((i) => ({
            extra: {
                name: `Player ${i}`,
            },
            id: v4(),
            remainingChips: 1000,
        }))
    );
    const game = generate_game(playerData, props.id);
    const [tableState, setTableState] = useState<TableState>({
        betIncreaseIndex: game.betIncreaseIndex,
        centerCards: game.centerCards as CardId[],
        centerRevealAmount: game.centerRevealAmount,
        currentPlayerIndex: game.currentPlayerIndex,
        id: game.id,
        players: game.players.map((p) => ({
            bet: p.bet,
            chip_amount: p.chip_amount,
            folded: p.folded,
            card1: p.card1,
            card2: p.card2,
            id: p.id,
            name: p.extra.name,
        })),
        pot: game.pot,
    });
    const [gameActive, setGameActive] = useState(true);
    function action_handler(action: TableStateAction) {
        const { state: new_state, end_of_game: end_of_round } =
            compute_next_state(tableState, action);
        setTableState(new_state);
        setGameActive(!end_of_round);
        if (end_of_round) {
            setPlayerData((playerData) =>
                tuple_zip([playerData, new_state.players]).map(
                    ([player, new_player]) => ({
                        ...player,
                        remainingChips: new_player.chip_amount,
                    })
                )
            );
            setTimeout(() => {
                setTableState(() => generate_game(playerData, props.id));
                setGameActive(true);
            }, 3000);
        }
    }
    function create_visual_player_state(
        player: TableState["players"][number],
        index: number,
        end_of_round: boolean
    ): VisualPlayerState {
        const you = index === tableState.currentPlayerIndex;
        return {
            you,
            turn: you && !end_of_round, // Because it's single player, you are always the current player
            remainingChips: (
                playerData.find((p) => p.id === player.id) ??
                error("Player data not found")
            ).remainingChips,
            hand: player.folded
                ? "folded"
                : player.hand.map((card) =>
                      you || end_of_round ? card : "hidden"
                  ),
            bet: player.bet,
            id: player.id,
            name: player.name,
        };
    }
    function create_visual_table_state(
        tableState: TableState,
        end_of_round: boolean
    ): VisualTableState {
        const table = {
            centerCards: tableState.centerCards.map((card, i) =>
                i < tableState.centerRevealAmount ? card : "hidden"
            ),
            players: tableState.players.map((p, i) =>
                create_visual_player_state(p, i, end_of_round)
            ),
            id: tableState.id,
            pot: tableState.pot,
            end_of_round,
        } satisfies VisualTableState;
        return table;
    }

    return (
        <div className="flex w-full">
            <Table
                submit_action={action_handler}
                state={create_visual_table_state(tableState, !gameActive)}
            />
            {/* <div className="w-[300px] text-xs">
                <p>State</p>
                <pre>{JSON.stringify(tableState, null, 2)}</pre>
            </div> */}
        </div>
    );
}

export default SinglePlayer;

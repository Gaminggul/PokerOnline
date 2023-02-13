import type {
    PlayerState,
    TableState,
    TableStateAction,
    VisualPlayerState,
    VisualTableState,
} from "../scripts/table_state";
import { error, range } from "functional-utilities";
import Table from "./table";
import { create_deck } from "../scripts/create_deck";
import { get_combination, type CardId } from "../scripts/cards";
import { cloneDeep, max, min, sum } from "lodash-es";
import { useState } from "react";

interface PlayerData {
    name: string;
    remainingChips: number;
}

function generate_game(
    player_data: PlayerData[],
    table_id: string
): TableState {
    const deck = create_deck();
    if (player_data.length > 10) {
        throw new Error("Too many players");
    }
    const small_blind_value = 5;
    const players = player_data.map((player, i) => {
        return {
            name: player.name,
            bet:
                i === 0
                    ? small_blind_value
                    : i === 1
                    ? small_blind_value * 2
                    : 0,
            //hand: ["spades_10", "hearts_9"],
            hand: deck.splice(0, 2),
            folded: false,
        } satisfies PlayerState;
    });

    const centerCards: CardId[] = deck.splice(0, 5);
    // [
    //     "diamonds_queen",
    //     "clubs_king",
    //     "spades_jack",
    //     "spades_5",
    //     "clubs_queen",
    // ];

    return {
        players,
        centerCards,
        centerRevealAmount: 0,
        currentPlayerIndex: 2 % players.length,
        requireBetRound: false,
        end_of_round: false,
        deck,
        tableId: table_id,
        pot: 0,
    };
}

function get_winners(state: TableState): PlayerState[] | undefined {
    // winners are the players with the same highest score
    // There will only be one winner most of the time
    const possible_winners = state.players.filter((player) => !player.folded);
    const win_score =
        max(
            possible_winners.map((player) => {
                const combination = get_combination(
                    player.hand.concat(state.centerCards)
                );
                return combination.type === "none"
                    ? 0
                    : combination.base_score * 100 + combination.score;
            })
        ) ?? 0;
    const winners = possible_winners.filter((player) => {
        const combination = get_combination(
            player.hand.concat(state.centerCards)
        );
        return (
            combination.type !== "none" &&
            combination.base_score * 100 + combination.score === win_score
        );
    });
    if (winners.length === 0) {
        return undefined;
    } else {
        return winners;
    }
}

function min_bet(state: Readonly<TableState>): number {
    return max(state.players.filter((p) => !p.folded).map((p) => p.bet)) ?? 0;
}

function current_player_ref(
    state: TableState,
    player_data: PlayerData[]
): {
    state_ref: PlayerState;
    player_data_ref: PlayerData;
} {
    const player_state = state.players[state.currentPlayerIndex];
    if (!player_state) {
        throw new Error("Current player is undefined");
    }
    const player_data_ref = player_data.find(
        (player) => player.name === player_state.name
    );
    if (!player_data_ref) {
        throw new Error("Player data is undefined");
    }
    return { state_ref: player_state, player_data_ref };
}

function player_name_ref(
    state: TableState,
    playerData: PlayerData[],
    name: string
): {
    state_ref: PlayerState;
    player_data_ref: PlayerData;
} {
    const player_state = state.players.find((player) => player.name === name);
    if (!player_state) {
        throw new Error("Current player is undefined");
    }
    const player_data_ref = playerData.find(
        (player) => player.name === player_state.name
    );
    if (!player_data_ref) {
        throw new Error("Player data is undefined");
    }
    return { state_ref: player_state, player_data_ref };
}

function compute_next_state(
    originalState: Readonly<TableState>,
    originalPlayerData: Readonly<PlayerData[]>,
    action: Readonly<TableStateAction>
): {
    state: TableState;
    playerData: PlayerData[];
} {
    let state = cloneDeep(originalState) as TableState;
    let playerData = cloneDeep(originalPlayerData) as PlayerData[];

    {
        if (action.type === "bet") {
            if (state.currentPlayerIndex !== 0 && action.bet > min_bet(state)) {
                state.requireBetRound = true;
            }
            current_player_ref(state, playerData).state_ref.bet = action.bet;
        } else if (action.type === "fold") {
            current_player_ref(state, playerData).state_ref.folded = true;
        }
    }

    ({ state, playerData } = compute_next_player(state, playerData));
    const is_inactive = (ref: {
        state_ref: PlayerState;
        player_data_ref: PlayerData;
    }) => {
        return (
            ref.state_ref.folded ||
            ref.player_data_ref.remainingChips - ref.state_ref.bet <= 0
        );
    };
    while (
        (() => {
            return (
                is_inactive(current_player_ref(state, playerData)) ||
                playerData.filter(
                    (p) =>
                        !is_inactive(player_name_ref(state, playerData, p.name))
                ).length <= 1
            );
        })() &&
        !state.end_of_round
    ) {
        ({ state, playerData } = compute_next_player(state, playerData));
    }

    return { state, playerData };
}

function compute_next_player(
    originalState: Readonly<TableState>,
    originalPlayerData: Readonly<PlayerData[]>
): {
    state: TableState;
    playerData: PlayerData[];
} {
    let state = cloneDeep(originalState) as TableState;
    let playerData = cloneDeep(originalPlayerData) as PlayerData[];
    state.currentPlayerIndex =
        (state.currentPlayerIndex + 1) % state.players.length;

    if (state.players.filter((p) => !p.folded).length <= 1) {
        ({ state, playerData } = compute_end_of_round(state, playerData));
    } else if (state.currentPlayerIndex === 0) {
        ({ state, playerData } = compute_next_center(state, playerData));
    }
    return { state, playerData };
}

function compute_next_center(
    originalState: Readonly<TableState>,
    originalPlayerData: Readonly<PlayerData[]>
): {
    state: TableState;
    playerData: PlayerData[];
} {
    let state = cloneDeep(originalState) as TableState;
    let playerData = cloneDeep(originalPlayerData) as PlayerData[];
    if (state.requireBetRound) {
        state.requireBetRound = false;
    } else {
        state.players.map((p) => {
            state.pot += p.bet;
            player_name_ref(
                state,
                playerData,
                p.name
            ).player_data_ref.remainingChips -= p.bet;
            p.bet = 0;
        });
        if (state.centerRevealAmount === 0) {
            state.centerRevealAmount = 3;
        } else {
            state.centerRevealAmount++;
        }
        if (state.centerRevealAmount === 6) {
            state.centerRevealAmount = 5;
            ({ state, playerData } = compute_end_of_round(state, playerData));
        }
    }
    return { state, playerData };
}

// setTimeout(() => {
//     setTableState(() => generate_game(playerData, props.tableId));
// }, 5000);

function compute_end_of_round(
    originalState: Readonly<TableState>,
    originalPlayerData: Readonly<PlayerData[]>
): { state: TableState; playerData: PlayerData[] } {
    const state = cloneDeep(originalState) as TableState;
    const playerData = cloneDeep(originalPlayerData) as PlayerData[];

    state.centerRevealAmount = 5;
    state.end_of_round = true;

    const winners = get_winners(state);
    if (winners) {
        // take away the bet from the players
        const active_players = state.players.filter((player) => !player.folded);
        // give the pot to the winners
        const winner_pot = state.pot / winners.length;
        winners.forEach((winner) => {
            player_name_ref(
                state,
                playerData,
                winner.name
            ).player_data_ref.remainingChips += winner_pot;
        });
    }
    return { state, playerData };
}

function SinglePlayer(props: { tableId: string }) {
    const [playerData, setPlayerData] = useState<PlayerData[]>(
        range(8).map((i) => ({
            name: `Player ${i}`,
            remainingChips: 1000,
        }))
    );
    const [tableState, setTableState] = useState<TableState>(
        generate_game(playerData, props.tableId)
    );
    function action_handler(action: TableStateAction) {
        const { state: new_state, playerData: new_player_data } =
            compute_next_state(tableState, playerData, action);
        setTableState(new_state);
        setPlayerData(new_player_data);
        if (new_state.end_of_round) {
            setTimeout(() => {
                setTableState(() => generate_game(playerData, props.tableId));
            }, 3000);
        }
    }
    function create_visual_player_state(
        player: TableState["players"][number],
        index: number
    ): VisualPlayerState {
        const you = index === tableState.currentPlayerIndex;
        return {
            ...player,
            you,
            turn: you && !tableState.end_of_round, // Because it's single player, you are always the current player
            remainingChips: (
                playerData.find((p) => p.name === player.name) ??
                error("Player data not found")
            ).remainingChips,
            hand: player.folded
                ? "folded"
                : player.hand.map((card) =>
                      you || tableState.end_of_round ? card : "hidden"
                  ),
        };
    }
    function create_visual_table_state(
        tableState: TableState
    ): VisualTableState {
        const table = {
            centerCards: tableState.centerCards.map((card, i) =>
                i < tableState.centerRevealAmount ? card : "hidden"
            ),
            players: tableState.players.map(create_visual_player_state),
            tableId: tableState.tableId,
            end_of_round: tableState.end_of_round,
            pot: tableState.pot,
        } satisfies VisualTableState;
        return table;
    }

    return (
        <div className="flex w-full">
            <Table
                submit_action={action_handler}
                state={create_visual_table_state(tableState)}
            />
            {/* <div className="w-[300px] text-xs">
                <p>State</p>
                <pre>{JSON.stringify(tableState, null, 2)}</pre>
            </div> */}
        </div>
    );
}

export default SinglePlayer;

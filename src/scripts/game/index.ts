
import { z } from "zod";
import { CardIdSchema } from "../card_tuple";

import { create_deck } from "../create_deck";
import { get_combination, type CardId } from "../cards";
import { cloneDeep, max } from "lodash-es";

import type {
    PlayerState,
    TableState,
    TableStateAction,
} from "../table_state";
import { error } from "functional-utilities";

export interface PlayerData {
    name: string;
    id: string;
    remainingChips: number;
}


export function generate_game(
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
            hand: z
                .tuple([CardIdSchema, CardIdSchema])
                .parse(deck.splice(0, 2)),
            chip_amount: player.remainingChips,
            folded: false,
            id: player.id,
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
        betIncreaseIndex: 0,
        id: table_id,
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

function current_player(
    state: TableState,
): PlayerState {
    const player_state = state.players[state.currentPlayerIndex];
    if (!player_state) {
        throw new Error("Invalid player index");
    }

    return player_state;
}

function by_player_id(
    state: TableState,
    id: string
): PlayerState | undefined {
    const player_state = state.players.find((player) => player.id === id);
    if (!player_state) {
        return undefined;
    }
    return player_state;
}

export function compute_next_state(
    originalState: Readonly<TableState>,
    action: Readonly<TableStateAction>
): {
    state: TableState;
    end_of_game: boolean;
} {
    let state = cloneDeep(originalState) as TableState;

    {
        if (action.type === "bet") {
            if (state.currentPlayerIndex !== 0 && action.bet > min_bet(state)) {
                state.betIncreaseIndex = state.currentPlayerIndex;
            }
            current_player(state).bet = action.bet;
        } else if (action.type === "fold") {
            current_player(state).folded = true;
        }
    }
    let end_of_round = false;
    ({ state, end_of_round } = compute_next_player(
        state,
    ));
    const is_inactive = (player: PlayerState) => {
        return (
            player.folded ||
            player.chip_amount - player.bet <= 0
        );
    };
    while (
        (() => {
            return (
                is_inactive(current_player(state)) ||
                state.players.filter(
                    (p) =>
                        !is_inactive(by_player_id(state, p.id) ?? error("Invalid player id"))
                ).length <= 1
            );
        })() &&
        !end_of_round
    ) {
        ({ state, end_of_round } = compute_next_player(
            state,
        ));
    }

    return { state, end_of_game: end_of_round };
}

function compute_next_player(
    originalState: Readonly<TableState>,
): {
    state: TableState;
    end_of_round: boolean;
} {
    let state = cloneDeep(originalState) as TableState;
    let end_of_round = false;
    state.currentPlayerIndex =
        (state.currentPlayerIndex + 1) % state.players.length;

    if (state.players.filter((p) => !p.folded).length <= 1) {
        state = compute_end_of_round(state);
        end_of_round = true;
    } else if (state.currentPlayerIndex === 0) {
        state = compute_next_center(state);
    }
    return { state, end_of_round };
}

function compute_next_center(
    originalState: Readonly<TableState>,
): TableState {
    let state = cloneDeep(originalState) as TableState;
    if (state.betIncreaseIndex !== 0) {
        state.betIncreaseIndex = 0;
    } else {
        state.players.map((p) => {
            state.pot += p.bet;
            p.chip_amount -= p.bet;
            p.bet = 0;
        });
        if (state.centerRevealAmount === 0) {
            state.centerRevealAmount = 3;
        } else {
            state.centerRevealAmount++;
        }
        if (state.centerRevealAmount === 6) {
            state.centerRevealAmount = 5;
            state = compute_end_of_round(state);
        }
    }
    return state;
}

// setTimeout(() => {
//     setTableState(() => generate_game(playerData, props.tableId));
// }, 5000);

function compute_end_of_round(
    originalState: Readonly<TableState>,
): TableState {
    const state = cloneDeep(originalState) as TableState;

    state.centerRevealAmount = 5;

    const winners = get_winners(state);
    if (winners) {
        // give the pot to the winners
        const winner_pot = state.pot / winners.length;
        winners.forEach((winner) => {
            winner.chip_amount += winner_pot;
        });
    }
    return state;
}

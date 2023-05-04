import { create_deck } from "../create_deck";
import { get_combination, type CardId } from "../cards";
import { cloneDeep, max } from "lodash-es";

import type { GamePlayerData, GameData, PlayerAction } from "../game_data";
import { panic } from "functional-utilities";
import dayjs from "dayjs";

export function generate_game(
    user_data: { id: string; chip_amount: number }[],
    table_id: string
): GameData {
    const deck = create_deck();
    if (user_data.length > 10) {
        throw new Error("Too many players");
    }
    const small_blind_value = 5;
    const players = user_data.map((user, i) => {
        return {
            bet:
                i === 0
                    ? small_blind_value
                    : i === 1
                    ? small_blind_value * 2
                    : 0,
            //hand: ["spades_10", "hearts_9"],
            card1: deck.pop() ?? panic("No more cards"),
            card2: deck.pop() ?? panic("No more cards"),
            folded: false,
            id: user.id,
            chip_amount: user.chip_amount,
        } satisfies GamePlayerData;
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
        players: players,
        centerCards,
        centerRevealAmount: 0,
        currentPlayerIndex: 2 % players.length,
        betIncreaseIndex: 0,
        id: table_id,
        pot: 0,
        restartAt: undefined,
    };
}

function get_winners(state: GameData): GamePlayerData[] | undefined {
    // winners are the players with the same highest score
    // There will only be one winner most of the time
    const possible_winners = state.players.filter((player) => !player.folded);
    const win_score =
        max(
            possible_winners.map((player) => {
                const combination = get_combination(
                    [player.card1, player.card2].concat(state.centerCards)
                );
                return combination.type === "none"
                    ? 0
                    : combination.base_score * 100 + combination.score;
            })
        ) ?? 0;
    const winners = possible_winners.filter((player) => {
        const combination = get_combination(
            [player.card1, player.card2].concat(state.centerCards)
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

function min_bet(state: Readonly<GameData>): number {
    return max(state.players.filter((p) => !p.folded).map((p) => p.bet)) ?? 0;
}

function current_player(state: GameData): GamePlayerData {
    const player_state = state.players[state.currentPlayerIndex];
    if (!player_state) {
        throw new Error("Invalid player index");
    }

    return player_state;
}

function by_player_id(state: GameData, id: string): GamePlayerData | undefined {
    const player_state = state.players.find((player) => player.id === id);
    if (!player_state) {
        return undefined;
    }
    return player_state;
}

export function compute_next_state(
    originalState: Readonly<GameData>,
    action: Readonly<PlayerAction>
): GameData {
    let state = cloneDeep(originalState) as GameData;

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
    state = compute_next_player(state);
    const is_inactive = (player: GamePlayerData) => {
        return player.folded || player.chip_amount - player.bet <= 0;
    };
    while (
        (() => {
            return (
                is_inactive(current_player(state)) ||
                state.players.filter(
                    (p) =>
                        !is_inactive(
                            by_player_id(state, p.id) ??
                                panic("Invalid player id")
                        )
                ).length <= 1
            );
        })() &&
        !state.restartAt
    ) {
        state = compute_next_player(state);
    }

    return state;
}

function compute_next_player(originalState: Readonly<GameData>): GameData {
    let state = cloneDeep(originalState) as GameData;
    state.currentPlayerIndex =
        (state.currentPlayerIndex + 1) % state.players.length;

    if (state.players.filter((p) => !p.folded).length <= 1) {
        state = compute_ended(state);
    } else if (state.currentPlayerIndex === 0) {
        state = compute_next_center(state);
    }
    return state;
}

function compute_next_center(originalState: Readonly<GameData>): GameData {
    let state = cloneDeep(originalState) as GameData;
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
            state = compute_ended(state);
        }
    }
    return state;
}

// setTimeout(() => {
//     setTableState(() => generate_game(playerData, props.tableId));
// }, 5000);

function compute_ended(originalState: Readonly<GameData>): GameData {
    const state = cloneDeep(originalState) as GameData;

    state.centerRevealAmount = 5;

    const winners = get_winners(state);
    if (winners) {
        // give the pot to the winners
        const winner_pot = state.pot / winners.length;
        winners.forEach((winner) => {
            winner.chip_amount += winner_pot;
        });
    }
    state.restartAt = dayjs().add(5, "second").toDate();
    return state;
}

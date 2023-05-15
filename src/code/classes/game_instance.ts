import { panic, pipe } from "functional-utilities";
import { get_combination, type CardId } from "../cards";
import type { PlayerAction, VisualGameState } from "../game_data";
import { cloneDeep, max } from "lodash-es";
import type { Player } from "../interfaces/player";
import { create_deck } from "../create_deck";
import { v4 } from "uuid";
import dayjs from "dayjs";

export type NewPlayerData = {
    bet: number;
    card1: CardId;
    card2: CardId;
    folded: boolean;
};

export class GameInstance<P extends Player> {
    id: string;
    centerCards: CardId[];
    centerRevealAmount: number;
    players: P[];
    currentPlayerIndex: number;
    betIncreaseIndex: number;
    pot: number;
    restartAt: Date | undefined;

    constructor(
        id: string,
        centerCards: CardId[],
        centerRevealAmount: number,
        players: P[],
        currentPlayerIndex: number,
        betIncreaseIndex: number,
        pot: number,
        restartAt?: Date
    ) {
        this.id = id;
        this.centerCards = centerCards;
        this.centerRevealAmount = centerRevealAmount;
        this.players = players;
        this.currentPlayerIndex = currentPlayerIndex;
        this.betIncreaseIndex = betIncreaseIndex;
        this.pot = pot;
        this.restartAt = restartAt;
    }

    static generate<U, P extends Player>(
        users: U[],
        init_player: (u: U, d: NewPlayerData, game_id: string) => P
    ): GameInstance<P> {
        const deck = create_deck();
        const small_blind_value = 5;
        const game_id = v4();
        const players = users.map((user, i) =>
            init_player(
                user,
                {
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
                } satisfies NewPlayerData,
                game_id
            )
        );

        const centerCards: CardId[] = deck.splice(0, 5);
        // [
        //     "diamonds_queen",
        //     "clubs_king",
        //     "spades_jack",
        //     "spades_5",
        //     "clubs_queen",
        // ];

        return new GameInstance(
            game_id,
            centerCards,
            0,
            players,
            2 % players.length,
            0,
            0
        );
    }

    get_current_player(): P {
        return (
            this.players[this.currentPlayerIndex] ?? panic("No current player")
        );
    }

    get_player(pid: string): P | undefined {
        return this.players.find((p) => p.get_pid() === pid);
    }

    is_current_player(pid: string): boolean {
        return this.get_current_player().get_pid() === pid;
    }

    clone(): GameInstance<P> {
        return cloneDeep(this);
    }

    active_players(): P[] {
        return this.players.filter(
            (p) =>
                !p.is_folded() && p.get_chip_amount() - p.get_current_bet() > 0
        );
    }

    min_bet(): number {
        return max(this.active_players().map((p) => p.get_current_bet())) ?? 0;
    }

    action(action: PlayerAction, pid: string): GameInstance<P> {
        if (!this.is_current_player(pid)) {
            throw new Error("Not your turn");
        }
        return this.force_action(action, pid);
    }

    force_action(action: PlayerAction, pid: string): GameInstance<P> {
        const new_state = this.clone();
        if (action.type === "bet") {
            if (
                new_state.currentPlayerIndex !== 0 &&
                action.bet > new_state.min_bet()
            ) {
                new_state.betIncreaseIndex = new_state.currentPlayerIndex;
            }
            (
                new_state.get_player(pid) ?? panic("Invalid Player id")
            ).update_current_bet(action.bet);
        } else if (action.type === "fold") {
            (new_state.get_player(pid) ?? panic("Invalid Player id")).fold();
        }
        return new_state.compute_next_player();
    }

    compute_next_player(): GameInstance<P> {
        const new_state = this.clone();
        new_state.next_player();
        while (
            (() => {
                return (
                    new_state.get_current_player().is_folded() ||
                    new_state.get_current_player().get_chip_amount() -
                        new_state.get_current_player().get_current_bet() <=
                        0 ||
                    new_state.active_players().length <= 1
                );
            })() &&
            !new_state.restartAt
        ) {
            new_state.next_player();
        }
        return new_state;
    }

    private next_player(): void {
        this.currentPlayerIndex =
            (this.currentPlayerIndex + 1) % this.players.length;

        if (this.currentPlayerIndex !== 0) {
            return;
        }

        if (this.betIncreaseIndex !== 0) {
            this.betIncreaseIndex = 0;
        } else {
            this.players.map((p) => {
                this.pot += p.get_current_bet();
                p.update_chip_amount(p.get_chip_amount() - p.get_current_bet());
                p.update_current_bet(0);
            });
            if (this.centerRevealAmount === 0) {
                this.centerRevealAmount = 3;
            } else {
                this.centerRevealAmount++;
            }
            if (this.centerRevealAmount === 6) {
                this.centerRevealAmount = 5;
                this.end_game();
            }
        }
    }

    get_winners(): P[] {
        let possible_winners = this.players
            .filter((player) => !player.is_folded())
            .map((p) => ({
                player: p,
                combination: pipe(
                    get_combination(p.get_cards().concat(this.centerCards)),
                    (v) => {
                        if (v.type === "none") {
                            return { base_score: 0, score: 0 };
                        } else {
                            return v;
                        }
                    }
                ),
            }));
        const req_base_score =
            max(possible_winners.map((p) => p.combination.base_score)) ?? 0;
        possible_winners = possible_winners.filter(
            (p) => p.combination.base_score >= req_base_score
        );
        const req_score =
            max(possible_winners.map((p) => p.combination.score)) ?? 0;
        possible_winners = possible_winners.filter(
            (p) => p.combination.score >= req_score
        );

        return possible_winners.map((p) => p.player);
    }

    end_game(): void {
        this.centerRevealAmount = 5;
        const winners = this.get_winners();
        const winner_pot = this.pot / winners.length;
        winners.forEach((p) => {
            p.update_chip_amount(p.get_chip_amount() + winner_pot);
        });
        this.restartAt = dayjs().add(5, "second").toDate();
    }

    is_spectating(pid: string): boolean {
        return !this.players.some((p) => p.get_pid() === pid);
    }

    has_ended(): boolean {
        return !!this.restartAt;
    }

    visualize(pid: string): VisualGameState {
        const spectating = this.is_spectating(pid);
        const ended = this.has_ended();
        return {
            centerCards: this.centerCards.map((c, i) =>
                i < this.centerRevealAmount ? c : "hidden"
            ),
            players: this.players.map((p, i) => {
                const you = p.get_pid() === pid;
                const show = you || spectating || ended;
                const [card1, card2] = p.get_cards();
                return {
                    bet: p.get_current_bet(),
                    folded: p.is_folded(),
                    card1: show ? card1 : "hidden",
                    card2: show ? card2 : "hidden",
                    name: p.get_name(),
                    remainingChips: p.get_chip_amount(),
                    turn: i === this.currentPlayerIndex,
                    you,
                    id: p.get_pid(),
                };
            }),
            pot: this.pot,
            id: this.id,
            restartAt: this.restartAt ? this.restartAt.getTime() : undefined,
        };
    }
}

import {
    type NonEmptyArray,
    isNonEmptyArray,
    panic,
    pipe,
} from "functional-utilities";
import { get_combination, type CardId } from "../cards";
import type { PlayerAction, VisualGameState } from "../game_data";
import { max } from "lodash-es";
import type { Player } from "../interfaces/player";
import { create_deck } from "../create_deck";
import dayjs from "dayjs";
import { z } from "zod";
import type { GetProperties } from "../../utils/get_properties";
import { PlayerState } from "@prisma/client";

export type NewPlayerData = {
    bet: number;
    card1: CardId;
    card2: CardId;
    state: PlayerState;
    had_turn: boolean;
};

export const GameVariantsSchema = z.union([
    z.literal("texas_holdem"),
    z.literal("async_texas_holdem"),
]);

export type GameVariants = z.infer<typeof GameVariantsSchema>;

export class GameInstance<P extends Player> {
    id: string;
    centerCards: CardId[];
    centerRevealAmount: number;
    players: NonEmptyArray<P>;
    pot: number;
    restartAt: Date | undefined;
    variant: GameVariants;

    constructor(props: GetProperties<GameInstance<P>>) {
        this.id = props.id;
        this.centerCards = props.centerCards;
        this.centerRevealAmount = props.centerRevealAmount;
        this.players = props.players;
        this.variant = props.variant;
        this.pot = props.pot;
        this.restartAt = props.restartAt;
    }

    static generate<U, P extends Player>(
        game_id: string,
        users: NonEmptyArray<U>,
        variant: GameVariants,
        init_player: (u: U, d: NewPlayerData, game_id: string) => P
    ): GameInstance<P> {
        const deck = create_deck();
        const small_blind_value = 5;
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
                    state: 'active',
                    had_turn: false,
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

        return new GameInstance({
            id: game_id,
            centerCards,
            centerRevealAmount: 0,
            players: players,
            variant,
            pot: 0,
            restartAt: undefined,
        });
    }

    get_player(pid: string): P | undefined {
        return this.players.find((p) => p.get_pid() === pid);
    }

    get_player_index(pid: string): number | undefined {
        const index = this.players.findIndex((p) => p.get_pid() === pid);
        return index === -1 ? undefined : index;
    }

    clone(): GameInstance<P> {
        return new GameInstance(this);
    }

    is_active(pid: string): boolean {
        const p = this.get_player(pid) ?? panic(`Player ${pid} not found`);
        return (p.get_state() !== 'folded') && p.get_chip_amount() - p.get_current_bet() > 0;
    }

    active_players(): P[] {
        return this.players.filter((p) => this.is_active(p.get_pid()));
    }

    remove_player(pid: string): GameInstance<P> {
        const new_instance = this.force_action({ type: "fold" }, pid);
        return new_instance;
    }

    min_bet(): number {
        return max(this.active_players().map((p) => p.get_current_bet())) ?? 0;
    }

    awaited_players(): P[] {
        const min_bet = this.min_bet();
        return this.active_players().filter(
            (p) => !p.get_had_turn() || p.get_current_bet() < min_bet
        );
    }

    action(action: PlayerAction, pid: string): GameInstance<P> {
        if (this.variant === "texas_holdem") {
            const current_player = this.awaited_players()[0];
            if (!current_player) {
                throw new Error("No more turns this round");
            }
            if (pid !== current_player.get_pid()) {
                throw new Error("Not your turn");
            }
        }
        return this.force_action(action, pid);
    }

    force_action(action: PlayerAction, pid: string): GameInstance<P> {
        const new_state = this.clone();
        const p = new_state.get_player(pid) ?? panic("Invalid Player id");
        if (action.type === "bet") {
            if (action.bet < new_state.min_bet()) {
                throw new Error("Bet too low");
            }
            p.set_had_turn(true);
            p.update_current_bet(action.bet);
        } else if (action.type === "fold") {
            p.fold();
        }

        const awaited_players = new_state.awaited_players();

        if (awaited_players.length !== 0) {
            return new_state;
        }

        new_state.players.forEach((p) => {
            new_state.pot += p.get_current_bet();
            p.update_chip_amount(p.get_chip_amount() - p.get_current_bet());
            p.update_current_bet(0);
            p.set_had_turn(false);
        });

        if (new_state.centerRevealAmount === 0) {
            new_state.centerRevealAmount = 3;
        } else {
            new_state.centerRevealAmount++;
        }
        if (
            new_state.centerRevealAmount === 6 ||
            new_state.active_players().length <= 1
        ) {
            new_state.centerRevealAmount = 5;
            new_state.end_game();
        }

        return new_state;
    }

    get_winners(): P[] {
        let possible_winners = this.active_players().map((p) => ({
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

        return possible_winners.map((v) => v.player);
    }

    end_game(): void {
        this.centerRevealAmount = 5;
        const winners = this.get_winners();
        if (isNonEmptyArray(winners)) {
            const winner_pot = this.pot / winners.length;
            winners.forEach((p) => {
                p.update_chip_amount(p.get_chip_amount() + winner_pot);
            });
        } else {
            console.warn(
                "There are no winners, this means something likely went wrong, voiding the pot",
                JSON.stringify(this, null, 2)
            );
        }
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
            players: this.players.map((p) => {
                const you = p.get_pid() === pid;
                const show = you || spectating || ended;
                const [card1, card2] = p.get_cards();
                return {
                    bet: p.get_current_bet(),
                    card1: show ? card1 : "hidden",
                    card2: show ? card2 : "hidden",
                    name: p.get_name(),
                    remainingChips: p.get_chip_amount(),
                    turn:
                        this.variant === "texas_holdem"
                            ? this.awaited_players()[0]?.get_pid() ===
                              p.get_pid()
                            : this.awaited_players()
                                  .map((p) => p.get_pid())
                                  .includes(p.get_pid()),
                    you,
                    id: p.get_pid(),
                    state: p.get_state(),
                };
            }),
            pot: this.pot,
            id: this.id,
            restartAt: this.restartAt ? this.restartAt.getTime() : undefined,
        };
    }
}

import type { GameVariants } from "./game_instance";
import { GameInstance } from "./game_instance";
import type { GameState, Player } from "../interfaces/player";
import { CardIdSchema } from "../card_tuple";
import { type CardId } from "../cards";
import type { PlayerAction } from "../game_data";
import type { NonEmptyArray } from "functional-utilities";
import { type BotConfig } from "../bot";
import { type GetProperties } from "../../utils/get_properties";
import { PlayerState } from "@prisma/client";

export class SPPlayer implements Player {
    id: string;
    card1: CardId;
    card2: CardId;
    state: PlayerState;
    chip_amount: number;
    bet: number;
    gameId: string;
    had_turn: boolean;
    name: string;
    bot: BotConfig | undefined;

    constructor(data: GetProperties<SPPlayer>) {
        this.id = data.id;
        this.card1 = data.card1;
        this.card2 = data.card2;
        this.state = data.state;
        this.chip_amount = data.chip_amount;
        this.bet = data.bet;
        this.gameId = data.gameId;
        this.had_turn = data.had_turn;
        this.name = data.name;
        this.bot = data.bot;
    }

    get_pid(): string {
        return this.id;
    }

    get_name(): string {
        return this.name;
    }

    get_state(): PlayerState {
        return this.state;
    }

    get_chip_amount(): number {
        return this.chip_amount;
    }

    get_current_bet(): number {
        return this.bet;
    }

    update_chip_amount(amount: number): void {
        this.chip_amount = amount;
    }

    update_current_bet(amount: number): void {
        this.bet = amount;
    }

    fold(): void {
        this.state = "folded";
    }

    get_cards(): [CardId, CardId] {
        return [CardIdSchema.parse(this.card1), CardIdSchema.parse(this.card2)];
    }

    get_had_turn(): boolean {
        return this.had_turn;
    }

    set_had_turn(had_turn: boolean): void {
        this.had_turn = had_turn;
    }
}

const events = {
    on_start: () => {},
    on_end: () => {},
} satisfies typeof GameInstance.prototype.events;

export class SPGameState implements GameState<SPPlayer> {
    instance: GameInstance<SPPlayer>;

    constructor(instance: GameInstance<SPPlayer>) {
        this.instance = instance;
    }

    action(action: PlayerAction, pid: string) {
        this.instance.action(action, pid);
    }

    static generate(
        game_id: string,
        users: NonEmptyArray<{
            id: string;
            name: string;
            chips: number;
            bot: BotConfig | undefined;
        }>,
        variant: GameVariants,
    ): SPGameState {
        const new_instance = GameInstance.generate_new(
            game_id,
            users,
            variant,
            (user, data) =>
                new SPPlayer({
                    id: user.id,
                    card1: data.card1,
                    card2: data.card2,
                    state: data.state,
                    chip_amount: user.chips,
                    bet: data.bet,
                    gameId: game_id,
                    had_turn: data.had_turn,
                    name: user.name,
                    bot: user.bot,
                }),
            events,
        );
        return new SPGameState(new_instance);
    }

    restart() {
        this.instance.restart(
            this.instance.current_game_state.players,
            (u, data) =>
                new SPPlayer({
                    id: u.id,
                    card1: data.card1,
                    card2: data.card2,
                    state: data.state,
                    chip_amount: u.chip_amount,
                    bet: data.bet,
                    gameId: this.instance.id,
                    had_turn: data.had_turn,
                    name: u.name,
                    bot: u.bot,
                }),
        );
    }
}

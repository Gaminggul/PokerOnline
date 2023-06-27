import type { GameVariants } from "./game_instance";
import { GameInstance } from "./game_instance";
import type { GameState, Player } from "../interfaces/player";
import { CardIdSchema } from "../card_tuple";
import { type CardId } from "../cards";
import type { PlayerAction } from "../game_data";
import { v4 } from "uuid";
import type { NonEmptyArray } from "functional-utilities";

export class SPPlayer implements Player {
    id: string;
    card1: CardId;
    card2: CardId;
    folded: boolean;
    chip_amount: number;
    bet: number;
    gameId: string;
    had_turn: boolean;
    name: string;

    constructor(
        id: string,
        card1: string,
        card2: string,
        folded: boolean,
        chip_amount: number,
        bet: number,
        gameId: string,
        had_turn: boolean,
        name: string
    ) {
        this.id = id;
        this.card1 = CardIdSchema.parse(card1);
        this.card2 = CardIdSchema.parse(card2);
        this.folded = folded;
        this.chip_amount = chip_amount;
        this.bet = bet;
        this.gameId = gameId;
        this.had_turn = had_turn;
        this.name = name;
    }

    get_pid(): string {
        return this.id;
    }

    get_name(): string {
        return this.id;
    }

    is_folded(): boolean {
        return this.folded;
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
        this.folded = true;
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

export class SPGameState implements GameState<SPPlayer> {
    instance: GameInstance<SPPlayer>;

    constructor(instance: GameInstance<SPPlayer>) {
        this.instance = instance;
    }

    action(action: PlayerAction, pid: string): SPGameState {
        const new_instance = this.instance.action(action, pid);
        return new SPGameState(new_instance);
    }

    static generate(
        game_id: string,
        users: NonEmptyArray<{ id: string; name: string; chips: number }>,
        variant: GameVariants
    ): SPGameState {
        const new_instance = GameInstance.generate(
            game_id,
            users,
            variant,
            (user, data) =>
                new SPPlayer(
                    user.id,
                    data.card1,
                    data.card2,
                    data.folded,
                    100,
                    data.bet,
                    game_id,
                    data.had_turn,
                    user.name
                )
        );
        return new SPGameState(new_instance);
    }

    restart(): SPGameState {
        return new SPGameState(
            GameInstance.generate(
                v4(),
                this.instance.players,
                this.instance.variant,
                (u, data, game_id) =>
                    new SPPlayer(
                        u.id,
                        data.card1,
                        data.card2,
                        data.folded,
                        u.chip_amount,
                        data.bet,
                        game_id,
                        data.had_turn,
                        u.name
                    )
            )
        );
    }
}

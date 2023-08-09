import { PlayerState } from "@prisma/client";
import { type CardId } from "../cards";
import { type GameInstance } from "../classes/game_instance";

export interface Player {
    get_pid(): string;
    get_name(): string;
    get_state(): PlayerState;
    get_chip_amount(): number;
    get_current_bet(): number;
    update_chip_amount(amount: number): void;
    update_current_bet(amount: number): void;
    fold(): void;
    get_cards(): [CardId, CardId];
    set_had_turn(had_turn: boolean): void;
    get_had_turn(): boolean;
}

export interface GameState<T extends Player> {
    instance: GameInstance<T>;
}
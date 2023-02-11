import type { CardId } from "./cards";

export interface VisualTableState {
    tableId: string;
    centerCards: (CardId | "hidden")[];
    pot: number;
    players: VisualPlayerState[]; // order matters
}

export interface VisualPlayerState {
    name: string;
    bet: number;
    you: boolean;
    turn: boolean;
    remainingChips: number;
    hand: (CardId | "hidden")[] | "folded";
}

export type TableStateAction = {
    type: "fold";
} | {
    type: "bet";
    bet: number;
}

export interface TableState {
    tableId: string;
    centerCards: CardId[];
    centerRevealAmount: number;
    players: PlayerState[];
    currentPlayerIndex: number;
    currentBet: number;
    pot: number;
    revealed: boolean;
    requireBetRound: boolean;
    deck: CardId[];
}

export interface PlayerState {
    name: string;
    bet: number;
    remainingChips: number;
    hand: CardId[];
    folded: boolean;
}

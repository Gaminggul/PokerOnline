import type { CardId } from "./cards";

export interface TableState {
    tableId: string;
    centerCards: (CardId | "hidden")[];
    players: PlayerState[]; // order matters
}

export interface PlayerState {
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
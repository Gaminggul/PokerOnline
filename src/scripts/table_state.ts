import type { CardId } from "./cards";

export interface VisualTableState {
    tableId: string;
    centerCards: (CardId | "hidden")[];
    end_of_round: boolean;
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

export type TableStateAction =
    | {
          type: "fold";
      }
    | {
          type: "bet";
          bet: number;
      };

export interface TableState {
    tableId: string;
    centerCards: CardId[];
    centerRevealAmount: number;
    players: PlayerState[];
    currentPlayerIndex: number;
    end_of_round: boolean;
    requireBetRound: boolean;
    pot: number;
    deck: CardId[];
}

export interface PlayerState {
    name: string;
    bet: number;
    hand: CardId[];
    folded: boolean;
}

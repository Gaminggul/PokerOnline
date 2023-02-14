import { z } from "zod";
import type { CardId } from "./cards";
import { CardIdSchema } from "./card_tuple";


export const VisualPlayerStateSchema = z.object({
    name: z.string(),
    bet: z.number(),
    you: z.boolean(),
    turn: z.boolean(),
    remainingChips: z.number(),
    hand: z.union([z.array(z.union([CardIdSchema, z.literal("hidden")])), z.literal("folded")]),
});

export type VisualPlayerState = z.infer<typeof VisualPlayerStateSchema>;


export const VisualTableStateSchema = z.object({
    tableId: z.string(),
    centerCards: z.array(z.union([CardIdSchema, z.literal("hidden")])),
    end_of_round: z.boolean(),
    pot: z.number(),
    players: VisualPlayerStateSchema.array(),
});

export type VisualTableState = z.infer<typeof VisualTableStateSchema>;

export const TableStateActionSchema = z.union([
    z.object({
        type: z.literal("fold"),
    }),
    z.object({
        type: z.literal("bet"),
        bet: z.number(),
    }),
]);

export type TableStateAction = z.infer<typeof TableStateActionSchema>;

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

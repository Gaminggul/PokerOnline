import { z } from "zod";
import type { CardId } from "./cards";
import { CardIdSchema } from "./card_tuple";

export const VisualPlayerStateSchema = z.object({
    id: z.string(),
    name: z.string(),
    bet: z.number(),
    you: z.boolean(),
    turn: z.boolean(),
    remainingChips: z.number(),
    hand: z.union([z.array(z.union([CardIdSchema, z.literal("hidden")])), z.literal("folded")]),
});

export type VisualPlayerState = z.infer<typeof VisualPlayerStateSchema>;


export const VisualTableStateSchema = z.object({
    id: z.string(),
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
    id: string;
    centerCards: CardId[];
    centerRevealAmount: number;
    players: PlayerState[];
    currentPlayerIndex: number;
    betIncreaseIndex: number;
    pot: number;
}

export interface PlayerState {
    id: string;
    name: string;
    hand: [CardId, CardId];
    folded: boolean;
    bet: number;
    chip_amount: number;
}
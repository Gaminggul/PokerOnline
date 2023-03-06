import { z } from "zod";
import type { CardId } from "./cards";
import { CardIdSchema } from "./card_tuple";

const VisualCardSchema = z.union([CardIdSchema, z.literal("hidden")]);

export const VisualPlayerStateSchema = z.object({
    id: z.string(),
    name: z.string(),
    bet: z.number(),
    you: z.boolean(),
    turn: z.boolean(),
    remainingChips: z.number(),
    card1: VisualCardSchema,
    card2: VisualCardSchema,
    folded: z.boolean(),
});

export type VisualPlayerState = z.infer<typeof VisualPlayerStateSchema>;

export const VisualGameStateSchema = z.object({
    id: z.string(),
    centerCards: z.array(z.union([CardIdSchema, z.literal("hidden")])),
    end_of_round: z.boolean(),
    pot: z.number(),
    players: VisualPlayerStateSchema.array(),
});

export type VisualGameState = z.infer<typeof VisualGameStateSchema>;

export const TableStateActionSchema = z.union([
    z.object({
        type: z.literal("fold"),
    }),
    z.object({
        type: z.literal("bet"),
        bet: z.number(),
    }),
]);

export type PlayerAction = z.infer<typeof TableStateActionSchema>;

export interface GameData {
    id: string;
    centerCards: CardId[];
    centerRevealAmount: number;
    players: GamePlayerData[];
    currentPlayerIndex: number;
    betIncreaseIndex: number;
    pot: number;
}

export interface GamePlayerData {
    id: string;
    card1: CardId;
    card2: CardId;
    folded: boolean;
    bet: number;
    chip_amount: number;
}

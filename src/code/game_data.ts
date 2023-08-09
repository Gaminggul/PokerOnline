import { z } from "zod";
import type { CardId } from "./cards";
import { CardIdSchema } from "./card_tuple";

const VisualCardSchema = z.union([CardIdSchema, z.literal("hidden")]);

export const PlayerStateSchema = z.union([
    z.literal("folded"),
    z.literal("allin"),
    z.literal("active"),
]);

export const VisualPlayerStateSchema = z.object({
    id: z.string(),
    name: z.string(),
    bet: z.number(),
    you: z.boolean(),
    turn: z.boolean(),
    remainingChips: z.number(),
    card1: VisualCardSchema,
    card2: VisualCardSchema,
    state: PlayerStateSchema,
});

export type VisualPlayerState = z.infer<typeof VisualPlayerStateSchema>;

export const VisualGameStateSchema = z.object({
    id: z.string(),
    centerCards: z.array(VisualCardSchema),
    pot: z.number(),
    players: VisualPlayerStateSchema.array(),
    restartAt: z.number().optional(),
});

export type VisualGameState = z.infer<typeof VisualGameStateSchema>;

export const VisualLobbyStateSchema = z.object({
    id: z.string(),
    name: z.string(),
    access: z.union([z.literal("public"), z.literal("private")]),
    ownerId: z.string().optional(),
    size: z.number(),
    users: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
        }),
    ),
    startAt: z.date().optional(),
    blindIndex: z.number(),
    game_started: z.boolean(),
    channel: z.string(),
});

export type VisualLobbyState = z.infer<typeof VisualLobbyStateSchema>;

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
    restartAt: Date | undefined;
}

export interface GamePlayerData {
    id: string;
    card1: CardId;
    card2: CardId;
    folded: boolean;
    bet: number;
    chip_amount: number;
}

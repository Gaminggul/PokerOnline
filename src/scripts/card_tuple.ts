import { z } from "zod";

export const CardIdSchema = z.union([
    z.literal("clubs_2"),
    z.literal("clubs_3"),
    z.literal("clubs_4"),
    z.literal("clubs_5"),
    z.literal("clubs_6"),
    z.literal("clubs_7"),
    z.literal("clubs_8"),
    z.literal("clubs_9"),
    z.literal("clubs_10"),
    z.literal("clubs_jack"),
    z.literal("clubs_queen"),
    z.literal("clubs_king"),
    z.literal("clubs_ace"),
    z.literal("diamonds_2"),
    z.literal("diamonds_3"),
    z.literal("diamonds_4"),
    z.literal("diamonds_5"),
    z.literal("diamonds_6"),
    z.literal("diamonds_7"),
    z.literal("diamonds_8"),
    z.literal("diamonds_9"),
    z.literal("diamonds_10"),
    z.literal("diamonds_jack"),
    z.literal("diamonds_queen"),
    z.literal("diamonds_king"),
    z.literal("diamonds_ace"),
    z.literal("hearts_2"),
    z.literal("hearts_3"),
    z.literal("hearts_4"),
    z.literal("hearts_5"),
    z.literal("hearts_6"),
    z.literal("hearts_7"),
    z.literal("hearts_8"),
    z.literal("hearts_9"),
    z.literal("hearts_10"),
    z.literal("hearts_jack"),
    z.literal("hearts_queen"),
    z.literal("hearts_king"),
    z.literal("hearts_ace"),
    z.literal("spades_2"),
    z.literal("spades_3"),
    z.literal("spades_4"),
    z.literal("spades_5"),
    z.literal("spades_6"),
    z.literal("spades_7"),
    z.literal("spades_8"),
    z.literal("spades_9"),
    z.literal("spades_10"),
    z.literal("spades_jack"),
    z.literal("spades_queen"),
    z.literal("spades_king"),
    z.literal("spades_ace"),
]);

export const CardIdsSchema = z.array(CardIdSchema);
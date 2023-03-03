import type { Game, Player, User } from "@prisma/client";
import { type VisualGameState } from "./game_data";
import { z } from "zod";
import { CardIdSchema } from "./card_tuple";
import { create_pusher_server } from "../server/pusher";

export type MultiPlayerGameState = Game & {
    players: (Player & {
        user: User;
    })[];
};

export function create_visual_game_state(
    game: MultiPlayerGameState,
    user_id: string,
    game_end: boolean
): VisualGameState {
    return {
        centerCards: z
            .array(CardIdSchema)
            .parse(game.centerCards)
            .map((c, i) => (i < game.centerRevealAmount ? c : "hidden")),
        players: game.players.map((p, i) => ({
            bet: p.bet,
            folded: p.folded,
            card1: CardIdSchema.parse(p.card1),
            card2: CardIdSchema.parse(p.card2),
            name: p.user.name,
            remainingChips: p.chip_amount,
            turn: i === game.currentPlayerIndex,
            you: p.id === user_id,
            id: p.id,
        })),
        end_of_round: game_end,
        pot: game.pot,
        id: game.id,
    };
}

export async function distribute_new_state(
    game: MultiPlayerGameState,
    end_of_round: boolean
) {
    const pusher = create_pusher_server();
    await pusher.triggerBatch(
        game.players.map((p) => ({
            channel: p.channel,
            name: "update",
            data: create_visual_game_state(game, p.id, end_of_round),
        }))
    );
}

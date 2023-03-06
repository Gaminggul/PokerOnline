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
    user_id: string
): VisualGameState {
    const spectating = !game.players.some((p) => p.id === user_id);
    const ended = game.ended;
    return {
        centerCards: z
            .array(CardIdSchema)
            .parse(game.centerCards)
            .map((c, i) => (i < game.centerRevealAmount ? c : "hidden")),
        players: game.players.map((p, i) => {
            const you = p.id === user_id;
            const show = you || spectating || ended;
            return {
                bet: p.bet,
                folded: p.folded,
                card1: show ? CardIdSchema.parse(p.card1) : "hidden",
                card2: show ? CardIdSchema.parse(p.card2) : "hidden",
                name: p.user.name,
                remainingChips: p.chip_amount,
                turn: i === game.currentPlayerIndex,
                you,
                id: p.id,
            };
        }),
        end_of_round: game.ended,
        pot: game.pot,
        id: game.id,
        ended,
    };
}

export async function distribute_new_state(game: MultiPlayerGameState) {
    const pusher = create_pusher_server();
    await pusher.triggerBatch(
        game.players.map((p) => ({
            channel: p.channel,
            name: "update",
            data: create_visual_game_state(game, p.id),
        }))
    );
}

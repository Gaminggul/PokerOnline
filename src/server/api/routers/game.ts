import { z } from "zod";
import {
    TableStateActionSchema,
    VisualTableState,
} from "../../../scripts/table_state";
import { prisma } from "../../db";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Game, Player, User } from "@prisma/client";
import { error, typed_from_entries } from "functional-utilities";
import { CardId } from "../../../scripts/cards";

import { create_pusher_server } from "../../pusher";

type CompleteGame = Game & {
    player: (Player & {
        User: User;
    })[];
};

function create_visual_game_state(
    game: CompleteGame,
    user_id: string,
    game_end: boolean
): VisualTableState {
    const player =
        game.player.find((p) => p.id === user_id) ??
        error("Searched for player that doesn't exist");
    return {
        centerCards: (game.centerCards as CardId[]).map((c, i) =>
            i < game.centerRevealAmount ? c : "hidden"
        ),
        players: game.player.map((p, i) => ({
            bet: p.bet_amount,
            folded: p.folded,
            hand: game_end
                ? p.folded
                    ? [p.card1 as CardId, p.card2 as CardId]
                    : "folded"
                : ["hidden", "hidden"],
            name: p.User.name,
            remainingChips: p.chip_amount,
            turn: i === game.currentPlayerIndex,
            you: p.id === user_id,
            id: p.id,
        })),
        end_of_round: game_end,
        pot: game.pot,
        tableId: game.id,
    };
}

async function distribute_new_state(table_id: string) {
    const game = await prisma.game.findUnique({
        where: {
            id: table_id,
        },
        include: {
            player: {
                include: {
                    User: true,
                },
            },
        },
    });
    if (!game) {
        return undefined;
    }
    const visual_states: Record<string, VisualTableState> = typed_from_entries(
        game.player.map((p) => [
            p.id,
            create_visual_game_state(game, p.id, false),
        ])
    );
    const pusher = create_pusher_server();
    pusher.triggerBatch(
        game.player.map((p) => ({
            channel: p.channel,
            name: "update",
            data: visual_states[p.id],
        }))
    );
}

export const gameRouter = createTRPCRouter({
    getChannelId: protectedProcedure
        .input(z.object({ tableId: z.string() }))
        .query(({ input }) => {
            return {
                channelId: "123",
            };
        }),

    submitGameAction: protectedProcedure
        .input(TableStateActionSchema)
        .query(({ input, ctx }) => {
            const user = ctx.session.user;
            if (input.type == "fold") {
                prisma.player.update({
                    where: {
                        userId: user.id,
                    },
                    data: {
                        folded: true,
                    },
                });
            }
        }),
});

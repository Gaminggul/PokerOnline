import {
    type GameData,
    TableStateActionSchema,
    type PlayerAction,
} from "../../../scripts/game_data";
import { prisma } from "../../db";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { error, tuple_zip } from "functional-utilities";

import { create_pusher_server } from "../../pusher";
import { compute_next_state } from "../../../scripts/game";
import { CardIdSchema } from "../../../scripts/card_tuple";
import { z } from "zod";
import {
    type MultiPlayerGameState,
    create_visual_game_state,
} from "../../../scripts/mp_visual_game_state";

function from_state(
    state: GameData,
    old_game: MultiPlayerGameState
): MultiPlayerGameState {
    return {
        betIncreaseIndex: state.betIncreaseIndex,
        centerCards: state.centerCards,
        centerRevealAmount: state.centerRevealAmount,
        currentPlayerIndex: state.currentPlayerIndex,
        id: state.id,
        pot: state.pot,
        players: tuple_zip([state.players, old_game.players]).map(
            ([p, old_p]) => ({
                bet: p.bet,
                folded: p.folded,
                card1: p.card1,
                card2: p.card2,
                chip_amount: p.chip_amount,
                id: old_p.id,
                channel: old_p.channel,
                userId: old_p.userId,
                gameId: old_p.gameId,
                user: old_p.user,
            })
        ),
        lobbyId: old_game.lobbyId,
    };
}

function to_state(game: MultiPlayerGameState): GameData {
    return {
        id: game.id,
        players: game.players.map((p) => ({
            bet: p.bet,
            folded: p.folded,
            card1: CardIdSchema.parse(p.card1),
            card2: CardIdSchema.parse(p.card2),
            name: p.user.name,
            remainingChips: p.chip_amount,
            id: p.id,
            chip_amount: p.chip_amount,
        })),
        centerCards: z.array(CardIdSchema).parse(game.centerCards),
        centerRevealAmount: game.centerRevealAmount,
        currentPlayerIndex: game.currentPlayerIndex,
        pot: game.pot,
        betIncreaseIndex: game.betIncreaseIndex,
    };
}

function run_action(
    game: MultiPlayerGameState,
    action: PlayerAction
): { state: GameData; end_of_game: boolean } {
    const state = to_state(game);
    return compute_next_state(state, action);
}

async function distribute_new_state(
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

export const gameRouter = createTRPCRouter({
    getChannelId: protectedProcedure.query(({ ctx }) => {
        const user = ctx.session.user;
        const channel = prisma.player.findUnique({
            where: {
                userId: user.id,
            },
            select: {
                channel: true,
            },
        });
        return channel;
    }),

    getVisualGameState: protectedProcedure.query(async ({ ctx }) => {
        const user = ctx.session.user;
        const player = await prisma.player.findUnique({
            where: {
                userId: user.id,
            },
            include: {
                game: {
                    include: {
                        players: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });
        if (player === null) {
            throw new Error("Not in a game");
        }
        return create_visual_game_state(player.game, user.id, false);
    }),

    submitGameAction: protectedProcedure
        .input(TableStateActionSchema)
        .mutation(async ({ input, ctx }) => {
            const user = ctx.session.user;
            const unsplit = await prisma.player.findUnique({
                where: {
                    userId: user.id,
                },
                include: {
                    game: {
                        include: {
                            players: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            });
            const game =
                (unsplit ?? error("Game not found")).game ??
                error("Game not found");
            const { state: new_state, end_of_game } = run_action(game, input);
            await prisma.game.update({
                where: {
                    id: game.id,
                },
                data: {
                    betIncreaseIndex: new_state.betIncreaseIndex,
                    centerCards: new_state.centerCards,
                    centerRevealAmount: new_state.centerRevealAmount,
                    currentPlayerIndex: new_state.currentPlayerIndex,
                    pot: new_state.pot,
                    players: {
                        updateMany: new_state.players.map((p) => ({
                            where: {
                                id: p.id,
                            },
                            data: {
                                bet: p.bet,
                                folded: p.folded,
                                card1: p.card1,
                                card2: p.card2,
                                chip_amount: p.chip_amount,
                            },
                        })),
                    },
                },
            });
            await distribute_new_state(
                from_state(new_state, game),
                end_of_game
            );
        }),
});

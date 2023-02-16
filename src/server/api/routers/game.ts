import {
    type TableState,
    TableStateActionSchema,
    type VisualTableState,
    type TableStateAction,
} from "../../../scripts/table_state";
import { prisma } from "../../db";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import type { Game, Player, User } from "@prisma/client";
import { error, tuple_zip } from "functional-utilities";
import type { CardId } from "../../../scripts/cards";

import { create_pusher_server } from "../../pusher";
import { compute_next_state } from "../../../scripts/game";

type CompleteGame = Game & {
    players: (Player & {
        User: User;
    })[];
};

function create_visual_game_state(
    game: CompleteGame,
    user_id: string,
    game_end: boolean
): VisualTableState {
    return {
        centerCards: (game.centerCards as CardId[]).map((c, i) =>
            i < game.centerRevealAmount ? c : "hidden"
        ),
        players: game.players.map((p, i) => ({
            bet: p.bet,
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
        id: game.id,
    };
}

function from_state(state: TableState, old_game: CompleteGame): CompleteGame {
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
                card1: p.hand[0],
                card2: p.hand[1],
                chip_amount: p.chip_amount,
                id: old_p.id,
                channel: old_p.channel,
                userId: old_p.userId,
                gameId: old_p.gameId,
                User: old_p.User,
            })
        ),
    };
}

function to_state(game: CompleteGame): TableState {
    return {
        id: game.id,
        players: game.players.map((p) => ({
            bet: p.bet,
            folded: p.folded,
            hand: [p.card1 as CardId, p.card2 as CardId],
            name: p.User.name,
            remainingChips: p.chip_amount,
            id: p.id,
            chip_amount: p.chip_amount,
        })),
        centerCards: game.centerCards as CardId[],
        centerRevealAmount: game.centerRevealAmount,
        currentPlayerIndex: game.currentPlayerIndex,
        pot: game.pot,
        betIncreaseIndex: game.betIncreaseIndex,
    };
}

function run_action(
    game: CompleteGame,
    action: TableStateAction
): { state: TableState; end_of_game: boolean } {
    const state = to_state(game);
    return compute_next_state(state, action);
}

async function distribute_new_state(game: CompleteGame, end_of_round: boolean) {
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

    submitGameAction: protectedProcedure
        .input(TableStateActionSchema)
        .mutation(async ({ input, ctx }) => {
            const user = ctx.session.user;
            const unsplit = await prisma.player.findUnique({
                where: {
                    userId: user.id,
                },
                include: {
                    Game: {
                        include: {
                            players: {
                                include: {
                                    User: true,
                                },
                            },
                        },
                    },
                },
            });
            const game =
                (unsplit ?? error("Game not found")).Game ??
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
                                card1: p.hand[0],
                                card2: p.hand[1],
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

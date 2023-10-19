import { TableStateActionSchema } from "../../../code/game_data";
import { prisma } from "../../db";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { isNonEmptyArray, panic } from "functional-utilities";

import { MPGameState } from "../../../code/classes/mp_game_state";
import { MPUser } from "../../../code/classes/mp_user";

export const gameRouter = createTRPCRouter({
    getChannelId: protectedProcedure.query(async ({ ctx }) => {
        const user = ctx.session.user;
        const channel =
            (
                await prisma.player.findUnique({
                    where: {
                        id: user.id,
                    },
                    select: { user: { select: { channel: true } } },
                })
            )?.user.channel ?? null;
        return channel;
    }),

    getVisualGameState: protectedProcedure.query(async ({ ctx }) => {
        const user = ctx.session.user;
        const lobby = await prisma.lobby.findFirst({
            where: {
                users: {
                    some: {
                        id: user.id,
                    },
                },
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
        if (lobby === null) {
            return "not_in_lobby";
        }
        if (lobby.game === null) {
            return "lobby_not_started";
        }
        const game = MPGameState.from_prisma_data(lobby.game);
        return game.instance.visualize(user.id);
    }),

    requestGameRestart: protectedProcedure.mutation(async ({ ctx }) => {
        const user = ctx.session.user;
        const lobby =
            (await prisma.player.findUnique({
                where: {
                    id: user.id,
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
            })) ?? panic("Lobby not found");
        if (!lobby.game.restartAt) {
            throw new Error("Restart not scheduled");
        }
        if (!isNonEmptyArray(lobby.game.players)) {
            throw new Error("No players in game");
        }
        console.log(lobby.id, lobby.game.id);
        const generated_game = MPGameState.generate(
            lobby.game.id,
            lobby.game.players.map((p) => new MPUser(p.user)),
            "texas_holdem",
        );
        await generated_game.distribute();
    }),

    submitGameAction: protectedProcedure
        .input(TableStateActionSchema)
        .mutation(async ({ input, ctx }) => {
            const user = ctx.session.user;
            const player =
                (await prisma.player.findUnique({
                    where: {
                        id: user.id,
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
                })) ?? panic("Player not found");
            const game = MPGameState.from_prisma_data(player.game);
            game.instance.action(input, player.id);
            await game.distribute();
        }),
});

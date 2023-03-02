import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "../../db";
import type { Lobby } from "@prisma/client";
import { create_pusher_server } from "../../pusher";
import { v4 } from "uuid";
import { error } from "functional-utilities";
import { generate_game } from "../../../scripts/game";
import { default as dayjs } from "dayjs";
import { AccessSchema } from "../../../scripts/access";

async function distributeLobbyUpdate(lobby: Lobby & { users: { id: string }[] }) {
    const pusher = create_pusher_server();
    await pusher.trigger(lobby.channel, "update", lobby);
}

export const lobbyRouter = createTRPCRouter({
    joinLobby: protectedProcedure
        .input(z.object({ size: z.number(), access: AccessSchema }))
        .mutation(async ({ ctx, input }) => {
            const user = ctx.session.user;
            const lobby = await prisma.$transaction(async (tx) => {
                const lobby = (
                    await tx.lobby.findMany({
                        where: {
                            access: input.access,
                        },
                        orderBy: {
                            users: {
                                _count: "asc",
                            },
                        },
                        include: {
                            users: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                        take: 1,
                    })
                )[0];

                const user_amount = lobby ? (lobby.users.length + 1) : 1;
                if (!lobby || lobby.users.length >= lobby.size) {
                    return await tx.lobby.create({
                        data: {
                            size: input.size,
                            access: "public",
                            users: {
                                connect: {
                                    id: user.id,
                                },
                            },
                            channel: v4(),
                        },
                        include: {
                            users: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    });
                } else {
                    await tx.lobby.update({
                        where: {
                            id: lobby.id,
                        },
                        data: {
                            users: {
                                connect: {
                                    id: user.id,
                                },
                            },
                            startAt: (user_amount > 1 || user_amount == lobby.size) ? dayjs().add(20, 'second').toDate() : undefined,
                        },
                    });
                }

                return lobby;
            });
            await distributeLobbyUpdate(lobby);
            return lobby;
        }),
    requestGameStart: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const user =
            (await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                include: {
                    lobby: {
                        select: {
                            id: true,
                            channel: true,
                            size: true,
                            startAt: true,
                            users: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                            game: {
                                select: {
                                    id: true,
                                }
                            }
                        },
                    },
                },
            })) ?? error("User not found");

        const lobby = user.lobby;
        if (!lobby) {
            throw new Error("Not in a lobby");
        }
        if (!lobby.startAt) {
            throw new Error("Lobby not ready to start (start not scheduled)");
        }
        if (lobby.startAt > new Date()) {
            throw new Error("Lobby not ready to start (too early)");
        }
        if (lobby.game?.id) {
            throw new Error("Lobby already has a game");
        }
        const generated_game = generate_game(
            lobby.users.map((u) => ({
                id: u.id,
                chip_amount: 100,
                name: u.name,
            })),
            v4()
        );
        const game = await prisma.game.create({
            data: {
                lobby: {
                    connect: {
                        id: lobby.id,
                    },
                },
                players: {
                    createMany: {
                        data: generated_game.players.map((p) => ({
                            bet: p.bet,
                            card1: p.card1,
                            card2: p.card2,
                            chip_amount: p.chip_amount,
                            id: p.id,
                            folded: p.folded,
                            channel: v4(),
                        })),
                    },
                },
                betIncreaseIndex: generated_game.betIncreaseIndex,
                centerCards: generated_game.centerCards,
                centerRevealAmount: generated_game.centerRevealAmount,
                currentPlayerIndex: generated_game.currentPlayerIndex,
                pot: generated_game.pot,
                id: v4(),
            },
        });
        const pusher = create_pusher_server();
        await pusher.trigger(lobby.channel, "start", game);
        return game;
    }),
});

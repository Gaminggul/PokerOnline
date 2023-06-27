import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "../../db";
import { v4 } from "uuid";
import { panic, type NonEmptyArray } from "functional-utilities";
import { default as dayjs } from "dayjs";
import { AccessSchema } from "../../../code/access";
import { player_start_amount } from "../../../code/constants";
import { MPGameState } from "../../../code/classes/mp_game_state";
import { MPLobby } from "../../../code/classes/mp_lobby";

function lobby_ready<T>(
    lobby: { users: T[]; size: number },
    user_amount_override?: number
): lobby is { users: NonEmptyArray<T>; size: number } {
    const user_amount = user_amount_override ?? lobby.users.length;
    return user_amount > player_start_amount - 1 || user_amount == lobby.size;
}

export const lobbyRouter = createTRPCRouter({
    pong: protectedProcedure.mutation(async ({ ctx }) => {
        const user = ctx.session.user;
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                timeout: null,
            },
        });
        console.log("Got Pong");
    }),
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
                            users: true,
                        },
                        take: 1,
                    })
                )[0];

                const user_amount = lobby
                    ? lobby.users.filter((u) => u.id !== user.id).length + 1
                    : 1; // +1 because the user is not in the lobby yet
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
                            channel: `lobby-${v4()}`,
                            blindIndex: 0,
                        },
                        include: {
                            users: true,
                        },
                    });
                } else {
                    return await tx.lobby.update({
                        where: {
                            id: lobby.id,
                        },
                        data: {
                            users: {
                                connect: {
                                    id: user.id,
                                },
                            },
                            startAt: lobby_ready(lobby, user_amount)
                                ? dayjs().add(20, "second").toDate()
                                : undefined,
                        },
                        include: {
                            users: true,
                        },
                    });
                }
            });
            const mp_lobby = new MPLobby({
                ...lobby,
                game: undefined,
            });
            await mp_lobby.distribute();
            return mp_lobby.visualize();
        }),
    getLobby: protectedProcedure.query(async ({ ctx }) => {
        const user = ctx.session.user;
        const lobby = (
            await prisma.user.findUnique({
                where: {
                    id: user.id,
                },
                select: {
                    lobby: {
                        include: {
                            users: true,
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
                    },
                },
            })
        )?.lobby;
        if (!lobby) {
            throw new Error("Not in a lobby");
        }
        const mp_lobby = new MPLobby(lobby);
        return mp_lobby.visualize();
    }),

    globalRoundReset: protectedProcedure.mutation(async () => {
        // This is a global reset and only temporary
        await prisma.lobby.deleteMany({});
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
                        include: {
                            users: true,
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
                    },
                },
            })) ?? panic("User not found");

        const lobby = new MPLobby(user.lobby ?? panic("Not in a lobby"));
        if (!lobby) {
            throw new Error("Not in a lobby");
        }
        if (!lobby.startAt) {
            throw new Error("Lobby not ready to start (start not scheduled)");
        }
        const time_offset = dayjs()
            .subtract(dayjs(lobby.startAt).millisecond(), "milliseconds")
            .millisecond();
        console.log(time_offset);
        if (time_offset > 1000) {
            throw new Error("Lobby not ready to start (too early)");
        }
        if (lobby.game?.instance.id) {
            throw new Error("Lobby already has a game");
        }
        if (!lobby_ready(lobby)) {
            throw new Error("Lobby not ready to start (not enough players)");
        }
        const generated_game = MPGameState.generate(
            v4(),
            lobby.users,
            "texas_holdem"
        );
        const game_data = await prisma.game.create({
            data: {
                lobby: {
                    connect: {
                        id: lobby.id,
                    },
                },
                players: {
                    createMany: {
                        data: generated_game.instance.players.map((p) => ({
                            bet: p.bet,
                            card1: p.card1,
                            card2: p.card2,
                            chip_amount: p.chip_amount,
                            id: p.id,
                            folded: p.folded,
                            had_turn: p.had_turn,
                        })),
                    },
                },
                centerCards: generated_game.instance.centerCards,
                centerRevealAmount: generated_game.instance.centerRevealAmount,
                pot: generated_game.instance.pot,
                variant: generated_game.instance.variant,
                id: v4(),
            },
            include: {
                players: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        const game = MPGameState.from_prisma_data(game_data);
        lobby.game = game;
        await lobby.distribute();
    }),
});

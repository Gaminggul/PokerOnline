import { GameInstance } from "./game_instance";
import type { GameState, Player } from "../interfaces/player";
import type {
    Player as PrismaPlayer,
    Game as PrismaGame,
    User as PrismaUser,
} from "@prisma/client";
import { CardIdSchema, CardIdsSchema } from "../card_tuple";
import { type CardId } from "../cards";
import { create_pusher_server } from "../../server/pusher";
import { prisma } from "../../server/db";
import type { MPUser } from "./mp_user";
import { v4 } from "uuid";

export class MPPlayer implements Player, PrismaPlayer {
    id: string;
    card1: string;
    card2: string;
    folded: boolean;
    chip_amount: number;
    bet: number;
    gameId: string;

    name: string;
    channel: string;

    static from_prisma_data(
        prismaPlayer: PrismaPlayer & { user: PrismaUser }
    ): MPPlayer {
        return new this(
            prismaPlayer.id,
            prismaPlayer.card1,
            prismaPlayer.card2,
            prismaPlayer.folded,
            prismaPlayer.chip_amount,
            prismaPlayer.bet,
            prismaPlayer.gameId,

            prismaPlayer.user.name,
            prismaPlayer.user.channel ?? v4()
        );
    }

    constructor(
        id: string,
        card1: string,
        card2: string,
        folded: boolean,
        chip_amount: number,
        bet: number,
        gameId: string,
        name: string,
        channel: string
    ) {
        this.id = id;
        this.card1 = card1;
        this.card2 = card2;
        this.folded = folded;
        this.chip_amount = chip_amount;
        this.bet = bet;
        this.gameId = gameId;
        this.name = name;
        this.channel = channel;
    }

    get_pid(): string {
        return this.id;
    }

    get_name(): string {
        return this.id;
    }

    is_folded(): boolean {
        return this.folded;
    }

    get_chip_amount(): number {
        return this.chip_amount;
    }

    get_current_bet(): number {
        return this.bet;
    }

    update_chip_amount(amount: number): void {
        this.chip_amount = amount;
    }

    update_current_bet(amount: number): void {
        this.bet = amount;
    }

    fold(): void {
        this.folded = true;
    }

    get_cards(): [CardId, CardId] {
        return [CardIdSchema.parse(this.card1), CardIdSchema.parse(this.card2)];
    }
}

export class MPGameState implements GameState<MPPlayer> {
    instance: GameInstance<MPPlayer>;

    static from_prisma_data(
        prisma_game: PrismaGame & {
            players: (PrismaPlayer & { user: PrismaUser })[];
        }
    ): MPGameState {
        const instance = new GameInstance<MPPlayer>(
            prisma_game.id,
            CardIdsSchema.parse(prisma_game.centerCards),
            prisma_game.centerRevealAmount,
            prisma_game.players.map((p) => MPPlayer.from_prisma_data(p)),
            prisma_game.currentPlayerIndex,
            prisma_game.betIncreaseIndex,
            prisma_game.pot,
            prisma_game.restartAt ?? undefined
        );
        return new MPGameState(instance);
    }

    constructor(instance: GameInstance<MPPlayer>) {
        this.instance = instance;
    }

    static generate(game_id: string, users: MPUser[]): MPGameState {
        const new_instance = GameInstance.generate(
            users,
            (user, data) =>
                new MPPlayer(
                    user.id,
                    data.card1,
                    data.card2,
                    data.folded,
                    user.chips,
                    data.bet,
                    game_id,

                    user.name,
                    user.channel ?? v4()
                )
        );
        return new MPGameState(new_instance);
    }

    async distribute(): Promise<void> {
        const pusher = create_pusher_server();
        await Promise.all([
            pusher.triggerBatch(
                this.instance.players.map((p) => ({
                    channel: p.channel,
                    name: "update",
                    data: this.instance.visualize(p.id),
                }))
            ),
            prisma.game.update({
                where: {
                    id: this.instance.id,
                },
                data: {
                    centerCards: this.instance.centerCards,
                    centerRevealAmount: this.instance.centerRevealAmount,
                    currentPlayerIndex: this.instance.currentPlayerIndex,
                    betIncreaseIndex: this.instance.betIncreaseIndex,
                    pot: this.instance.pot,
                    restartAt: this.instance.restartAt ?? undefined,
                    players: {
                        updateMany: this.instance.players.map((p) => ({
                            where: {
                                id: p.id,
                            },
                            data: {
                                card1: p.card1,
                                card2: p.card2,
                                folded: p.folded,
                                chip_amount: p.chip_amount,
                                bet: p.bet,
                            },
                        })),
                    },
                    lobby: {
                        update: {
                            users: {
                                updateMany: this.instance.players.map((p) => ({
                                    where: {
                                        id: p.id,
                                    },
                                    data: {
                                        channel: p.channel,
                                    },
                                })),
                            },
                        },
                    },
                },
            }),
        ]);
    }
}

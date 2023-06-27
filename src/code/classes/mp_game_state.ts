import type { GameVariants } from "./game_instance";
import { GameInstance, GameVariantsSchema } from "./game_instance";
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
import { type NonEmptyArray, isNonEmptyArray } from "functional-utilities";

export class MPPlayer implements Player, PrismaPlayer {
    id: string;
    card1: string;
    card2: string;
    folded: boolean;
    chip_amount: number;
    bet: number;
    gameId: string;
    had_turn: boolean;
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
            prismaPlayer.had_turn,
            prismaPlayer.user.name,
            prismaPlayer.user.channel ?? `player-${v4()}`
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
        had_turn: boolean,
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
        this.had_turn = had_turn;
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

    get_had_turn(): boolean {
        return this.had_turn;
    }

    set_had_turn(had_turn: boolean): void {
        this.had_turn = had_turn;
    }
}

export class MPGameState implements GameState<MPPlayer> {
    instance: GameInstance<MPPlayer>;

    static from_prisma_data(
        prisma_game: PrismaGame & {
            players: (PrismaPlayer & { user: PrismaUser })[];
        }
    ): MPGameState {
        if (!isNonEmptyArray(prisma_game.players)) {
            throw new Error("No players");
        }
        const instance = new GameInstance<MPPlayer>({
            id: prisma_game.id,
            centerCards: CardIdsSchema.parse(prisma_game.centerCards),
            centerRevealAmount: prisma_game.centerRevealAmount,
            players: prisma_game.players.map((p) =>
                MPPlayer.from_prisma_data(p)
            ),
            pot: prisma_game.pot,
            restartAt: prisma_game.restartAt ?? undefined,
            variant: GameVariantsSchema.parse(prisma_game.variant),
        });
        return new MPGameState(instance);
    }

    constructor(instance: GameInstance<MPPlayer>) {
        this.instance = instance;
    }

    static generate(
        game_id: string,
        users: NonEmptyArray<MPUser>,
        variant: GameVariants
    ): MPGameState {
        const new_instance = GameInstance.generate(
            game_id,
            users,
            variant,
            (user, data) =>
                new MPPlayer(
                    user.id,
                    data.card1,
                    data.card2,
                    data.folded,
                    user.chips,
                    data.bet,
                    game_id,
                    data.had_turn,
                    user.name,
                    user.channel ?? `player-${v4()}`
                )
        );
        return new MPGameState(new_instance);
    }

    async distribute(): Promise<void> {
        const pusher = create_pusher_server();
        console.log(this.instance.id);
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
                    pot: this.instance.pot,
                    restartAt: this.instance.restartAt ?? null,
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
                                had_turn: p.had_turn,
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

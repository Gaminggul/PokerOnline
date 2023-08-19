import { v4 } from "uuid";
import { MPGameState } from "./mp_game_state";
import type {
    Access,
    Lobby as PrismaLobby,
    Game as PrismaGame,
    Player as PrismaPlayer,
    User as PrismaUser,
} from "@prisma/client";
import { MPUser } from "./mp_user";
import { create_pusher_server } from "../../server/pusher";
import type { VisualLobbyState } from "../game_data";
import { isNonEmptyArray, panic, pipe } from "functional-utilities";

export class MPLobby {
    game?: MPGameState;
    users: MPUser[] = [];
    id: string;
    name?: string;
    access: Access;
    ownerId?: string;
    size: number;
    channel: string;
    createdAt: Date;
    updatedAt: Date;
    startAt?: Date;
    blindIndex: number;

    constructor(
        lobby: PrismaLobby & {
            game?:
                | (PrismaGame & {
                      players: (PrismaPlayer & { user: PrismaUser })[];
                  })
                | null
                | undefined;
            users: PrismaUser[];
        },
    ) {
        this.id = lobby.id;
        this.name = lobby.name ?? undefined;
        this.access = lobby.access;
        this.ownerId = lobby.ownerId ?? undefined;
        this.size = lobby.size;
        this.channel = lobby.channel;
        this.createdAt = lobby.createdAt;
        this.updatedAt = lobby.updatedAt;
        this.startAt = lobby.startAt ?? undefined;
        this.blindIndex = lobby.blindIndex;

        if (lobby.game) {
            this.game = MPGameState.from_prisma_data(lobby.game);
        }
        this.users = lobby.users.map((user) => new MPUser(user));
    }

    start_or_restart() {
        if (!isNonEmptyArray(this.users)) {
            panic("Cannot start a game with no users");
        }
        const id = this.game?.instance.id ?? v4();
        this.game = MPGameState.generate(id, this.users, "texas_holdem");
    }

    async distribute() {
        console.log(
            "distributing to",
            this.users.map((u) => u.name),
            "on",
            this.channel,
        );
        await Promise.all([
            (async () => {
                const pusher = create_pusher_server();
                await pusher.trigger(this.channel, "update", this.visualize());
            })(),
            this.game?.distribute(),
        ]);
    }

    visualize(): VisualLobbyState {
        return {
            id: this.id,
            name: this.name ?? "Unnamed Lobby",
            access: this.access,
            ownerId: this.ownerId ?? undefined,
            size: this.size,
            users: this.users.map((u) => ({
                id: u.id,
                name: u.name,
            })),
            blindIndex: this.blindIndex,
            channel: this.channel,
            startAt: this.startAt ?? undefined,
            game_started: !!this.game,
        };
    }

    remove_user(user_id: string) {
        if (this.game) {
            this.game.remove_player(user_id);
        }
        this.users.splice(
            pipe(
                this.users.findIndex((u) => u.id === user_id),
                (v) => (v === -1 ? undefined : v),
            ) ?? panic("User does not exist"),
        );
    }
}

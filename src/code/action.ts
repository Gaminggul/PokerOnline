import { prisma } from "../server/db";
import type { Lobby, User } from "@prisma/client";
import dayjs from "dayjs";

export async function cleanup_timeouts(lobby: Lobby & { users: User[] }) {
    // remove users who have timed out from the lobby
    const users_to_remove = lobby.users.filter((u) => {
        if (!u.timeout) {
            return false;
        }
        return dayjs().isAfter(dayjs(u.timeout));
    });

    if (users_to_remove.length > 0) {
        console.log(
            "Removing users",
            users_to_remove.map((u) => u.id),
            "from lobby",
            lobby.id
        );
        await prisma.lobby.update({
            where: {
                id: lobby.id,
            },
            data: {
                users: {
                    disconnect: users_to_remove.map((u) => ({
                        id: u.id,
                    })),
                },
            },
        });
    }
}

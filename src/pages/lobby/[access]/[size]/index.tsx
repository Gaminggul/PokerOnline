import { Access, Lobby } from "@prisma/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "../../../../utils/api";
import { Layout } from "../../../../components/layout";

type LobbyType = Lobby & {
    users: {
        id: string;
    }[];
};

function Lobby() {
    const router = useRouter();
    const size = parseInt(router.query.size as string);
    const access = router.query.access as string;

    const [lobby, setLobby] = useState<LobbyType | null>(null);
    const joinPublicLobby = api.lobby.joinPublicGame.useMutation();

    useEffect(() => {
        if (access === "public") {
            const test = joinPublicLobby.mutate(
                { size },
                {
                    onSuccess: (data) => {
                        setLobby(data);
                    },
                }
            );
        }
    }, [access, size]);

    return (
        <Layout show_banner={false}>
            {lobby ? (
                <LobbyPage lobby={lobby} />
            ) : (
                <div>
                    <h1>Loading...</h1>
                </div>
            )}
        </Layout>
    );
}

function LobbyPage({ lobby }: { lobby: LobbyType }) {
    return (
        <div>
            <h1>Lobby</h1>
            <p>Access: {lobby.access}</p>
            <p>Size: {lobby.size}</p>
            {lobby.users.map((user) => (
                <p key={user.id}>{JSON.stringify(user)}</p>
            ))}
        </div>
    );
}

export default Lobby;

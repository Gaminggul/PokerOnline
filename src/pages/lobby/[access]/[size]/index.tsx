import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../../utils/api";
import { Layout } from "../../../../components/layout";
import { subscribe, unsubscribe } from "../../../../scripts/pusher";
import { Lobby } from "@prisma/client";
import { Timer } from "../../../../components/timer";
import {
    type VisualGameState,
    VisualGameStateSchema,
} from "../../../../scripts/game_data";
import Table from "../../../../components/table";
import { player_start_amount } from "../../../../scripts/constants";

type LobbyType = Lobby & {
    users: {
        id: string;
        name: string;
    }[];
};

function Lobby() {
    const router = useRouter();
    const size = parseInt(router.query.size as string);
    const access = router.query.access as string;

    const [lobby, setLobby] = useState<LobbyType | null>(null);
    const joiningRef = useRef(false);
    const joinLobby = api.lobby.joinLobby.useMutation();
    const lobbyQuery = api.lobby.getLobby.useQuery();

    useEffect(() => {
        if (lobby?.channel) {
            const channel = subscribe(lobby.channel);
            channel.bind("update", (newData: LobbyType) => {
                console.log("Lobby updated", newData);
                setLobby(newData);
            });
            return () => {
                channel.unbind_all();
                unsubscribe(lobby.channel);
            };
        }
    }, [lobby?.channel]);

    useEffect(() => {
        let schedule_update = false;
        if (access === "public" && !joiningRef.current) {
            console.log("Joining lobby");
            joiningRef.current = true;
            schedule_update = true;
            joinLobby.mutate(
                { size, access },
                {
                    onSettled: (data) => {
                        schedule_update = false;
                        if (!data) {
                            console.log("Failed to join lobby");
                            void router.push("/");
                            return;
                        }
                        console.log(`Joined lobby ${data.access}`, data);
                        setLobby(data);
                    },
                }
            );
        }
        return () => {
            if (schedule_update) {
                setTimeout(() => {
                    void lobbyQuery.refetch();
                }, 1000);
            }
        };
    }, [access, size, joinLobby, lobbyQuery, router]);

    useEffect(() => {
        if (lobbyQuery.data) {
            setLobby(lobbyQuery.data);
        }
    }, [lobbyQuery.data]);

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
    return lobby.started ? <MultiPlayer /> : <LobbyWaitPage lobby={lobby} />;
}

function LobbyWaitPage({ lobby }: { lobby: LobbyType }) {
    const requestGameStart = api.lobby.requestGameStart.useMutation();
    return (
        <div className="h-full flex flex-col justify-between p-8">
            <p className="text-gray-500">Lobby - {lobby.name ?? lobby.id}</p>
            <div className="flex flex-col gap-4">
                <h2 className="text-center text-3xl">Players</h2>
                <div className="flex gap-4 justify-center flex-wrap">
                    {lobby.users.map((user) => (
                        <div
                            key={user.id}
                            className="flex flex-col rounded bg-slate-800 p-4"
                        >
                            <p>Name: {user.name}</p>
                            <p>ID: {user.id}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-center bg-slate-200 p-8 text-2xl text-slate-800">
                {lobby.started ? (
                    <>Game is starting</>
                ) : lobby.startAt ? (
                    <>
                        Game starts in{" "}
                        <Timer
                            end_time={lobby.startAt}
                            on_end={requestGameStart.mutate}
                        ></Timer>
                    </>
                ) : (
                    <>Waiting for {player_start_amount - lobby.users.length} more players to start</>
                )}
            </div>
        </div>
    );
}

function MultiPlayer() {
    const [visualGameState, setVisualGameState] = useState<
        VisualGameState | undefined
    >(undefined);
    const channelIdQuery = api.game.getChannelId.useQuery();
    const visualGameStateQuery = api.game.getVisualGameState.useQuery();
    const submitActionQuery = api.game.submitGameAction.useMutation();

    useEffect(() => {
        if (!channelIdQuery.data) {
            return;
        }
        const channelId = channelIdQuery.data.channel;
        const channel = subscribe(channelId);

        channel.bind("update", (newData: unknown) => {
            const newVisualTableState =
                VisualGameStateSchema.safeParse(newData);
            if (newVisualTableState.success) {
                setVisualGameState(newVisualTableState.data);
            } else {
                console.error("Invalid data received from server");
                console.error(newVisualTableState.error);
            }
        });

        return () => {
            channel.unbind_all();
            unsubscribe(channelId);
        };
    }, [channelIdQuery.data]);

    useEffect(() => {
        if (!visualGameStateQuery.data) {
            return;
        }
        setVisualGameState(visualGameStateQuery.data);
    }, [visualGameStateQuery.data]);

    return (
        <div>
            {visualGameState ? (
                <Table
                    state={visualGameState}
                    submit_action={submitActionQuery.mutate}
                />
            ) : (
                <div>Loading...</div>
            )}
        </div>
    );
}

export default Lobby;

import { useSession } from "next-auth/react";
import { type ReactNode } from "react";
import { Layout } from "../components/layout";
import { api } from "../utils/api";
import {
    Avatar,
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
} from "@nextui-org/react";
import { useRouter } from "next/router";

function OptionBox(props: { title: string; children: ReactNode }) {
    return (
        <Card
            className="h-96 w-80 border-1 border-gray-500 p-4 dark:bg-slate-900"
            shadow="lg"
        >
            <CardHeader>
                <h3 className="my-0 text-2xl font-bold">{props.title}</h3>
            </CardHeader>
            <Divider className="bg-white" />
            <CardBody>{props.children}</CardBody>
        </Card>
    );
}

function Home() {
    const session = useSession();
    const router = useRouter();
    const globalRoundResetMutation = api.lobby.globalRoundReset.useMutation();
    return (
        <Layout>
            <div className="flex flex-col h-full p-12">
                <h1 className="flex gap-2 text-3xl font-bold">
                    Hello {session.data?.user.name}{" "}
                    <Avatar
                        src={session.data?.user?.image ?? "/favicon.ico"}
                    ></Avatar>
                </h1>
                <div className="flex justify-evenly h-full align-center gap-4">
                    <OptionBox title="Tournaments">
                        <ul>
                            <li>Tournament 1</li>
                            <li>Tournament 2</li>
                            <li>Tournament 3</li>
                        </ul>
                    </OptionBox>
                    <OptionBox title="Play">
                        <div className="flex h-full flex-col items-center justify-evenly pb-8">
                            <Button
                                onClick={() => void router.push("/lobby/join")}
                                fullWidth
                                variant="shadow"
                                color="primary"
                            >
                                Join
                            </Button>
                            <Button
                                onClick={() =>
                                    void router.push("/lobby/create")
                                }
                                fullWidth
                                variant="shadow"
                                color="success"
                            >
                                Create
                            </Button>
                            <Button
                                onClick={() => {
                                    globalRoundResetMutation.mutate();
                                }}
                                fullWidth
                                variant="shadow"
                                color="danger"
                            >
                                Reset
                            </Button>
                        </div>
                    </OptionBox>
                    <OptionBox title="Social">
                        <h3 className="text-xl">Online Friends</h3>
                        <ul>
                            <li>Friend 1</li>
                            <li>Friend 2</li>
                            <li>Friend 3</li>
                        </ul>
                        <h3 className="text-xl">Your Clan</h3>
                        <p>Clan</p>
                    </OptionBox>
                </div>
            </div>
        </Layout>
    );
}

export default Home;

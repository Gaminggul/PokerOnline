import { useSession } from "next-auth/react";
import { type ReactNode } from "react";
import { Btn } from "../components/btn";
import { Layout } from "../components/layout";

function OptionBox(props: { title: string; children: ReactNode }) {
    return (
        <div className="flex h-96 w-80 flex-col gap-2 rounded-lg bg-slate-800 p-4">
            <h2 className="text-2xl font-bold">{props.title}</h2>
            <div className="h-full w-full">{props.children}</div>
        </div>
    );
}

function Home() {
    const session = useSession();
    return (
        <Layout show_banner={true}>
            <div className="flex flex-col p-12 text-white">
                <h1 className="text-3xl font-bold">
                    Hello {session.data?.user.name}
                </h1>
                <div className="mt-12 flex justify-evenly gap-4">
                    <OptionBox title="Tournaments">
                        <ul>
                            <li>Tournament 1</li>
                            <li>Tournament 2</li>
                            <li>Tournament 3</li>
                        </ul>
                    </OptionBox>
                    <OptionBox title="Play">
                        <div className="flex h-full flex-col items-center justify-evenly pb-8">
                            <Btn text="Join" onClick={"/lobby/public/10"} />
                            <Btn text="Create" />
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

import Image from "next/image";
import type { PropsWithChildren } from "react";
import CreateGame from "../../public/creategame.jpg";
import JoinGame from "../../public/joingame.jpg";
import Link from "next/link";
import { Layout } from "../components/layout";

function Play() {
    return (
        <Layout show_banner={true}>
            <div className="flex h-screen justify-evenly p-12">
                <Column>
                    <Image
                        src={CreateGame}
                        alt="creategame.jpg"
                        className="w-[500px] rounded-xl"
                    />
                    <h2 className="p-10 text-5xl font-bold">Create Game</h2>
                    <p className="text-xl">
                        If you want to play a game with your friends,
                    </p>
                    <p className="p-2 text-xl">then create a game here!</p>
                    <CAJButton text="Create Game" route="/create"></CAJButton>
                </Column>
                <Column>
                    <Image
                        src={JoinGame}
                        alt="joingame.jpg"
                        className="w-[500px] rounded-xl"
                    />
                    <h2 className="p-10 text-5xl font-bold">Join Game</h2>
                    <p className="text-xl">
                        If you want to join a game with your friends
                    </p>
                    <p className="p-2 text-xl">
                        or with strangers then join here!
                    </p>
                    <CAJButton text="Join Game" route="/join"></CAJButton>
                </Column>
                <Column>
                    <h2>Play Alone</h2>
                    <p>This is just to test the game</p>
                    <CAJButton text="Play Alone" route={`/game`}></CAJButton>
                </Column>
            </div>
        </Layout>
    );
}

function Column(props: PropsWithChildren) {
    return (
        <div className="flex h-full flex-col items-center rounded-3xl bg-slate-400 p-12">
            {props.children}
        </div>
    );
}

function CAJButton(props: { text: string; route: string }) {
    return (
        <Link href={props.route} className="rounded-xl bg-green-700 p-4">
            {props.text}
        </Link>
    );
}

export default Play;

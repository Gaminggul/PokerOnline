import { PropsWithChildren } from "react"

function Play() {
    return <div className="flex justify-evenly h-screen p-12">
        <Column>
            <img src="/creategame.jpg" alt="creategame.jpg" className="w-[500px] rounded-xl" />
            <h2 className="p-10 font-bold text-5xl">
                Create Game
            </h2>
            <p className="text-xl">If you want to play a game with your friends,</p>
            <p className="text-xl p-2">then create a game here!</p>
            <CAJButton text="Create Game" route="/create"></CAJButton>
        </Column>
        <Column>
            <img src="/joingame.jpg" alt="joingame.jpg" className="w-[500px] rounded-xl" />
            <h2 className="p-10 font-bold text-5xl">
                Join Game
            </h2>
            <p className="text-xl">If you want to join a game with your friends</p>
            <p className="text-xl p-2">or with strangers then join here!</p>
            <CAJButton text="Join Game" route="/join"></CAJButton>
        </Column>
    </div>
}

function Column(props: PropsWithChildren<{}>) {
    return <div className="bg-slate-400 h-full p-12 rounded-3xl flex flex-col items-center">
        {props.children}
    </div>
}

function CAJButton(props: { text: string, route: string }) {
    return <a href={props.route} className="p-4 bg-green-700 rounded-xl">
        {props.text}
    </a>
}

export default Play
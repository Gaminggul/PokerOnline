import { useSession } from "next-auth/react";

function Home() {
    return <div className="flex">
        <Sidebar />
        <div>
            Home
        </div>
    </div>
}

function Profile() {
    const { data: session } = useSession({ required: true })
    return <div>
        <img src="/temp.png" alt="Pic" />
        {session?.user.name}
    </div>
}

function Sidebar() {
    return <div className="flex flex-col bg-slate-900 text-white fixed w-1/12 items-center h-full gap-5 text-2xl">
        <Profile />
        <a href="/play">Play</a>
        <a href="/social">Social</a>
        <a href="/settings">Settings</a>
    </div>
}

export default Home;
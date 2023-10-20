import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { ReactNode } from "react";
import { noop } from "functional-utilities";
import { Avatar } from "@nextui-org/react";
import DarkModeToggle from "./dark_mode_toggle";

export function Layout(props: { children: ReactNode }) {
    return (
        <div>
            <div className="">
                <Navigation></Navigation>
                <main className="min-h-screen w-full overflow-auto bg-slate-100 dark:bg-slate-700">
                    {props.children}
                </main>
            </div>
        </div>
    );
}

function SidebarButton(props: { text: string }) {
    return (
        <p className="w-full py-4 text-left hover:bg-slate-300 hover:dark:bg-slate-800">
            {props.text}
        </p>
    );
}

function Navigation() {
    return (
        <div className="flex gap-5 bg-slate-200 p-2 px-5 text-2xl text-black dark:bg-slate-900 dark:text-slate-100">
            <Link href="/">
                <SidebarButton text="Home" />
            </Link>
            <Link href="/social">
                <SidebarButton text="Social" />
            </Link>
            <Link href="/settings">
                <SidebarButton text="Settings" />
            </Link>
            <button
                onClick={() => {
                    signOut().catch(noop);
                }}
            >
                <SidebarButton text="Logout" />
            </button>
            <div className="ml-auto flex items-center gap-5">
                <DarkModeToggle></DarkModeToggle>
                <Profile />
            </div>
        </div>
    );
}

function Profile() {
    const { data: session } = useSession({ required: true });
    return (
        <div className="flex items-center justify-between gap-2">
            <p className="text-base">{session?.user.name}</p>
            <Avatar
                isBordered
                radius="sm"
                src={session?.user.image ?? "/favicon.ico"}
            />
        </div>
    );
}

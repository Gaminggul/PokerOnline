import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { type PropsWithChildren } from "react";
import { useChannel } from "../code/pusher";
import { api } from "../utils/api";
import { noop } from "functional-utilities";
import { Avatar } from "@nextui-org/react";

export function Layout(props: PropsWithChildren<{ show_banner: boolean }>) {
    return (
        <div>
            {props.show_banner ? (
                <div className="flex h-32 w-full items-center justify-center bg-white">
                    <p>Banner Bild</p>
                </div>
            ) : undefined}
            <div className="flex">
                <main className="min-h-screen w-full overflow-auto bg-slate-800">
                    {props.children}
                </main>
                <Sidebar></Sidebar>
            </div>
        </div>
    );
}

function SidebarButton(props: { text: string }) {
    return (
        <p className="w-full py-4 text-left text-white hover:bg-slate-800">
            {props.text}
        </p>
    );
}

function Sidebar() {
    return (
        <div className="max-w-1/6 flex h-screen w-64 min-w-[100px] flex-col items-stretch gap-3 bg-slate-900 p-6 py-4 text-2xl text-white">
            <Profile />
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
        </div>
    );
}

function Profile() {
    const { data: session } = useSession({ required: true });
    return (
        <div className="flex items-center justify-between">
            <p className="text-base">{session?.user.name}</p>
            <Avatar
                isBordered
                radius="sm"
                src={session?.user.image ?? "/favicon.ico"}
            />
        </div>
    );
}

import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { signOut, useSession } from "next-auth/react";
import type { PropsWithChildren, ReactNode } from "react";
import Link from "next/link";

import { api } from "../utils/api";

import "../styles/globals.css";
import { noop } from "../utils/common";
import Image from "next/image";

const MyApp: AppType<{ session: Session | null }> = ({
    Component,
    pageProps: { session, ...pageProps },
}) => {
    return (
        <SessionProvider session={session}>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </SessionProvider>
    );
};

function Layout(props: PropsWithChildren<unknown>) {
    return (
        <div>
            <div className="flex h-32 w-full items-center justify-center bg-white">
                <p>Banner Bild</p>
            </div>
            <div className="flex">
                <main className="h-screen w-full overflow-scroll bg-slate-700">
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
            <Link href="/play">
                <SidebarButton text="Play" />
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
        <div className="flex items-center">
            <p>{session?.user.name}</p>
            <Image src="/favicon.ico" alt="Profilepic" width={64} height={64} />
        </div>
    );
}

export default api.withTRPC(MyApp);

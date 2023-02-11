import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { signOut, useSession } from "next-auth/react";
import type { PropsWithChildren } from "react";
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
        <div className="flex">
            <Sidebar></Sidebar>
            <main className="h-screen w-full overflow-scroll bg-slate-700">
                {props.children}
            </main>
        </div>
    );
}

function SidebarButton(props: { text: string }) {
    return (
        <p className="w-full py-4 text-center text-white hover:bg-slate-800">
            {props.text}
        </p>
    );
}

function Sidebar() {
    return (
        <div className="flex h-screen w-1/12 min-w-[100px] flex-col items-stretch gap-3 bg-slate-900 text-2xl text-white">
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
        <div>
            <Image src="/favicon.ico" alt="Profilepic" width={64} height={64} />
            {session?.user.name}
        </div>
    );
}

export default api.withTRPC(MyApp);

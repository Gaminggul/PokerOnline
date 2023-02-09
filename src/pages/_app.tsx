import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { signOut, useSession } from "next-auth/react"
import { PropsWithChildren } from "react"
import Link from "next/link";

import { api } from "../utils/api";

import "../styles/globals.css";
import { noop } from "../utils/common";

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
  return <div>
    <Sidebar></Sidebar>
    <div className="flex">
      <div className="w-1/12" />
      <main className="bg-slate-700 w-full min-h-screen">{props.children}</main>
    </div>
  </div>
}


function SidebarButton(props: { text: string }) {
  return <p className="text-white hover:bg-slate-800 py-4 w-full text-center">
    {props.text}
  </p>
}

function Sidebar() {
  return <div className="flex flex-col bg-slate-900 text-white fixed w-1/12 items-stretch h-full gap-3 text-2xl">
    <Profile />
    <Link href="/"><SidebarButton text="Home" /></Link>
    <Link href="/play"><SidebarButton text="Play" /></Link>
    <Link href="/social"><SidebarButton text="Social" /></Link>
    <Link href="/settings"><SidebarButton text="Settings" /></Link>
    <button onClick={() => { signOut().catch(noop) }}><SidebarButton text="Logout" /></button>
  </div>
}


function Profile() {
  const { data: session } = useSession({ required: true })
  return <div>
    <img src="/temp.png" alt="Profilepic" />
    {session?.user.name}
  </div>
}

export default api.withTRPC(MyApp);

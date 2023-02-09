import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { api } from "../utils/api";

import "../styles/globals.css";

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

import { signOut, useSession } from "next-auth/react"
import { PropsWithChildren } from "react"

function Layout(props: PropsWithChildren<{}>) {
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
    <a href="/"><SidebarButton text="Home"/></a>
    <a href="/play"><SidebarButton text="Play" /></a>
    <a href="/social"><SidebarButton text="Social" /></a>
    <a href="/settings"><SidebarButton text="Settings" /></a>
    <button onClick={() => signOut()}><SidebarButton text="Logout" /></button>
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

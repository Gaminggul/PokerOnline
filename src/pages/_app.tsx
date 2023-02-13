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
            <Component {...pageProps} />
        </SessionProvider>
    );
};

export default api.withTRPC(MyApp);

import type {Metadata} from "next";
import "./globals.css";
import React from "react";

import {ClientShell} from "@/client-shell";

export const metadata: Metadata = {
    title: "Academic work",
    description: "Some academic work I've started",
};


export default function RootLayout({children}: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>
        <ClientShell>{children}</ClientShell>
        </body>
        </html>
    );
}

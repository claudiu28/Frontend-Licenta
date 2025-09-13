"use client";

import React, {useState} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {Toaster} from "sonner";
import {AuthProvider} from "@/provider/AuthProvider";

export function ClientShell({children}: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () => new QueryClient({
            defaultOptions: {
                queries: {retry: 1},
            },
        })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>{children}</AuthProvider>
            <Toaster/>
        </QueryClientProvider>
    );
}

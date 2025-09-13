import type { Metadata } from "next"
import { FeedInterface } from "@/components/FeedInterface"
import { Sidebar } from "@/components/Sidebar"
import React from "react";

export const metadata: Metadata = {
    title: "Social Feed",
    description: "Your social media feed with posts from friends",
}

export default function FeedPage() {
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/30">
            <aside className="sticky top-0 h-screen">
                <Sidebar/>
            </aside>
            <main className="flex-1 overflow-y-auto">

                <div className="flex-1 md:ml-0">
                    <FeedInterface/>
                </div>
            </main>
        </div>
    )
}
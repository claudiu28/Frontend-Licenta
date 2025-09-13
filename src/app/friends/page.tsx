import {FriendsInterface} from "@/components/FriendsInterface"
import {Sidebar} from "@/components/Sidebar"
import React from "react";

export default function FriendsPage() {
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/30">
            <aside className="sticky top-0 h-screen">
                <Sidebar/>
            </aside>
            <main className="flex-1 overflow-y-auto">

                <div className="flex-1 md:ml-0">
                    <FriendsInterface/>
                </div>
            </main>
        </div>
    )
}

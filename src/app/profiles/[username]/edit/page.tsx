"use client"

import React from "react"
import {Sidebar} from "@/components/Sidebar"
import ProfileEditForm from "@/components/ProfileEdit"
import {useCurrentUser} from "@/hooks/useCurrentUser"
import {usePublicProfile, useWellnessPublicProfile} from "@/hooks/useProfile";
import {notFound} from "next/navigation";

interface EditProfilePageProps {
    params: Promise<{ username: string }>
}

export default function EditProfilePage({params}: EditProfilePageProps) {
    const {me: me, isLoadingMe: isLoadingMe} = useCurrentUser();
    const {username} = React.use(params)
    const {isLoading: loadingUser} = usePublicProfile(username);
    const {isLoading: loadingWellness} = useWellnessPublicProfile(username);

    if (isLoadingMe || loadingUser || loadingWellness) {
        return <div className="p-8 text-center">Loading profile...</div>;
    }

    if (me && me?.userEssentials?.username !== username) {
        notFound();
    }
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/30">
            <aside className="sticky top-0 h-screen">
                <Sidebar/>
            </aside>
            <main className="flex-1 overflow-y-auto">

                <div className="flex-1 md:ml-0">
                    <ProfileEditForm/>
                </div>
            </main>
        </div>
    )
}

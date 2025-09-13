"use client";

import React, {use} from "react";
import Link from "next/link";
import {usePublicProfile, useWellnessPublicProfile} from "@/hooks/useProfile";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

import {Sidebar} from "@/components/Sidebar";
import {
    User,
    MapPin,
    Mail,
    Calendar,
    Activity,
    Target,
    Apple,
    Edit,
    Mars,
    Venus,
    Transgender, Dumbbell, BarChart, Moon, Droplet
} from "lucide-react";
import {useCurrentUser} from "@/hooks/useCurrentUser";
import {notFound} from "next/navigation";
import {UserPostsTabs} from "@/components/ProfilePostTab";

interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

export default function ProfilePage({params}: ProfilePageProps) {
    const {username} = use(params);

    const {me: me, isLoadingMe: isLoadingMe} = useCurrentUser();
    const {data: user, isLoading: loadingUser} = usePublicProfile(username);
    const {data: wellness, isLoading: loadingWellness} = useWellnessPublicProfile(username);

    if (isLoadingMe || loadingUser || loadingWellness) {
        return <div className="p-8 text-center">Loading profile...</div>;
    }

    if (me && me.userEssentials?.username !== username) {
        notFound();
    }

    const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || user?.userEssentials?.username.slice(0, 2).toUpperCase();

    const age = wellness?.birthDate ? new Date().getFullYear() - new Date(wellness.birthDate).getFullYear() : null;
    const getGenderIcon = (gender: string | undefined) => {
        switch (gender?.toLowerCase()) {
            case "MALE":
                return <Mars className="w-4 h-4 text-muted-foreground"/>;
            case "FEMALE":
                return <Venus className="w-4 h-4 text-muted-foreground"/>;
            default:
                return <Transgender className="w-4 h-4 text-muted-foreground"/>;
        }
    };
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/30">
            <aside className="sticky top-0 h-screen">
                <Sidebar/>
            </aside>
            <main className="flex-1 overflow-y-auto">

                <div className="flex-1 md:ml-0">
                    <div className="container mx-auto p-4 lg:p-8">
                        <div className="max-w-5xl mx-auto space-y-8">
                            <div
                                className="text-center py-8 px-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 relative">
                                <div className="absolute top-4 right-4">
                                    <Link href={`/profiles/${username}/edit`}>
                                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                                            <Edit className="w-4 h-4"/>
                                            Edit Profile
                                        </Button>
                                    </Link>
                                </div>
                                <Avatar className="h-32 w-32 mx-auto mb-6 border-4 border-primary/20 shadow-lg">
                                    <AvatarImage className="object-contain"
                                                 src={
                                                     me?.profilePicture?.startsWith("http")
                                                         ? me?.profilePicture
                                                         : me?.profilePicture
                                                             ? `http://localhost:8081/${me?.profilePicture}`
                                                             : undefined
                                                 }/>
                                    <AvatarFallback
                                        className="text-2xl font-bold bg-primary/10 text-primary">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">
                                    {user?.firstName && user?.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : `@${user?.userEssentials?.username}`}
                                </h1>

                                <p className="text-muted-foreground text-lg mb-4">@{user?.userEssentials?.username}</p>

                                {user?.bio &&
                                    <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">{user.bio}</p>}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card className="enhanced-card border-green-100 bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <User className="w-5 h-5 text-primary"/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Personal Information</CardTitle>
                                                <CardDescription>Details about user</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex items-center gap-3">
                                                <User className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Username:</span>
                                                <span
                                                    className="text-sm font-medium">{user?.userEssentials?.username ?? "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Email:</span>
                                                <span
                                                    className="text-sm font-medium">{user?.userEssentials?.email ?? "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Location:</span>
                                                <span className="text-sm font-medium">
                                                    {[user?.city, user?.country].filter(Boolean).join(", ") || "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="enhanced-card border-green-100 bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Activity className="w-5 h-5 text-primary"/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Wellness Information</CardTitle>
                                                <CardDescription>Health and lifestyle</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Age:</span>
                                                <span className="text-sm font-medium">{age ?? "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {getGenderIcon(wellness?.gender)}
                                                <span className="text-sm text-muted-foreground">Gender:</span>
                                                <span className="text-sm font-medium">{wellness?.gender ?? "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Activity className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Height:</span>
                                                <span
                                                    className="text-sm font-medium">{wellness?.heightCm ? `${wellness.heightCm} cm` : "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Target className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Weight:</span>
                                                <span
                                                    className="text-sm font-medium">{wellness?.weightKg ? `${wellness.weightKg} kg` : "N/A"}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="enhanced-card border-green-100 bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Target className="w-5 h-5 text-primary"/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Daily Target</CardTitle>
                                                <CardDescription>Daily goals</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex items-center gap-3">
                                                <Moon className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Sleep:</span>
                                                <span
                                                    className="text-sm font-medium">{wellness?.sleepTargetHours ? `${wellness.sleepTargetHours} h` : "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Droplet className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Water:</span>
                                                <span
                                                    className="text-sm font-medium">{wellness?.hydrationTargetMl ? `${wellness.hydrationTargetMl} ml` : "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Activity className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Steps:</span>
                                                <span
                                                    className="text-sm font-medium">{wellness?.stepsTarget?.toLocaleString() ?? "N/A"}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="enhanced-card border-green-100 bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <BarChart className="w-5 h-5 text-primary"/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Other Stats</CardTitle>
                                                <CardDescription>Additional info</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex items-center gap-3">
                                                <Activity className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Activity Level:</span>
                                                <span
                                                    className="text-sm font-medium">{wellness?.activityLevel ?? "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Dumbbell className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Equipment:</span>
                                                <span
                                                    className="text-sm font-medium">{wellness?.equipmentAccess ?? "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Target className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Goal:</span>
                                                <span
                                                    className="text-sm font-medium">{wellness?.primaryGoal ?? "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Apple className="w-4 h-4 text-muted-foreground"/>
                                                <span className="text-sm text-muted-foreground">Meals per Day:</span>
                                                <span
                                                    className="text-sm font-medium">{wellness?.mealsPerDay ?? "N/A"}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {wellness &&
                                (wellness.dislikedFoods) && (
                                    <Card className="enhanced-card border-green-100 bg-card/50 backdrop-blur-sm">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                    <Apple className="w-5 h-5 text-primary"/>
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl">Dietary Information</CardTitle>
                                                    <CardDescription>
                                                        Preferences for foods and nutrition
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                                {wellness.dislikedFoods && (
                                                    <div>
                                                        <h4 className="font-medium text-sm text-foreground mb-2">Dislikes</h4>
                                                        <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
                                                            {wellness.dislikedFoods}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                        </div>
                        <UserPostsTabs username={username}/>
                    </div>
                </div>
            </main>

        </div>
    );
}

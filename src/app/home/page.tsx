"use client"
import {useEffect} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {
    BookOpen,
    Dumbbell,
    ChevronRight,
    Leaf,
    Loader2,
    Check,
    Quote,
    Hand
} from "lucide-react"
import Link from "next/link"
import {useRouter} from "next/navigation"
import {UserDetails, UserOnline} from "@/types/profile/UserType";
import {useQuery} from "@tanstack/react-query";
import {apiClient} from "@/api/client";
import {useAuth} from "@/hooks/useAuth";
import {toast} from "sonner";
import {useCurrentUser} from "@/hooks/useCurrentUser";
import {getNavigationItems} from "@/const/navigations-items";


const LoadingScreen = () => (
    <div
        className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary"/>
            <p className="text-muted-foreground">Loading your nutrition hub..</p>
        </div>
    </div>
);

const getPresence = async (): Promise<UserOnline> => {
    console.log("[Profile] Take user presence");
    return apiClient<UserOnline>("profile/me/presence", "GET");

}

export default function HomePage() {

    const {logout, isInitialized, isLoggedIn} = useAuth();
    const {me, isLoadingMe} = useCurrentUser();
    const router = useRouter();

    const {data: presence} = useQuery({
        queryKey: ["presence"],
        queryFn: getPresence,
        refetchInterval: 300_000,
        refetchOnWindowFocus: true,
        enabled: isLoggedIn && isInitialized,
        retry: 1
    });

    const handleLogout = async () => {
        try {
            if (me?.userEssentials?.username) {
                await logout({username: me?.userEssentials.username});
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            router.push("/login");
        }
    }

    useEffect(() => {
        if (isInitialized && !isLoggedIn) {
            router.replace("/login");
        }
    }, [isInitialized, isLoggedIn, router]);

    if (!isInitialized || !isLoggedIn || isLoadingMe || !me) {
        return <LoadingScreen/>;
    }

    const quickActions = [
        {name: "Find Inspiration", href: "/quote", icon: Quote, color: "bg-yellow-300"},
        {name: "Start Workout", href: "/workouts", icon: Dumbbell, color: "bg-red-500"},
        {name: "Take a Course", href: "/learning", icon: BookOpen, color: "bg-blue-600"},
        {name: "Take a challenge", href: "/challenge", icon: Check, color: "bg-green-600"},
    ]
    const navigationItems = getNavigationItems(me?.userEssentials?.username)

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            <header className="bg-white/90 backdrop-blur-md border-b border-green-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary rounded-xl shadow-sm">
                                    <Leaf className="h-6 w-6 text-white"/>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-foreground">NutritionLearn</h1>
                                    <p className="text-xs text-muted-foreground hidden sm:block">Nutrition &
                                        Wellness</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                                    <AvatarImage
                                        src={
                                            me?.profilePicture?.startsWith("http")
                                                ? me?.profilePicture
                                                : me?.profilePicture
                                                    ? `http://localhost:8081/${me?.profilePicture}`
                                                    : undefined
                                        }/>
                                    <AvatarFallback
                                        className="bg-primary text-white font-semibold">
                                        {me?.userEssentials?.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="hidden sm:block">
                                <div className="text-sm font-semibold text-foreground">
                                    {me?.userEssentials?.username}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {me?.userEssentials?.email}
                                </div>
                                {presence && (
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            presence.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                        }`}/>
                                        <span className="text-xs text-muted-foreground hidden sm:inline">
                                            {presence.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="hover:bg-red-50 hover:border-red-200 bg-transparent"
                            >
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-12">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-foreground mb-3 text-balance inline-flex items-center gap-3">
                            <Hand className="h-7 w-7 text-yellow-500" aria-hidden/>
                            Welcome back, {me?.userEssentials?.username ?? 'friend'}!
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                            Ready to continue your nutrition and wellness journey? Let' s start now!!!.
                        </p>
                    </div>
                </div>

                <div className="mb-12">
                    <h3 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {quickActions.map((action) => (
                            <Link key={action.name} href={action.href}>
                                <Card
                                    className="hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-0 shadow-lg bg-card">
                                    <CardContent className="p-6 text-center">
                                        <div
                                            className={`w-16 h-16 rounded-2xl ${action.color} text-white flex items-center justify-center mx-auto mb-4 shadow-lg`}
                                        >
                                            <action.icon className="h-8 w-8"/>
                                        </div>
                                        <h4 className="font-semibold text-foreground text-lg">{action.name}</h4>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-bold text-foreground mb-6">All Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {navigationItems.map((item) => (
                            <Link key={item.name} href={item.href}>
                                <Card
                                    className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full border-0 shadow-lg bg-card group">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center space-x-4">
                                            <div
                                                className={`p-3 rounded-2xl ${item.color} text-white shadow-lg group-hover:scale-110 transition-transform`}
                                            >
                                                <item.icon className="h-6 w-6"/>
                                            </div>
                                            <div className="flex-1">
                                                <CardTitle
                                                    className="text-lg font-semibold text-foreground">{item.name}</CardTitle>
                                                <CardDescription
                                                    className="text-muted-foreground">{item.description}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary"
                                                   className="bg-muted text-muted-foreground font-medium">
                                                Available
                                            </Badge>
                                            <ChevronRight
                                                className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform"/>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}

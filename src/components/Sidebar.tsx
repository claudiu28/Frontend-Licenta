"use client"

import {useEffect, useState} from "react"
import Link from "next/link"
import {usePathname} from "next/navigation"
import {Button} from "@/components/ui/button"
import {ScrollArea} from "@/components/ui/scroll-area"
import {ChevronLeft, ChevronRight, Menu, X} from "lucide-react"
import {cn} from "@/lib/utils"
import {useCurrentUser} from "@/hooks/useCurrentUser";
import {getNavigationItems} from "@/const/navigations-items";
export function Sidebar() {


    const {me} = useCurrentUser();
    const navigationItems = getNavigationItems(me?.userEssentials?.username)

    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsCollapsed(true)
            }
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        setIsMobileOpen(false)
    }, [pathname])

    return (
        <>
            {isMobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsMobileOpen(false)}/>
            )}

            <Button
                variant="ghost"
                size="sm"
                className="fixed top-4 left-4 z-50 h-10 w-10 md:hidden"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="h-4 w-4"/> : <Menu className="h-4 w-4"/>}
            </Button>

            <div
                className={cn(
                    "relative h-screen bg-background border-r transition-all duration-300 ease-in-out",
                    "fixed md:relative z-50 md:z-auto",
                    "transform md:transform-none",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    isCollapsed ? "w-16 md:w-16 lg:w-20" : "w-72 sm:w-80 md:w-64 lg:w-72 xl:w-80",
                    "md:h-screen",
                )}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "absolute top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-md transition-all",
                        "hidden md:flex",
                        isCollapsed ? "-right-3" : "-right-3",
                    )}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <ChevronRight className="h-3 w-3"/> : <ChevronLeft className="h-3 w-3"/>}
                </Button>

                <div
                    className={cn("flex h-16 items-center border-b", isCollapsed ? "px-2 justify-center" : "px-4 sm:px-6")}>
                    {isCollapsed ? <Menu className="h-6 w-6"/> :
                        <h2 className="text-lg font-semibold truncate">Menu</h2>}
                </div>

                <ScrollArea className="flex-1 px-2 py-4">
                    <div className="space-y-2">
                        {navigationItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link key={item.href} href={item.href}>
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                            isActive && "bg-accent text-accent-foreground",
                                            isCollapsed && "justify-center px-2",
                                            !isCollapsed && "px-3 sm:px-4",
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "flex items-center justify-center rounded-md text-white shrink-0",
                                                isCollapsed ? "h-8 w-8" : "h-8 w-8 sm:h-9 sm:w-9",
                                                item.color,
                                            )}
                                        >
                                            <Icon className={cn(isCollapsed ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5")}/>
                                        </div>

                                        {!isCollapsed && (
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className={cn("font-medium truncate", "text-sm sm:text-base")}>{item.name}</div>
                                                <div
                                                    className={cn("text-muted-foreground truncate", "text-xs sm:text-sm")}>
                                                    {item.description}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>
        </>
    )
}

"use client"

import {useRef, useState} from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {useCurrentUser} from "@/hooks/useCurrentUser"
import {apiClient} from "@/api/client"
import {Notify} from "@/types/social/Notification"
import {Page} from "@/types/page/page"
import {BellIcon, CheckIcon} from "lucide-react"
import {InfiniteData, useInfiniteQuery, useMutation} from "@tanstack/react-query"
import {ErrorResponse} from "@/types/ErrorType"
import {useInfiniteScroll} from "@/hooks/useInfiniteScroll"
import {toast} from "sonner"

const allNotificationsCall = async (): Promise<Page<Notify>> => {
    return apiClient<Page<Notify>>("notifications/all", "GET")
}
const unreadNotificationsCall = async (): Promise<Page<Notify>> => {
    return apiClient<Page<Notify>>("notifications/unread", "GET")
}
const deleteNotificationCall = async (notificationId: number): Promise<Notify> => {
    return apiClient<Notify>(`notifications/edit/${notificationId}`, "DELETE")
}
const markAsReadNotificationsCall = async (notificationId: number) => {
    return apiClient<Notify>(`notifications/edit/${notificationId}`, "PATCH")
}

export function NotificationsInterface() {
    const {me: userMe} = useCurrentUser()
    const [activeTab, setActiveTab] = useState("all")

    const {data: allData, fetchNextPage, hasNextPage, isFetchingNextPage} =
        useInfiniteQuery<Page<Notify>, ErrorResponse, InfiniteData<Page<Notify>>, [string], number>({
            queryKey: ["all-notifications"],
            queryFn: () => allNotificationsCall(),
            initialPageParam: 0,
            getNextPageParam: (lastPage) => (!lastPage.last ? lastPage.number + 1 : undefined),
            enabled: !!userMe,
        })

    const {
        data: unreadData,
        fetchNextPage: fetchNextPage2,
        hasNextPage: hasNextPage2,
        isFetchingNextPage: isFetchingNextPage2,
    } = useInfiniteQuery<Page<Notify>, ErrorResponse, InfiniteData<Page<Notify>>, [string], number>({
        queryKey: ["unread-notifications"],
        queryFn: () => unreadNotificationsCall(),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (!lastPage.last ? lastPage.number + 1 : undefined),
        enabled: !!userMe,
    })

    const deleteNotifyMutation = useMutation<Notify, ErrorResponse, number>({
        mutationFn: (notificationId: number) => deleteNotificationCall(notificationId),
        onSuccess: () => toast.success("Notification deleted"),
        onError: (error: ErrorResponse) =>
            toast.error(error.message || "Failed to delete notification"),
    })

    const updateNotifyMutation = useMutation<Notify, ErrorResponse, number>({
        mutationFn: (notificationId: number) => markAsReadNotificationsCall(notificationId),
        onSuccess: () => toast.success("Notification marked as read"),
        onError: (error: ErrorResponse) =>
            toast.error(error.message || "Failed to mark notification as read"),
    })

    const unreadNotifications = unreadData ? unreadData.pages.flatMap((page) => page.content) : []
    const notifications = allData ? allData.pages.flatMap((page) => page.content) : []

    const loadMoreRefs = useRef<HTMLDivElement | null>(null)
    const loadMoreRefs2 = useRef<HTMLDivElement | null>(null)
    useInfiniteScroll(loadMoreRefs, hasNextPage, isFetchingNextPage, fetchNextPage)
    useInfiniteScroll(loadMoreRefs2, hasNextPage2, isFetchingNextPage2, fetchNextPage2)

    const handleDeleteNotification = (notificationId: number) => {
        deleteNotifyMutation.mutate(notificationId)
    }

    const handleMarkAsReadNotifications = (notificationId: number) => {
        updateNotifyMutation.mutate(notificationId)
    }

    const NotificationCard = ({notification}: { notification: Notify }) => (
        <Card
            className={`enhanced-card transition-all duration-200 ${
                !notification.isRead ? "border-primary/30 bg-primary/5" : ""
            }`}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                            <Badge
                                variant={notification.isRead ? "secondary" : "default"}
                                className="text-xs"
                            >
                                {notification.isRead ? "Read" : "Unread"}
                            </Badge>
                        </div>

                        <p
                            className={`text-sm ${
                                !notification.isRead
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {notification.text}
                        </p>
                    </div>

                    <div className="flex gap-1 ml-2">
                        {!notification.isRead && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                    handleMarkAsReadNotifications(notification.notificationId!)
                                }
                                className="h-8 px-2 text-xs hover:bg-primary/10"
                            >
                                Mark Read
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteNotification(notification.notificationId!)}
                            className="h-8 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="grid w-fit grid-cols-2">
                        <TabsTrigger value="all" className="tab-trigger">
                            All Notifications
                            <Badge variant="secondary" className="ml-2">
                                {notifications.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="unread" className="tab-trigger">
                            Unread
                            <Badge variant="default" className="ml-2">
                                {unreadNotifications.length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all" className="space-y-4">
                    {notifications.length === 0 ? (
                        <Card className="enhanced-card">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                                    <BellIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
                                <p className="text-muted-foreground">
                                    You're all caught up! New notifications will appear here.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <NotificationCard
                                    key={notification.notificationId}
                                    notification={notification}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="unread" className="space-y-4">
                    {unreadNotifications.length === 0 ? (
                        <Card className="enhanced-card">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                                    <CheckIcon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                                <p className="text-muted-foreground">You have no unread notifications.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {unreadNotifications.map((notification) => (
                                <NotificationCard
                                    key={notification.notificationId}
                                    notification={notification}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

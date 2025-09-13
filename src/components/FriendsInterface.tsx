"use client"

import React, {useState} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Badge} from "@/components/ui/badge"
import {ScrollArea} from "@/components/ui/scroll-area"
import {
    Users,
    UserPlus,
    Clock,
    MessageCircle,
    UserMinus,
    Check,
    X,
    Sparkles,
} from "lucide-react"
import {Friend} from "@/types/social/Friend"
import {UserDetails} from "@/types/profile/UserType"
import {useCurrentUser} from "@/hooks/useCurrentUser"
import {apiClient} from "@/api/client"
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query"
import {Page} from "@/types/page/page"
import {ErrorResponse} from "@/types/ErrorType"
import {toast} from "sonner"
import {ListControls, Paginator} from "./Paginator"


const suggestedFriendsCall = async (page: number, size: number, direction: string): Promise<Page<UserDetails>> => {
    const queryParams = new URLSearchParams()
    queryParams.append("page", page.toString())
    queryParams.append("size", size.toString())
    queryParams.append("sort", `createdAt,${direction}`)
    return apiClient<Page<UserDetails>>(`friends/suggested?${queryParams}`, "GET")
}

const acceptedFriendsCall = async (page: number, size: number, direction: string): Promise<Page<Friend>> => {
    const queryParams = new URLSearchParams()
    queryParams.append("page", page.toString())
    queryParams.append("size", size.toString())
    queryParams.append("sort", `createdAt,${direction}`)
    return apiClient<Page<Friend>>(`friends/accepted?${queryParams}`, "GET")
}

const pendingFriendsCall = async (page: number, size: number, direction: string): Promise<Page<Friend>> => {
    const queryParams = new URLSearchParams()
    queryParams.append("page", page.toString())
    queryParams.append("size", size.toString())
    queryParams.append("sort", `createdAt,${direction}`)
    return apiClient<Page<Friend>>(`friends/pending?${queryParams}`, "GET")
}

const sendRequestCall = async (username: string): Promise<Friend> => {
    return apiClient<Friend>(`friends/friendship/${username}`, "POST")
}

const removeRequestCall = async (friendshipId: number): Promise<void> => {
    return apiClient<void>(`friends/friendship/${friendshipId}`, "DELETE")
}

const responseFriendshipCall = async (friendshipId: number, type: string): Promise<void> => {
    const queryParams = new URLSearchParams()
    queryParams.append("type", type)
    return apiClient<void>(`friends/response/${friendshipId}?${queryParams}`, "POST")
}

export function FriendsInterface() {
    const {me: meUser, isLoadingMe} = useCurrentUser()
    const [activeTab, setActiveTab] = useState("friends")
    const [page, setPage] = useState(0)
    const [size, setSize] = useState<5 | 10 | 25 | 50>(10)
    const [direction, setDirection] = useState<"asc" | "desc">("desc")

    const queryClient = useQueryClient()

    const {data: suggestedFriendsPaged} = useQuery<Page<UserDetails>, ErrorResponse>({
        queryKey: ["suggestedFriends", page, size, direction],
        queryFn: () => suggestedFriendsCall(page, size, direction),
        enabled: !!meUser,
    })

    const {data: acceptedFriendsPaged} = useQuery<Page<Friend>, ErrorResponse>({
        queryKey: ["acceptedFriends", page, size, direction],
        queryFn: () => acceptedFriendsCall(page, size, direction),
        enabled: !!meUser,
    })

    const {data: pendingFriendsPaged} = useQuery<Page<Friend>, ErrorResponse>({
        queryKey: ["pendingFriends", page, size, direction],
        queryFn: () => pendingFriendsCall(page, size, direction),
        enabled: !!meUser,
    })

    const sendRequestMutation = useMutation<Friend, ErrorResponse, string>({
        mutationFn: (username) => sendRequestCall(username),
        onSuccess: () => {
            toast.success("Friend request sent!");
            queryClient.invalidateQueries({queryKey: ["pendingFriends"]}).then();
            queryClient.invalidateQueries({queryKey: ["acceptedFriends"]}).then()
            queryClient.invalidateQueries({queryKey: ["suggestedFriends"]}).then();
        },
        onError: (err) => {
            toast.error(err.message || "Something went wrong");
            queryClient.invalidateQueries({queryKey: ["pendingFriends"]}).then();
            queryClient.invalidateQueries({queryKey: ["acceptedFriends"]}).then()
            queryClient.invalidateQueries({queryKey: ["suggestedFriends"]}).then();
        }
    })

    const removeRequestMutation = useMutation<void, ErrorResponse, number>({
        mutationFn: (id) => removeRequestCall(id),
        onSuccess: () => {
            toast.success("Friend request removed!");
            queryClient.invalidateQueries({queryKey: ["acceptedFriends"]}).then()
            queryClient.invalidateQueries({queryKey: ["suggestedFriends"]}).then();
            queryClient.invalidateQueries({queryKey: ["pendingFriends"]}).then()
        },
        onError: (err) => {
            toast.error(err.message || "Something went wrong");
            queryClient.invalidateQueries({queryKey: ["pendingFriends"]}).then();
            queryClient.invalidateQueries({queryKey: ["acceptedFriends"]}).then()
            queryClient.invalidateQueries({queryKey: ["suggestedFriends"]}).then();
        }
    })

    const responseFriendshipMutation = useMutation<void, ErrorResponse, { id: number; type: string }>({
        mutationFn: ({id, type}) => responseFriendshipCall(id, type),
        onSuccess: () => {
            toast.success("Friend request responded!");
            queryClient.invalidateQueries({queryKey: ["pendingFriends"]}).then()
            queryClient.invalidateQueries({queryKey: ["suggestedFriends"]}).then();
            queryClient.invalidateQueries({queryKey: ["acceptedFriends"]}).then()
        },
        onError: (err) => {
            toast.error(err.message || "Something went wrong");
            queryClient.invalidateQueries({queryKey: ["pendingFriends"]}).then();
            queryClient.invalidateQueries({queryKey: ["suggestedFriends"]}).then();
            queryClient.invalidateQueries({queryKey: ["acceptedFriends"]}).then();
        }
    })

    if (isLoadingMe) {
        return <div className="p-8 text-center">Loading friends...</div>
    }

    return (
        <div className="container mx-auto p-4 lg:p-8">
            <div className="p-6 border-b bg-white/80 backdrop-blur-sm">
                <h1 className="text-3xl font-bold text-foreground">Friends</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your network here
                </p>
            </div>

            <div className="flex-1 p-6">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="h-full"
                >
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="friends" className="flex gap-2">
                            <Users className="h-4 w-4"/>
                            Friends ({acceptedFriendsPaged?.totalElements})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="flex gap-2">
                            <Clock className="h-4 w-4"/>
                            Requests ({pendingFriendsPaged?.totalElements})
                        </TabsTrigger>
                        <TabsTrigger value="suggested" className="flex gap-2">
                            <Sparkles className="h-4 w-4"/>
                            Suggestions ({suggestedFriendsPaged?.totalElements})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="friends">
                        <ListControls
                            page={page}
                            size={size}
                            direction={direction}
                            total={acceptedFriendsPaged?.totalElements || 0}
                            onSizeChange={(s) => {
                                setPage(0);
                                setSize(s as 5 | 10 | 25 | 50);
                            }}
                            onDirectionChange={(d) => {
                                setPage(0);
                                setDirection(d);
                            }}
                        />
                        <ScrollArea className="h-full">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {acceptedFriendsPaged?.content.map((friend) => {
                                    const isSender = friend.senderUsername === meUser?.userEssentials?.username;
                                    const otherUser = isSender
                                        ? {username: friend.receiverUsername, image: friend.receiverProfileImage}
                                        : {username: friend.senderUsername, image: friend.senderProfileImage};

                                    return (
                                        <Card key={friend.friendshipId}>
                                            <CardContent className="p-6">
                                                <div className="flex items-center space-x-4">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={otherUser.image}/>
                                                        <AvatarFallback>{otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <p className="font-semibold truncate">{otherUser.username}</p>
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <Button size="sm" className="flex-1 btn-accept">
                                                        <MessageCircle className="h-4 w-4 mr-2"/>
                                                        Message
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => removeRequestMutation.mutate(friend.friendshipId)}
                                                    >
                                                        <UserMinus className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                            <Paginator
                                page={page}
                                size={size}
                                total={acceptedFriendsPaged?.totalElements || 0}
                                onPageChange={setPage}
                            />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="pending">
                        <ListControls page={page} size={size}
                                      direction={direction} total={pendingFriendsPaged?.totalElements || 0}
                                      onSizeChange={(s) => {
                                          setPage(0)
                                          setSize(s as 5 | 10 | 25 | 50)
                                      }}
                                      onDirectionChange={(d) => {
                                          setPage(0)
                                          setDirection(d)
                                      }}
                        />
                        <ScrollArea className="h-full">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pendingFriendsPaged?.content.map((req) => (
                                    <Card key={req.friendshipId}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage
                                                        src={
                                                            req.senderUsername !== meUser?.userEssentials?.username ?
                                                                req.senderProfileImage : req.receiverProfileImage
                                                        }/>
                                                    <AvatarFallback>
                                                        {req.senderUsername.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">
                                                        {req.senderUsername}
                                                    </p>
                                                    <Badge variant="secondary" className="text-xs">
                                                        Waiting for your response
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 btn-accept"
                                                    onClick={() =>
                                                        responseFriendshipMutation.mutate({
                                                            id: req.friendshipId,
                                                            type: "ACCEPTED",
                                                        })
                                                    }>
                                                    <Check className="h-4 w-4 mr-2"/>
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="btn-reject text-white"
                                                    onClick={() =>
                                                        responseFriendshipMutation.mutate({
                                                            id: req.friendshipId,
                                                            type: "REJECTED",
                                                        })
                                                    }>
                                                    <X className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <Paginator
                                page={page}
                                size={size}
                                total={pendingFriendsPaged?.totalElements || 0}
                                onPageChange={setPage}
                            />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="suggested">
                        <ListControls
                            page={page} size={size}
                            direction={direction} total={suggestedFriendsPaged?.totalElements || 0}
                            onSizeChange={(s) => {
                                setPage(0)
                                setSize(s as 5 | 10 | 25 | 50)
                            }}
                            onDirectionChange={(d) => {
                                setPage(0)
                                setDirection(d)
                            }}
                        />
                        <ScrollArea className="h-full">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {suggestedFriendsPaged?.content.map((sug) => (
                                    <Card
                                        key={sug.userEssentials?.username}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage
                                                        src={
                                                            sug.profilePicture?.startsWith("http")
                                                                ? sug.profilePicture
                                                                : sug.profilePicture
                                                                    ? `http://localhost:8081/${sug.profilePicture}`
                                                                    : undefined
                                                        }/>
                                                    <AvatarFallback>{sug.userEssentials?.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">
                                                        {sug.userEssentials?.username}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {sug.userEssentials?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="w-full mt-4 btn-accept"
                                                onClick={() =>
                                                    sug.userEssentials?.username &&
                                                    sendRequestMutation.mutate(
                                                        sug.userEssentials.username
                                                    )
                                                }
                                            >
                                                <UserPlus className="h-4 w-4 mr-2"/>
                                                Add friend
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <Paginator page={page} size={size} total={suggestedFriendsPaged?.totalElements || 0}
                                       onPageChange={setPage}/>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

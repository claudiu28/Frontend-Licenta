"use client"

import React, {useEffect, useRef, useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {ScrollArea} from "@/components/ui/scroll-area"
import {Send, Plus, MoreVertical, Edit3, Trash2, Users} from "lucide-react"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog"
import {Card} from "@/components/ui/card"
import {apiClient} from "@/api/client"
import {
    ChatMessage,
    Conversation,
    CreateChatRequest,
    CreateMessageRequest,
    UpdateChatRequest,
    UpdateMessageRequest
} from "@/types/social/Chat"
import {Page} from "@/types/page/page"
import {InfiniteData, useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query"
import {ErrorResponse} from "@/types/ErrorType"
import {useCurrentUser} from "@/hooks/useCurrentUser"
import {Friend} from "@/types/social/Friend"
import {toast} from "sonner"
import {useInfiniteScroll} from "@/hooks/useInfiniteScroll";

const acceptedFriendsCall = async (page: number, size: number): Promise<Page<Friend>> => {
    return apiClient<Page<Friend>>(`friends/accepted?page=${page}&size=${size}`, "GET")
}

const createConversationCall = async (
    chatName: string,
    type: "PRIVATE" | "GROUP",
    data: CreateChatRequest
) =>
    apiClient<Conversation>(
        `chat/conversation/${encodeURIComponent(chatName)}?type=${type}`,
        "POST",
        data
    )

const allUserConversations = async (size: number, page: number): Promise<Page<Conversation>> =>
    apiClient<Page<Conversation>>(`chat/conversations?size=${size}&page=${page}`, "GET")

const allConversationMessages = async (conversationId: number, size: number, page: number) =>
    apiClient<Page<ChatMessage>>(`chat/conversation/${conversationId}/messages?size=${size}&page=${page}`, "GET")

const createMessageCall = async (conversationId: number, data: CreateMessageRequest): Promise<ChatMessage> =>
    apiClient<ChatMessage>(`chat/conversation/${conversationId}/message`, "POST", data)

const updateConversationCall = async (conversationId: number, data: UpdateChatRequest) =>
    apiClient<Conversation>(`chat/conversation/${conversationId}`, "PATCH", data)

const updateMessageCall = async (messageId: number, data: UpdateMessageRequest) =>
    apiClient<ChatMessage>(`chat/messages/${messageId}`, "PATCH", data)

const deleteConversationCall = async (conversationId: number): Promise<void> =>
    apiClient<void>(`chat/conversation/${conversationId}`, "DELETE")

const deleteMessageCall = async (messageId: number): Promise<void> =>
    apiClient<void>(`chat/message/${messageId}`, "DELETE")

export function ChatInterface() {
    const {me: currentUser} = useCurrentUser()
    const queryClient = useQueryClient()

    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [newMessage, setNewMessage] = useState("")
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
    const [editingText, setEditingText] = useState("")
    const [isNewChatOpen, setIsNewChatOpen] = useState(false)
    const [isEditChatOpen, setIsEditChatOpen] = useState(false)
    const [chatToEdit, setChatToEdit] = useState<Conversation | null>(null)
    const [chatName, setChatName] = useState("")
    const [conversationType, setConversationType] = useState<"PRIVATE" | "GROUP">("PRIVATE")
    const [selectedFriends, setSelectedFriends] = useState<string[]>([])

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({behavior: "smooth"})

    const {data: acceptedFriendsPaged, fetchNextPage, hasNextPage, isFetchingNextPage} = useInfiniteQuery<
        Page<Friend>,
        ErrorResponse,
        InfiniteData<Page<Friend>>,
        [string],
        number
    >({
        queryKey: ["acceptedFriends"],
        queryFn: ({pageParam = 0}) => acceptedFriendsCall(pageParam, 20),
        getNextPageParam: (last) => (!last.last ? last.number + 1 : undefined),
        initialPageParam: 0,
        enabled: !!currentUser,
    })
    const friends = acceptedFriendsPaged?.pages.flatMap((p) => p.content) ?? []
    const loadMoreRefs = useRef<HTMLDivElement | null>(null);
    useInfiniteScroll(loadMoreRefs, hasNextPage, isFetchingNextPage, fetchNextPage);


    const {
        data: conversationsQuery,
        fetchNextPage: fetchNextPage2,
        hasNextPage: hasNextPage2,
        isFetchingNextPage: isFetchingNextPage2
    } = useInfiniteQuery<
        Page<Conversation>,
        ErrorResponse,
        InfiniteData<Page<Conversation>>,
        [string],
        number
    >({
        queryKey: ["conversations"],
        queryFn: ({pageParam = 0}) => allUserConversations(20, pageParam),
        getNextPageParam: (last) => (!last.last ? last.number + 1 : undefined),
        initialPageParam: 0,
        enabled: !!currentUser,
    })
    const conversations = conversationsQuery?.pages.flatMap((p) => p.content) ?? []
    const loadMoreRefs2 = useRef<HTMLDivElement | null>(null);
    useInfiniteScroll(loadMoreRefs2, hasNextPage2, isFetchingNextPage2, fetchNextPage2);

    const {
        data: messagesQuery,
        fetchNextPage: fetchNextPage3,
        hasNextPage: hasNextPage3,
        isFetchingNextPage: isFetchingNextPage3
    } = useInfiniteQuery<
        Page<ChatMessage>,
        ErrorResponse,
        InfiniteData<Page<ChatMessage>>,
        [string, number | undefined],
        number
    >({
        queryKey: ["messages", selectedConversation?.id],
        queryFn: ({pageParam = 0}) =>
            allConversationMessages(selectedConversation?.id!, 20, pageParam),
        getNextPageParam: (last) => (!last.last ? last.number + 1 : undefined),
        initialPageParam: 0,
        enabled: !!selectedConversation,
    })
    const messages = messagesQuery?.pages.flatMap((p) => p.content) ?? []
    const loadMoreRefs3 = useRef<HTMLDivElement | null>(null);
    useInfiniteScroll(loadMoreRefs3, hasNextPage3, isFetchingNextPage3, fetchNextPage3);

    useEffect(() => {
        scrollToBottom()
    }, [messages])


    const createConversation = useMutation({
        mutationFn: ({chatName, type, users}: { chatName: string; type: "PRIVATE" | "GROUP"; users: string[] }) =>
            createConversationCall(chatName, type, {usernames: users}),
        onSuccess: (newConv) => {
            queryClient.invalidateQueries({queryKey: ["conversations"]})
            setSelectedConversation(newConv)
            setIsNewChatOpen(false)
            toast.success("Conversation created")
        },
        onError: () => toast.error("Could not create conversation"),
    })

    const updateConversation = useMutation({
        mutationFn: ({id, data}: { id: number; data: UpdateChatRequest }) =>
            updateConversationCall(id, data),
        onSuccess: (updatedConv) => {
            queryClient.invalidateQueries({queryKey: ["conversations"]})
            setSelectedConversation(updatedConv)
            setIsEditChatOpen(false)
            toast.success("Conversation updated")
        },
        onError: () => toast.error("Could not update conversation"),
    })

    const deleteConversation = useMutation({
        mutationFn: (id: number) => deleteConversationCall(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["conversations"]}).then();
            setSelectedConversation(null)
            toast.success("Conversation deleted")
        },
    })

    const sendMessage = useMutation({
        mutationFn: (text: string) =>
            createMessageCall(selectedConversation?.id!, {message: text}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["messages", selectedConversation?.id]}).then();
            setNewMessage("")
            scrollToBottom()
        },
    })

    const updateMessage = useMutation({
        mutationFn: ({id, text}: { id: number; text: string }) =>
            updateMessageCall(id, {message: text}),
        onSuccess: () => queryClient.invalidateQueries({queryKey: ["messages", selectedConversation?.id]}),
    })

    const deleteMessage = useMutation({
        mutationFn: (id: number) => deleteMessageCall(id),
        onSuccess: () => queryClient.invalidateQueries({queryKey: ["messages", selectedConversation?.id]}),
    })

    return (
        <div className="flex h-full">
            <div className="w-80 border-r bg-card flex flex-col">
                <div className="p-3 font-semibold flex justify-between items-center">
                    <span>Conversations</span>
                    <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4"/>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Conversation</DialogTitle>
                            </DialogHeader>
                            <Input
                                placeholder="Conversation name..."
                                value={chatName}
                                onChange={(e) => setChatName(e.target.value)}
                                className="mb-2"
                            />
                            <div className="max-h-40 overflow-y-auto border rounded p-2 mb-2">
                                {friends.map((friend) => {
                                    const userToChoose =
                                        currentUser?.userEssentials?.username === friend.senderUsername
                                            ? friend.receiverUsername
                                            : friend.senderUsername
                                    return (
                                        <label key={friend.friendshipId} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedFriends.includes(userToChoose)}
                                                onChange={(e) =>
                                                    setSelectedFriends((prev) =>
                                                        e.target.checked
                                                            ? [...prev, userToChoose]
                                                            : prev.filter((u) => u !== userToChoose)
                                                    )
                                                }
                                            />
                                            <span>{userToChoose}</span>
                                        </label>
                                    )
                                })}
                            </div>
                            <select
                                value={conversationType}
                                onChange={(e) => setConversationType(e.target.value as "PRIVATE" | "GROUP")}
                                className="border rounded p-2 mb-3 w-full"
                            >
                                <option value="PRIVATE">Private</option>
                                <option value="GROUP">Group</option>
                            </select>
                            <Button
                                onClick={() => {
                                    if (!currentUser) return
                                    const username = currentUser.userEssentials?.username
                                    if (!username) return
                                    const users: string[] = [...selectedFriends, username]
                                    createConversation.mutate({
                                        chatName: chatName || "New Chat",
                                        type: conversationType,
                                        users,
                                    })
                                }}
                                disabled={selectedFriends.length === 0}
                            >
                                Create
                            </Button>
                        </DialogContent>
                    </Dialog>
                </div>
                <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                        {conversations.map((conv) => (
                            <Card
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={`p-2 cursor-pointer ${
                                    selectedConversation?.id === conv.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={
                                                conv.imageChat?.startsWith("http")
                                                    ? conv.imageChat
                                                    : conv.imageChat
                                                        ? `http://localhost:8081/${conv.imageChat}`
                                                        : undefined
                                            }
                                        />
                                        <AvatarFallback>{conv.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className="truncate">{conv.name}</span>
                                        {conv.conversationType === "GROUP" && <Users className="h-3 w-3"/>}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        <div className="p-3 border-b flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={
                                            selectedConversation.imageChat?.startsWith("http")
                                                ? selectedConversation.imageChat
                                                : selectedConversation.imageChat
                                                    ? `http://localhost:8081/${selectedConversation.imageChat}`
                                                    : undefined
                                        }
                                    />
                                    <AvatarFallback>{selectedConversation.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{selectedConversation.name}</span>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setChatToEdit(selectedConversation)
                                            setChatName(selectedConversation.name ?? "")
                                            setIsEditChatOpen(true)
                                        }}
                                    >
                                        <Edit3 className="h-4 w-4 mr-2"/> Edit conversation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => deleteConversation.mutate(selectedConversation.id!)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2"/> Delete conversation
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <ScrollArea className="flex-1 p-3">
                            <div className="space-y-3">
                                {messages.map((m) => {
                                    const isMine = m.username === currentUser?.userEssentials?.username
                                    const isEditing = editingMessageId === m.messageId
                                    return (
                                        <div key={m.messageId}
                                             className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                            <div
                                                className={`relative max-w-xs px-3 py-2 rounded-lg ${
                                                    isMine ? "bg-primary text-white" : "bg-muted"
                                                }`}
                                            >
                                                {isEditing ? (
                                                    <div className="flex gap-2 items-center">
                                                        <Input
                                                            value={editingText}
                                                            onChange={(e) => setEditingText(e.target.value)}
                                                            className="h-8 text-black"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                updateMessage.mutate(
                                                                    {id: m.messageId!, text: editingText},
                                                                    {
                                                                        onSuccess: () => {
                                                                            setEditingMessageId(null)
                                                                            setEditingText("")
                                                                        },
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingMessageId(null)
                                                                setEditingText("")
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p>{m.text}</p>
                                                        {isMine && (
                                                            <div className="flex gap-2 mt-1 text-xs">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setEditingMessageId(m.messageId!)
                                                                        setEditingText(m.text || "")
                                                                    }}
                                                                >
                                                                    <Edit3 className="h-4 w-4 mr-1"/> Edit
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-destructive"
                                                                    onClick={() => deleteMessage.mutate(m.messageId!)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-1"/> Delete
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef}/>
                            </div>
                        </ScrollArea>

                        <div className="p-3 border-t flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Write a message..."
                            />
                            <Button onClick={() => sendMessage.mutate(newMessage)} disabled={!newMessage.trim()}>
                                <Send className="h-4 w-4"/>
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a conversation
                    </div>
                )}
            </div>

            <Dialog open={isEditChatOpen} onOpenChange={setIsEditChatOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Conversation</DialogTitle>
                    </DialogHeader>
                    <Input
                        value={chatName}
                        onChange={(e) => setChatName(e.target.value)}
                        placeholder="Conversation name"
                        className="mb-2"
                    />
                    <div className="max-h-40 overflow-y-auto border rounded p-2 mb-2">
                        {friends.map((friend) => {
                            const userToChoose =
                                currentUser?.userEssentials?.username === friend.senderUsername
                                    ? friend.receiverUsername
                                    : friend.senderUsername
                            return (
                                <label key={friend.friendshipId} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedFriends.includes(userToChoose)}
                                        onChange={(e) =>
                                            setSelectedFriends((prev) =>
                                                e.target.checked
                                                    ? [...prev, userToChoose]
                                                    : prev.filter((u) => u !== userToChoose)
                                            )
                                        }
                                    />
                                    <span>{userToChoose}</span>
                                </label>
                            )
                        })}
                    </div>
                    <select
                        value={conversationType}
                        onChange={(e) => setConversationType(e.target.value as "PRIVATE" | "GROUP")}
                        className="border rounded p-2 mb-3 w-full"
                    >
                        <option value="PRIVATE">Private</option>
                        <option value="GROUP">Group</option>
                    </select>
                    <Button
                        onClick={() => {
                            if (chatToEdit?.id) {
                                updateConversation.mutate({
                                    id: chatToEdit.id,
                                    data: {chatName, conversationType, usernames: selectedFriends},
                                })
                            }
                        }}
                    >
                        Save
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    )
}

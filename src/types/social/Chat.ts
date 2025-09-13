import {UserDetails} from "@/types/profile/UserType";

export type ChatMessage = {
    messageId?: number;
    conversationId?: number;
    username?: string;
    text?: string;
    profilePicture?: string | null;
}

export type Conversation = {
    id?: number
    name?: string
    conversationType?: "PRIVATE" | "GROUP"
    members?: UserDetails[]
    imageChat?: string | null
}

export interface CreateChatRequest {
    usernames: string[]
}

export interface CreateMessageRequest {
    message: string
}

export interface UpdateChatRequest {
    chatName: string
    conversationType: "PRIVATE" | "GROUP"
    usernames: string[]
}

export interface UpdateMessageRequest {
    message: string
}
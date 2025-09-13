import { Sidebar } from "@/components/Sidebar"
import { ChatInterface } from "@/components/ChatInterface"

export default function ChatPage() {
    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <ChatInterface />
            </div>
        </div>
    )
}

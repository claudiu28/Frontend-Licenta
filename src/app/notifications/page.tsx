import { Sidebar } from "@/components/Sidebar"
import { NotificationsInterface } from "@/components/NotificationsInterface"

export default function NotificationsPage() {
    return (
        <div className="flex min-h-screen bg-gradient-bg">
            <Sidebar />
            <main className="flex-1 ml-64">
                <div className="p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
                            <p className="text-muted-foreground">Stay updated with your latest notifications and messages</p>
                        </div>
                        <NotificationsInterface />
                    </div>
                </div>
            </main>
        </div>
    )
}

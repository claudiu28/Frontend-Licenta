"use client"

import {useState, useRef} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Trash2, Edit, Plus, FileText} from "lucide-react"
import {useCurrentUser} from "@/hooks/useCurrentUser"
import {apiClient} from "@/api/client"
import {Page} from "@/types/page/page"
import {InfiniteData, useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query"
import {ErrorResponse} from "@/types/ErrorType"
import {useInfiniteScroll} from "@/hooks/useInfiniteScroll"
import {toast} from "sonner"
import {Sidebar} from "@/components/Sidebar"
import {Content, ContentCreated, ContentForm, ContentUpdated} from "@/types/content/Content"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"

const createContentCall = async (data: ContentForm): Promise<Content> => {
    return apiClient<Content>(`content?type=${data.type}`, "POST", data.formData);
}

const getAllContentsCall = async () => {
    return apiClient<Page<Content>>("content/all", "GET")
}

const getAllUserContentsCall = async () => {
    return apiClient<Page<Content>>("content/user", "GET")
}

const updateContentCall = async (id: number, data: ContentUpdated) => {
    return apiClient<Content>(`content/${id}`, "PATCH", data)
}

const deleteContentCall = async (id: number) => {
    return apiClient<void>(`content/${id}`, "DELETE")
}

export default function ContentManager() {
    const {me: userMe} = useCurrentUser();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editingContent, setEditingContent] = useState<Content | null>(null);
    const [selectedContent, setSelectedContent] = useState<Content | null>(null);

    const username = userMe?.userEssentials?.username || "";

    const [newContent, setNewContent] = useState<ContentCreated>({
        title: "",
        description: "",
        section: "",
        type: "TEXT",
        file: undefined,
    });

    const {
        data: contentsQuery,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery<Page<Content>, ErrorResponse, InfiniteData<Page<Content>>, [string], number>({
        queryKey: ["contents"],
        queryFn: () => getAllContentsCall(),
        getNextPageParam: (last) => (!last.last ? last.number + 1 : undefined),
        initialPageParam: 0,
        enabled: !!username,
    })
    const contents = contentsQuery?.pages.flatMap((p) => p.content) ?? []
    const loadMoreRef = useRef<HTMLDivElement | null>(null)
    useInfiniteScroll(loadMoreRef, hasNextPage, isFetchingNextPage, fetchNextPage)

    const {
        data: userContentsQuery,
        fetchNextPage: fetchNextPageUser,
        hasNextPage: hasNextPageUser,
        isFetchingNextPage: isFetchingNextPageUser,
    } = useInfiniteQuery<Page<Content>, ErrorResponse, InfiniteData<Page<Content>>, [string], number>({
        queryKey: ["contents-user"],
        queryFn: () => getAllUserContentsCall(),
        getNextPageParam: (last) => (!last.last ? last.number + 1 : undefined),
        initialPageParam: 0,
        enabled: !!username,
    })
    const userContents = userContentsQuery?.pages.flatMap((p) => p.content) ?? []
    const loadMoreRefUser = useRef<HTMLDivElement | null>(null)
    useInfiniteScroll(loadMoreRefUser, hasNextPageUser, isFetchingNextPageUser, fetchNextPageUser)

    const createContentMutation = useMutation({
        mutationFn: (data: ContentForm) => createContentCall({
            type: data.type,
            formData: data.formData,
        }),
        onSuccess: (data: Content) => {
            toast.success(`Content "${data.title}" created successfully`)
            setNewContent({title: "", description: "", section: "", type: "TEXT", file: undefined})
            queryClient.invalidateQueries({queryKey: ["contents"]}).then();
            queryClient.invalidateQueries({queryKey: ["contents-user"]}).then();
        },
        onError: (error: ErrorResponse) => {
            toast.error(error.message || "Failed to create content")
        },
    })

    const deleteContentMutation = useMutation({
        mutationFn: (id: number) => deleteContentCall(id),
        onSuccess: () => {
            toast.success("Content deleted successfully")
            queryClient.invalidateQueries({queryKey: ["contents"]}).then();
            queryClient.invalidateQueries({queryKey: ["contents-user"]}).then();
        },
        onError: (error: ErrorResponse) => {
            toast.error(error.message || "Failed to delete content")
        },
    })

    const updateContentMutation = useMutation({
        mutationFn: (data: Content) => updateContentCall(data.contentId!, {
            title: data.title!,
            description: data.description!,
            section: data.section!,
        }),
        onSuccess: (data: Content) => {
            toast.success(`Content "${data.title}" updated successfully`)
            setEditingContent(null)
            queryClient.invalidateQueries({queryKey: ["contents"]}).then();
            queryClient.invalidateQueries({queryKey: ["contents-user"]}).then();
        },
        onError: (error: ErrorResponse) => {
            toast.error(error.message || "Failed to update content")
        },
    })

    const handleCreateContent = () => {
        if (!newContent.title.trim() || !newContent.section.trim()) return

        let form = new FormData();
        form.set("title", newContent.title);
        form.set("description", newContent.description);
        form.set("section", newContent.section);
        if (newContent.file) {
            form.set("file", newContent.file);
        }

        createContentMutation.mutate({
            type: newContent.type,
            formData: form,
        })
    }

    const handleDeleteContent = (id: number) => {
        deleteContentMutation.mutate(id)
    }

    const handleEditContent = () => {
        if (!editingContent?.contentId) return
        updateContentMutation.mutate(editingContent)
    }

    const normalizeUrl = (url?: string) => {
        if (!url) return undefined;
        return url.startsWith("http") ? url : `http://localhost:8081/${url}`;
    };

    return (
        <div className="flex h-screen bg-background">
            <Sidebar/>
            <div className="flex-1 flex flex-col">
                <div className="container mx-auto p-6 space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold">Content Management System</h1>
                        <p className="text-muted-foreground">Create, update, and manage your lesson content</p>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5"/>
                                Create New Content
                            </CardTitle>
                            <CardDescription>Add a new lesson content</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Input
                                    placeholder="Title"
                                    value={newContent.title}
                                    onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                                />
                                <Input
                                    placeholder="Section"
                                    value={newContent.section}
                                    onChange={(e) => setNewContent({...newContent, section: e.target.value})}
                                />
                                <Input
                                    placeholder="Description"
                                    value={newContent.description}
                                    onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                                />
                                <select className="border rounded-md p-2" value={newContent.type}
                                        onChange={(e) => setNewContent({...newContent, type: e.target.value})}>
                                    <option value="TEXT">Text</option>
                                    <option value="VIDEO">Video</option>
                                    <option value="PDF">PDF</option>
                                    <option value="IMAGE">Image</option>
                                </select>
                                <input type="file"
                                       onChange={(e) =>
                                           setNewContent({...newContent, file: e.target.files?.[0]})
                                       }
                                />
                            </div>
                            <Button onClick={handleCreateContent}>Create Content</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Content ({userContents.length})</CardTitle>
                            <CardDescription>Content created by you</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {userContents.map((c) => (
                                    <div key={c.contentId} className="border rounded-lg p-4 space-y-2">
                                        {editingContent?.contentId === c.contentId ? (
                                            <div className="space-y-2">
                                                <Input
                                                    value={editingContent?.title}
                                                    onChange={(e) => setEditingContent({
                                                        ...editingContent,
                                                        title: e.target.value
                                                    })}
                                                />
                                                <Input
                                                    value={editingContent?.section}
                                                    onChange={(e) => setEditingContent({
                                                        ...editingContent,
                                                        section: e.target.value
                                                    })}
                                                />
                                                <Input
                                                    value={editingContent?.description}
                                                    onChange={(e) => setEditingContent({
                                                        ...editingContent,
                                                        description: e.target.value
                                                    })}
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={handleEditContent}>Save</Button>
                                                    <Button size="sm" variant="outline"
                                                            onClick={() => setEditingContent(null)}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="default">{c.title}</Badge>
                                                    <div className="flex gap-1">
                                                        <Button size="sm" variant="ghost"
                                                                onClick={() => setEditingContent(c)}>
                                                            <Edit className="h-4 w-4"/>
                                                        </Button>
                                                        <Button size="sm" variant="ghost"
                                                                onClick={() => handleDeleteContent(c.contentId!)}>
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{c.description}</p>
                                                {c.media && (
                                                    <>
                                                        <Button size="sm" onClick={() => {
                                                            setSelectedContent(c);
                                                            setOpen(true);
                                                        }}>
                                                            Preview
                                                        </Button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>All Content ({contents.length})</CardTitle>
                            <CardDescription>All content in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {contents.map((c) => (
                                    <div key={c.contentId} className="border rounded-lg p-4 space-y-2">
                                        <Badge variant="secondary">{c.title}</Badge>
                                        <p className="text-xs text-muted-foreground">{c.section}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>{selectedContent?.title}</DialogTitle>
                        </DialogHeader>

                        {selectedContent?.contentType === "IMAGE" && (
                            <img
                                src={normalizeUrl(selectedContent.media)}
                                alt={selectedContent.title}
                                className="max-h-[70vh] mx-auto"
                            />
                        )}

                        {selectedContent?.contentType === "VIDEO" && (
                            <video
                                src={normalizeUrl(selectedContent.media)}
                                controls
                                className="w-full max-h-[70vh]"
                            />
                        )}

                        {selectedContent?.contentType === "PDF" && (
                            <div className="flex flex-col items-center justify-center gap-4 py-6">
                                <FileText className="h-12 w-12 text-muted-foreground" />
                                <Button asChild>
                                    <a
                                        href={normalizeUrl(selectedContent.media)}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Download PDF
                                    </a>
                                </Button>
                            </div>
                        )}
                        {selectedContent?.contentType === "TEXT" && (
                            <p className="text-sm">{selectedContent.description}</p>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

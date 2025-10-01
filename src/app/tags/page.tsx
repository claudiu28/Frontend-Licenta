"use client"

import {useState, useRef} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Trash2, Edit, Plus} from "lucide-react"
import {Tag, TagCreated} from "@/types/tags/Tag";
import {useCurrentUser} from "@/hooks/useCurrentUser";
import {apiClient} from "@/api/client";
import {Page} from "@/types/page/page"
import {InfiniteData, useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {ErrorResponse} from "@/types/ErrorType";
import {useInfiniteScroll} from "@/hooks/useInfiniteScroll";
import {toast} from "sonner";
import {Sidebar} from "@/components/Sidebar";

const createTagCall = async (data: TagCreated): Promise<Tag> => {
    return apiClient<Tag>('tag', 'POST', data);
}

const getAllTagsCall = async () => {
    return apiClient<Page<Tag>>('tag', 'GET');
}

const getAllTagUsersCall = async () => {
    return apiClient<Page<Tag>>(`tag/user`, 'GET');
}

const updateTagCall = async (id: number, data: TagCreated) => {
    return apiClient<Tag>(`tag/${id}`, 'PATCH', data);
}

const deleteTagCall = async (id: number) => {
    return apiClient<void>(`tag/${id}`, 'DELETE');
}

export default function TagManager() {
    const {me: userMe} = useCurrentUser();
    const [newTagName, setNewTagName] = useState("")
    const [editingTag, setEditingTag] = useState<Tag | null>(null)


    const queryClient = useQueryClient();
    const username = userMe?.userEssentials?.username! || "";

    const {
        data: tagsQuery,
        fetchNextPage: fetchNextPage,
        hasNextPage: hasNextPage,
        isFetchingNextPage: isFetchingNextPage
    } =
        useInfiniteQuery<Page<Tag>, ErrorResponse, InfiniteData<Page<Tag>>, [string], number>({
            queryKey: ["tags"],
            queryFn: () => getAllTagsCall(),
            getNextPageParam: (last) => (!last.last ? last.number + 1 : undefined),
            initialPageParam: 0,
            enabled: !!username,
        })
    const tags = tagsQuery?.pages.flatMap((p) => p.content) ?? []
    const loadMoreRefs = useRef<HTMLDivElement | null>(null);
    useInfiniteScroll(loadMoreRefs, hasNextPage, isFetchingNextPage, fetchNextPage);

    const {
        data: tagsUserQuery,
        fetchNextPage: fetchNextPage1,
        hasNextPage: hasNextPage1,
        isFetchingNextPage: isFetchingNextPage1
    } =
        useInfiniteQuery<Page<Tag>, ErrorResponse, InfiniteData<Page<Tag>>, [string], number>({
            queryKey: ["tags-user"],
            queryFn: () => getAllTagUsersCall(),
            getNextPageParam: (last) => (!last.last ? last.number + 1 : undefined),
            initialPageParam: 0,
            enabled: !!username,
        })
    const tagsUser = tagsUserQuery?.pages.flatMap((p) => p.content) ?? []
    const loadMoreRefs1 = useRef<HTMLDivElement | null>(null);
    useInfiniteScroll(loadMoreRefs1, hasNextPage1, isFetchingNextPage1, fetchNextPage1);

    const createTagMutation = useMutation({
        mutationFn: (data: TagCreated) => createTagCall(data),
        onSuccess: (data: Tag) => {
            toast.success(`Tag "${data.tag}" created successfully`);
            setNewTagName("");
            queryClient.invalidateQueries({queryKey: ["tags"]}).then();
            queryClient.invalidateQueries({queryKey: ["tags-user"]}).then();
        },
        onError: (error: ErrorResponse) => {
            toast.error(error.message || "Failed to create tag");
        }
    })

    const deleteTagMutation = useMutation(
        {
            mutationFn: (id: number) => deleteTagCall(id),
            onSuccess: () => {
                toast.success("Tag deleted successfully");
                queryClient.invalidateQueries({queryKey: ["tags"]}).then();
                queryClient.invalidateQueries({queryKey: ["tags-user"]}).then();
            },
            onError: (error: ErrorResponse) => {
                toast.error(error.message || "Failed to delete tag");
            }
        }
    )

    const updateTagMutation = useMutation({
        mutationFn: (data: Tag) => updateTagCall(data.id!, {tagName: data.tag!}),
        onSuccess: (data: Tag) => {
            toast.success(`Tag "${data.tag}" updated successfully`);
            setEditingTag(null);
            queryClient.invalidateQueries({queryKey: ["tags"]}).then();
            queryClient.invalidateQueries({queryKey: ["tags-user"]}).then();
        },
        onError: (error: ErrorResponse) => {
            toast.error(error.message || "Failed to update tag");
        }
    })

    const handleCreateTag = () => {
        if (!newTagName.trim()) return;
        createTagMutation.mutate({tagName: newTagName.trim()});
    }

    const handleDeleteTag = (id: number) => {
        deleteTagMutation.mutate(id);
    };

    const handleEditTag = () => {
        if (!editingTag?.id || !editingTag?.tag) return;
        updateTagMutation.mutate(editingTag);
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar/>
            <div className="flex-1 flex flex-col">
                <div className="container mx-auto p-6 space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold">Tag Management System</h1>
                        <p className="text-muted-foreground">Create, update, and manage your tags</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5"/>
                                Create New Tag
                            </CardTitle>
                            <CardDescription>Add a new tag to the system</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <Input
                                    placeholder="Tag name"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                />
                                <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                                    Create Tag
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Tags ({tagsUser.length})</CardTitle>
                            <CardDescription>Tags created by you</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {tagsUser.map((tag) => (
                                    <div key={tag.id} className="border rounded-lg p-4 space-y-2">
                                        {editingTag?.id === tag.id ? (
                                            <div className="space-y-2">
                                                <Input
                                                    value={editingTag?.tag}
                                                    onChange={(e) => setEditingTag({
                                                        ...editingTag,
                                                        tag: e.target.value
                                                    })}
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={handleEditTag}>
                                                        Save
                                                    </Button>
                                                    <Button size="sm" variant="outline"
                                                            onClick={() => setEditingTag(null)}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="default">{tag.tag}</Badge>
                                                    <div className="flex gap-1">
                                                        <Button size="sm" variant="ghost"
                                                                onClick={() => setEditingTag(tag)}>
                                                            <Edit className="h-4 w-4"/>
                                                        </Button>
                                                        <Button size="sm" variant="ghost"
                                                                onClick={() => handleDeleteTag(tag.id!)}>
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>All Tags ({tags.length})</CardTitle>
                            <CardDescription>All tags in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {tags.map((tag) => (
                                    <div key={tag.id} className="border rounded-lg p-4 space-y-2">
                                        <Badge variant="secondary">{tag.tag}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

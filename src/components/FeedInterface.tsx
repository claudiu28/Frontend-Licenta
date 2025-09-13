"use client"

import {useEffect, useRef, useState} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {Textarea} from "@/components/ui/textarea"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {Post} from "@/types/social/Post";
import {Page} from "@/types/page/page";
import {apiClient} from "@/api/client";
import {InfiniteData, useInfiniteQuery, useMutation} from "@tanstack/react-query";
import {useCurrentUser} from "@/hooks/useCurrentUser";
import {ErrorResponse} from "@/types/ErrorType";
import {PostCard} from "./PostCard"
import {ImageIcon, PlusIcon} from "@/components/Icons";
import {toast} from "sonner";

const getFeedCall = async (username: string, page: number, size = 10): Promise<Page<Post>> => {
    console.log("[FEED] Fetching feed for", username, "page", page)
    return apiClient<Page<Post>>(`posts/${username}/feed?page=${page}&size=${size}`, "GET")
}

const addPostCall = async (data: FormData): Promise<Post> => {
    console.log("[POST::CREATE] Creating new post")
    return apiClient<Post>("post", "POST", data)
}

export function FeedInterface() {

    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPostDescription, setNewPostDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isCreatingPost, setIsCreatingPost] = useState(false);

    const {me: userMe, isLoadingMe: isLoadingMe} = useCurrentUser();
    const username = userMe?.userEssentials?.username ?? "";

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery<Page<Post>, ErrorResponse, InfiniteData<Page<Post>>, [_: string, string], number>({
        queryKey: ["feed", username],
        queryFn: ({pageParam = 0}) => getFeedCall(username, pageParam, 10),
        enabled: !!username,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage.last) {
                return lastPage.number + 1;
            }
            return undefined;
        },
    });

    const creatingNewPostMutation = useMutation<Post, ErrorResponse, FormData>({
        mutationFn: (formData: FormData) => addPostCall(formData),
        onSuccess: () => {
            toast.success("Post created successfully");
        },
        onError: (error: ErrorResponse) => {
            toast.error(error.message || "Failed to create post");
        },
    });

    const posts = data?.pages.flatMap(page => page.content) || [];
    const loadMoreRefs = useRef<HTMLDivElement | null>(null);
    const handleCreatePost = async () => {
        if (!newPostDescription.trim() && !selectedFile) return;
        try {
            setIsCreatingPost(true);
            const formData = new FormData();
            formData.append("description", newPostDescription);
            if (selectedFile) {
                formData.append("file", selectedFile);
            }

            await creatingNewPostMutation?.mutateAsync(formData);
            setNewPostDescription("");
            setSelectedFile(null);
            setShowCreatePost(false);

            await fetchNextPage();
        } catch (err: any) {
            toast.error(err.message || "Failed to create post");
        } finally {
            setIsCreatingPost(false);
        }
    };
    useEffect(() => {
        if (!loadMoreRefs.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                fetchNextPage().then();
            }
        });

        observer.observe(loadMoreRefs.current);

        return () => {
            if (loadMoreRefs.current) {
                observer.unobserve(loadMoreRefs.current);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);


    if (isLoadingMe) {
        return <div>Loading...</div>
    }

    if (!userMe?.userEssentials?.username) {
        return <div>Please log in to see your feed.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Feed Health
                </h1>
                <p className="text-slate-600">Stay connected with your friends and expose your progress</p>
            </div>
            <Card className="border-2 border-dashed border-emerald-200 hover:border-emerald-300 transition-colors">
                <CardContent className="p-4">
                    {!showCreatePost ? (
                        <Button
                            onClick={() => setShowCreatePost(true)}
                            variant="ghost"
                            className="w-full h-12 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                        >
                            <PlusIcon/>
                            <span className="ml-2">Share something with your friends...</span>
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            <Textarea
                                placeholder="What's on your mind?"
                                value={newPostDescription}
                                onChange={(e) => setNewPostDescription(e.target.value)}
                                className="min-h-[100px] resize-none border-emerald-200 focus:border-emerald-400"
                            />

                            <div className="flex items-center space-x-2">
                                <Input
                                    type="file"
                                    accept="image/*,video/*,text/"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="media-upload"
                                />
                                <label
                                    htmlFor="media-upload"
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md cursor-pointer transition-colors"
                                >
                                    <ImageIcon/>
                                    <span>Add Photo/Video/Text</span>
                                </label>
                                {selectedFile && (
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                        {selectedFile.name}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowCreatePost(false)
                                        setNewPostDescription("")
                                        setSelectedFile(null)
                                    }}
                                    disabled={isCreatingPost}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreatePost}
                                    disabled={!newPostDescription.trim() || isCreatingPost}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                                    {isCreatingPost ? "Posting..." : "Post"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-6">
                {posts.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <div className="text-slate-400 space-y-2">
                                <h3 className="text-lg font-medium text-slate-600">No posts yet</h3>
                                <p className="text-sm">Be the first to share something!</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    posts.map((post) => (
                        <div key={post.postId}>
                            <PostCard post={post} currentUsername={username}/>

                        </div>
                    ))
                )}
                <div ref={loadMoreRefs} className="py-6 text-center">
                    {isFetchingNextPage ? "Loading more..." : hasNextPage ? "Scroll down to load more" : "No more posts"}
                </div>
            </div>
        </div>
    )
}
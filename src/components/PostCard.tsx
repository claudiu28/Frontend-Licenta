"use client"
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Separator} from "@/components/ui/separator";
import {Button} from "@/components/ui/button";
import {Post, UpdatePost} from "@/types/social/Post";
import {apiClient} from "@/api/client";
import {HeartIcon, MessageCircleIcon, SendIcon} from "@/components/Icons";
import {InfiniteData, useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {useRef, useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Page} from "@/types/page/page";
import {Comment} from "@/types/social/Comment";
import {ErrorResponse} from "@/types/ErrorType";
import {useInfiniteScroll} from "@/hooks/useInfiniteScroll";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {MoreVertical} from "lucide-react";


const updateUserPostCall = async (postId: number, postUpdateReq: UpdatePost) => {
    console.log("[TWEET] Updating postId:", postId, "with data:", postUpdateReq);
    return apiClient<Post>(`post/${postId}`, "PATCH", postUpdateReq);
}

const deleteUserPostCall = async (postId: number): Promise<void> => {
    console.log("[TWEET] Deleting postId:", postId);
    return apiClient<void>(`post/${postId}`, "DELETE");
}

const toggleLikeCall = async (postId: number) => {
    console.log("[TWEET] Toggling like for postId:", postId);
    return apiClient<void>(`post/${postId}/like-toggle`, "POST");
}

const commentsPerCall = async (postId: number, page: number, size = 10): Promise<Page<Comment>> => {
    console.log("[COMMENTS] Fetching comments for postId:", postId, "page:", page, "size:", size);
    const queryParams = new URLSearchParams()
    queryParams.append("page", page.toString())
    queryParams.append("size", size.toString())
    return apiClient<Page<Comment>>(`post/${postId}/comments?${queryParams}`, "GET")
}
const commentAddCall = async (postId: number, commentText: string): Promise<Comment> => {
    console.log("[COMMENT] Adding comment to postId:", postId, "commentText:", commentText);
    return apiClient<Comment>(`post/${postId}/comment`, "POST", {commentText});
}

const commentUpdateCall = async (commentId: number, commentText: string) => {
    return apiClient<Comment>(`comment/${commentId}`, "PATCH", {commentText});
}

const commentDeleteCall = async (commentId: number) => {
    return apiClient<void>(`comment/${commentId}`, "DELETE");
}

export const PostCard = ({post, currentUsername}: { post: Post, currentUsername: string }) => {
    const [viewComments, setViewComments] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [editing, setEditing] = useState<{ id: number; content: string } | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editDescription, setEditDescription] = useState(post.description);


    const queryClient = useQueryClient();
    const toggleLikeMutation = useMutation({
        mutationFn: () => toggleLikeCall(post.postId),
        onSuccess: () => {
            toast.success(post.isLiked ? "Unliked the post" : "Liked the post");
            queryClient.invalidateQueries({queryKey: ["feed"]}).then();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to toggle like");
        }
    })

    const {
        data: commentsPaged,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery<Page<Comment>, ErrorResponse, InfiniteData<Page<Comment>>, [_: string, number], number>({
        queryKey: ["comments", post.postId],
        queryFn: ({pageParam = 0}) => commentsPerCall(post.postId, pageParam, 10),
        enabled: viewComments && !!post.postId && !!currentUsername,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage.last) {
                return lastPage.number + 1;
            }
            return undefined;
        },
    })
    const comments = commentsPaged?.pages.flatMap(page => page.content) || [];
    const loadMoreRefs = useRef<HTMLDivElement | null>(null);
    useInfiniteScroll(loadMoreRefs, hasNextPage, isFetchingNextPage, fetchNextPage);

    const addCommentMutation = useMutation<Comment, ErrorResponse>({
        mutationFn: () => commentAddCall(post.postId, commentInput),
        onSuccess: () => {
            toast.success("Comment added successfully");
            setCommentInput("");
            queryClient.invalidateQueries({queryKey: ["feed"]}).then();
            queryClient.invalidateQueries({queryKey: ["comments", post.postId]}).then();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to add comment");
        }
    })

    const deletePost = useMutation<void, ErrorResponse, number>({
        mutationFn: (postId: number) => deleteUserPostCall(postId),
        onSuccess: () => {
            toast.success("Post deleted successfully");
            queryClient.invalidateQueries({queryKey: ["feed"]}).then();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete post");
        }
    });

    const updatePost = useMutation<Post, ErrorResponse, { postId: number; postUpdateReq: UpdatePost }>({
        mutationFn: ({postId, postUpdateReq}) => updateUserPostCall(postId, postUpdateReq),
        onSuccess: () => {
            toast.success("Post updated successfully");
            queryClient.invalidateQueries({queryKey: ["feed"]}).then();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update post");
        }
    });

    const deleteComment = useMutation<void, ErrorResponse, number>({
        mutationFn: (commentId: number) => commentDeleteCall(commentId),
        onSuccess: () => {
            toast.success("Comment deleted successfully");
            queryClient.invalidateQueries({queryKey: ["feed"]}).then();
            queryClient.invalidateQueries({queryKey: ["comments", post.postId]}).then();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete comment");
        }
    });

    const updateCommentMutation = useMutation<Comment, ErrorResponse, { id: number; content: string }>({
        mutationFn: ({id, content}) => commentUpdateCall(id, content),
        onSuccess: () => {
            toast.success("Comment updated successfully");
            setEditing(null);
            queryClient.invalidateQueries({queryKey: ["feed"]}).then();
            queryClient.invalidateQueries({queryKey: ["comments", post.postId]}).then();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update comment");
        }
    });

    const handleUpdate = () => {
        if (editing) {
            updateCommentMutation.mutate({id: editing.id, content: editing.content});
        }
    };
    const handleAdd = () => {
        if (!commentInput.trim()) return;
        addCommentMutation.mutate();
    }

    const handleDeletePost = () => {
        deletePost.mutate(post.postId);
    }

    const handleUpdatePost = (description: string) => {
        updatePost.mutate({postId: post.postId, postUpdateReq: {description}});
    }

    return (
        <Card key={post.postId} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={
                                post?.profilePicture?.startsWith("http")
                                    ? post?.profilePicture
                                    : post?.profilePicture
                                        ? `http://localhost:8081/${post?.profilePicture}`
                                        : undefined
                            }/>
                            <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                {post.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-slate-900">{post.username}</p>
                        </div>
                    </div>

                    {currentUsername === post.username && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-5 w-5"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                                    Edit Post
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleDeletePost}
                                    className="text-red-600 focus:text-red-700"
                                >
                                    Delete Post
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <p className="text-slate-700 leading-relaxed">{post.description}</p>
                {post.contentType && (
                    <div className="rounded-lg overflow-hidden">
                        {post.contentType === "IMAGE" && (
                            <img
                                src={
                                    post?.mediaURL?.startsWith("http")
                                        ? post?.mediaURL
                                        : post?.mediaURL
                                            ? `http://localhost:8081/${post?.mediaURL}`
                                            : undefined
                                }
                                alt={`post_${post.postId}`}
                                className="w-full h-auto"
                            />
                        )}

                        {post.contentType === "VIDEO" && (
                            <video
                                src={
                                    post?.mediaURL?.startsWith("http")
                                        ? post?.mediaURL
                                        : post?.mediaURL
                                            ? `http://localhost:8081/${post?.mediaURL}`
                                            : undefined
                                }
                                controls
                                className="w-full h-auto max-h-96"
                            />
                        )}

                        {post.contentType === "TEXT" && (
                            <p className="p-2 text-gray-800 whitespace-pre-wrap">
                                {post.mediaURL}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center space-x-4">
                        <span>{post.likesCount} likes</span>
                        <span>{post.commentsCount} comments</span>
                    </div>
                </div>

                <Separator/>

                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLikeMutation.mutate()}
                        className={`flex items-center space-x-2 ${
                            post.isLiked ? "text-red-500 hover:text-red-600" : "text-slate-600 hover:text-red-500"
                        }`}>
                        <HeartIcon filled={post.isLiked}/>
                        <span>{post.isLiked ? "Liked" : "Like"}</span>
                    </Button>

                    <Button variant="ghost"
                            onClick={() => setViewComments(true)}
                            size="sm" className="flex items-center space-x-2 text-slate-600 hover:text-emerald-600">
                        <MessageCircleIcon/>
                        <span>Comment</span>
                    </Button>
                </div>
                <Dialog open={viewComments} onOpenChange={setViewComments}>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Comments</DialogTitle>
                        </DialogHeader>

                        <div className="flex gap-2 sticky top-0 bg-white pb-3">
                            <Input
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Write a comment..."
                            />
                            <Button onClick={handleAdd} disabled={!commentInput.trim()}>
                                <SendIcon/>
                            </Button>
                        </div>

                        <Separator/>

                        <div className="space-y-3 pt-2">
                            {comments.map((comment) => (
                                <div key={comment.commentId} className="flex items-start space-x-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={
                                            comment?.profilePicture?.startsWith("http")
                                                ? comment?.profilePicture
                                                : comment?.profilePicture
                                                    ? `http://localhost:8081/${comment?.profilePicture}`
                                                    : undefined
                                        }/>
                                        <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">{comment.username}</p>
                                        {editing?.id === comment.commentId ? (
                                            <div className="flex gap-2">
                                                <Input
                                                    value={editing.content}
                                                    onChange={(e) => setEditing({
                                                        ...editing,
                                                        content: e.target.value
                                                    })}
                                                />
                                                <Button size="sm" onClick={handleUpdate}>
                                                    Save
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <p>{comment.commentText}</p>
                                        )}

                                        {comment.username === currentUsername && (
                                            <div className="flex gap-2 mt-1 text-xs">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditing({
                                                        id: comment.commentId,
                                                        content: comment.commentText
                                                    })}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => deleteComment.mutate(comment.commentId)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                            }
                        </div>

                        {hasNextPage && (
                            <div ref={loadMoreRefs} className="h-10 flex justify-center items-center">
                                {isFetchingNextPage ? "Loading..." : "Scroll to load more"}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Edit Post</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3">
                            <Input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Update your description..."
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        handleUpdatePost(editDescription);
                                        setIsEditModalOpen(false);
                                    }}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </CardContent>
        </Card>
    );

}
"use client"

import React from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Page} from "@/types/page/page";
import {Post} from "@/types/social/Post";
import {PostCard} from "@/components/PostCard";
import {useQuery} from "@tanstack/react-query";
import {ErrorResponse} from "@/types/ErrorType";
import {apiClient} from "@/api/client";

interface UserPostsTabsProps {
    username: string;
}

const userPosts = async (username: string): Promise<Page<Post>> =>
    apiClient<Page<Post>>(`user/${username}/posts`, "GET");

const userLikedPosts = async (username: string): Promise<Page<Post>> =>
    apiClient<Page<Post>>(`user/${username}/liked/posts`, "GET");

const userCommentPosts = async (username: string): Promise<Page<Post>> =>
    apiClient<Page<Post>>(`user/${username}/commented/posts`, "GET");

export const UserPostsTabs: React.FC<UserPostsTabsProps> = ({username}) => {
    const {data: userPostsPaged, isLoading: loadingPosts} = useQuery<Page<Post>, ErrorResponse>({
        queryKey: ["userPosts", username],
        queryFn: () => userPosts(username),
        enabled: !!username,
    });

    const {data: userLikedPostsPaged, isLoading: loadingLiked} = useQuery<Page<Post>, ErrorResponse>({
        queryKey: ["userLikedPosts", username],
        queryFn: () => userLikedPosts(username),
        enabled: !!username,
    });

    const {data: userCommentPostsPaged, isLoading: loadingCommented} = useQuery<Page<Post>, ErrorResponse>({
        queryKey: ["userCommentPosts", username],
        queryFn: () => userCommentPosts(username),
        enabled: !!username,
    });

    if (loadingPosts || loadingLiked || loadingCommented) {
        return <p className="text-center text-muted-foreground mt-6">Loading posts...</p>;
    }

    return (
        <Tabs defaultValue="posts" className="mt-8">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="liked">Liked</TabsTrigger>
                <TabsTrigger value="commented">Commented</TabsTrigger>
            </TabsList>

            <TabsContent value="posts">
                {userPostsPaged?.content?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userPostsPaged.content.map((post) => (
                            <PostCard key={post.postId} post={post} currentUsername={username}/>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">No posts yet.</p>
                )}
            </TabsContent>

            <TabsContent value="liked">
                {userLikedPostsPaged?.content?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userLikedPostsPaged.content.map((post) => (
                            <PostCard key={post.postId} post={post} currentUsername={username}/>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">No liked posts.</p>
                )}
            </TabsContent>

            <TabsContent value="commented">
                {userCommentPostsPaged?.content?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userCommentPostsPaged.content.map((post) => (
                            <PostCard key={post.postId} post={post} currentUsername={username}/>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">No commented posts.</p>
                )}
            </TabsContent>
        </Tabs>
    );
};

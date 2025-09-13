export type Post = {
    postId: number;
    username: string;
    profilePicture?: string;
    description: string;
    mediaURL?: string;
    contentType?: "IMAGE" | "VIDEO" | "TEXT";
    likesCount?: number;
    commentsCount?: number;
    isLiked: boolean;
}


export type UpdatePost = {
    description?: string;
}

export type CreatePost = {
    description: string;
    mediaUrl?: File;
    contentType?: "IMAGE" | "VIDEO" | "TEXT";
}
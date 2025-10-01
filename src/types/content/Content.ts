export type Content = {
    contentId?: number,
    title?: string,
    description?: string,
    media?: string,
    contentType?: string,
    section?: string,
    username?: string,
    profilePicture?: string,
}

export type ContentCreated = {
    title: string;
    description: string;
    section: string;
    type: string;
    file: File | undefined;
}

export type ContentUpdated = {
    title: string;
    description: string;
    section: string;
}

export type ContentForm = {
    type: string;
    formData: FormData;
}
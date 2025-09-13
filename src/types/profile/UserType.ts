export type UserOnline = {
    username: string,
    email: string,
    isOnline: boolean,
}

export type UserEssentials = {
    username: string,
    email: string,
}

export type UserDetails = {
    userEssentials: UserEssentials | null;
    profilePicture?: string | null;
    country?: string | null;
    phoneNumber?: string | null;
    bio?: string | null;
    address?: string | null;
    city?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}

export type UpdateInformation = {
    username: string,
    profilePicture?: string;
    country?: string;
    phoneNumber?: string;
    bio?: string;
    address?: string;
    city?: string;
    firstName?: string;
    lastName?: string;
}

export type UploadAvatar = {
    formData: FormData;
}
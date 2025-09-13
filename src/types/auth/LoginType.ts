export type LoginResponse = {
    message: string;
    access_token: string;
    user: {
        username: string;
        email: string;
    }
}

export type LoginRequest = {
    email: string;
    password: string;
}
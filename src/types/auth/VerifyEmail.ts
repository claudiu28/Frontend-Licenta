export type VerifyEmailRequest = {
    email: string,
    token: string,
}

export type VerifyEmailResponse = {
    message: string,
    user: {
        email: string,
        username: string,
    }
}
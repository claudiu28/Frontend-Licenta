export type ResetPasswordRequest = {
    email: string,
    token: string,
    newPassword: string,
}

export type ResetPasswordResponse = {
    message: string,
    user: {
        email: string,
        username: string
    }
}
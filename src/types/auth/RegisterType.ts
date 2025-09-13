export type RegisterRequest = {
    username: string,
    email: string
    password: string,
    confirmPassword: string,
}

export type RegisterResponse = {
    username: string,
    email: string
}

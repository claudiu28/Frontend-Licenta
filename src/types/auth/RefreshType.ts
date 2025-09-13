export type RefreshTypeRequest = { username: string }

export interface RefreshTypeResponse {
    message: string,
    access_token: string
    user: {
        email: string,
        username: string,
    }
}
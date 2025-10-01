export type Feedback = {
    feedbackId?: number
    rating?: number
    title?: string
    feedbackText?: string
    username?: string
    profilePicture?: string | null
}


export type CreateFeedback = {
    rating: number,
    title: string,
    feedback: string
}
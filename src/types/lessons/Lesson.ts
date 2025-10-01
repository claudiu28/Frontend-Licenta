export type Lesson = {
    id?:number
    username?: string;
    profilePicture?: string;
    title?: string;
    description?: string;
    durationMinutes?: number;
    numberOfTags?: number;
    numberOfCategories?: number;
    numberOfContents?: number;
}

export type CreatedLesson = {
    title: string;
    description: string;
    durationMinutes: number;
}
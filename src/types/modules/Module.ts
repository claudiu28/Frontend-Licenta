export interface Module {
    visibility?: 'PUBLIC' | 'PRIVATE';
    id?: number;
    title?: string;
    description?: string;
    username?: string;
    profilePicture?: string;
    numberOfTags?: number;
    numberOfLessons?: number;
    numberOfCategories?: number;
}

export interface CreatedModule {
    title: string;
    description: string;
    visibility: 'PUBLIC' | 'PRIVATE';

}
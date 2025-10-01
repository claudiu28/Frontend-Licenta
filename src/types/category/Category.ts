export type Category = {
    categoryId?: number,
    categoryName?: string,
    categoryDescription?: string,
    numberOfModules?: number,
    numberOfLessons?: number,
    username?: string,
    profilePicture?: string,
}

export type CategoryCreated = {
    categoryName: string,
    categoryDescription: string,
}
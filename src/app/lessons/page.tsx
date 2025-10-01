"use client"

import {useState, useRef, useEffect} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Trash2, Edit, Plus, FileText, FolderTree, Tag as TagIcon} from "lucide-react"
import {apiClient} from "@/api/client";
import {CreatedLesson, Lesson} from "@/types/lessons/Lesson";
import {Page} from "@/types/page/page"
import {Tag} from "@/types/tags/Tag"
import {Content} from "@/types/content/Content";
import {Category} from "@/types/category/Category";
import {useCurrentUser} from "@/hooks/useCurrentUser";
import {InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ErrorResponse} from "@/types/ErrorType";
import {useInfiniteScroll} from "@/hooks/useInfiniteScroll"
import {toast} from "sonner"
import {Sidebar} from "@/components/Sidebar";

const createLessonCall = async (data: CreatedLesson) => {
    return apiClient<Lesson>('lesson', 'POST', data);
};
const deleteLessonCall = async (id: number) => {
    return apiClient<void>(`lesson/${id}`, 'DELETE')
};
const updateLessonCall = async (id: number, data: CreatedLesson) => {
    return apiClient<Lesson>(`lesson/${id}`, 'PATCH', data)
};
const allLessonsCall = async () => {
    return apiClient<Page<Lesson>>('lesson/all', 'GET')
};
const userLessonsCall = async () => {
    return apiClient<Page<Lesson>>('lesson/user', 'GET')
};
const assignTagCall = async (tagId: number, lessonId: number) => {
    return apiClient<Page<Tag>>(`tag/${tagId}/lesson/${lessonId}`, 'POST')
};
const unassignTagCall = async (tagId: number, lessonId: number) => {
    return apiClient<Page<Tag>>(`tag/${tagId}/lesson/${lessonId}`, 'DELETE')
};
const userTagsCall = async () => {
    return apiClient<Page<Tag>>("tag/user", 'GET')
};
const userContentsCall = async () => {
    return apiClient<Page<Content>>('content/user', 'GET')
}
const assignContentCall = async (contentId: number, lessonId: number) => {
    return apiClient<Page<Content>>(`content/${contentId}/lesson/${lessonId}`, 'POST')
};
const unassignContentCall = async (contentId: number, lessonId: number) => {
    return apiClient<Page<Content>>(`content/${contentId}/lesson/${lessonId}`, 'DELETE')
};
const userCategoriesCall = async () => {
    return apiClient<Page<Category>>('category/user', 'GET')
}
const assignCategoryCall = async (categoryId: number, lessonId: number) => {
    return apiClient<Page<Category>>(`category/${categoryId}/lesson/${lessonId}`, 'POST')
};
const unassignCategoryCall = async (categoryId: number, lessonId: number) => {
    return apiClient<Page<Category>>(`category/${categoryId}/lesson/${lessonId}`, 'DELETE')
};
const getLessonTagsCall = async (lessonId: number) => {
    return apiClient<Page<Tag>>(`tag/lesson/${lessonId}`, 'GET')
};
const getLessonContentsCall = async (lessonId: number) => {
    return apiClient<Page<Content>>(`content/lesson/${lessonId}`, 'GET')
};
const getLessonCategoriesCall = async (lessonId: number) => {
    return apiClient<Page<Category>>(`category/lesson/${lessonId}`, 'GET')
};

function LessonCard({lesson}: { lesson: Lesson }) {
    const queryClient = useQueryClient();
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => {
            setIsMounted(false);
        };
    }, []);

    const {data: tagsUserQuery} = useQuery({
        queryKey: ["tags-user"],
        queryFn: () => userTagsCall(),
        enabled: isMounted,
        staleTime: 30000,
    })
    const tagsUser = Array.isArray(tagsUserQuery?.content) ? tagsUserQuery.content : []

    const {data: contentsUserQuery} = useQuery({
        queryKey: ["contents-user"],
        queryFn: () => userContentsCall(),
        enabled: isMounted,
        staleTime: 30000,
    })
    const contentsUser = Array.isArray(contentsUserQuery?.content) ? contentsUserQuery.content : []

    const {data: categoriesUserQuery} = useQuery({
        queryKey: ["categories-user"],
        queryFn: () => userCategoriesCall(),
        enabled: isMounted,
        staleTime: 30000,
    })
    const categoriesUser = Array.isArray(categoriesUserQuery?.content) ? categoriesUserQuery.content : []

    const {data: assignedTags} = useQuery({
        queryKey: ["lesson-tags", lesson.id],
        queryFn: () => getLessonTagsCall(lesson.id!),
        enabled: !!lesson.id && isMounted,
        staleTime: 30000,
    })

    const {data: assignedContents} = useQuery({
        queryKey: ["lesson-contents", lesson.id],
        queryFn: () => getLessonContentsCall(lesson.id!),
        enabled: !!lesson.id && isMounted,
        staleTime: 30000,
    })

    const {data: assignedCategories} = useQuery({
        queryKey: ["lesson-categories", lesson.id],
        queryFn: () => getLessonCategoriesCall(lesson.id!),
        enabled: !!lesson.id && isMounted,
        staleTime: 30000,
    })

    const updateLessonMutation = useMutation({
        mutationFn: (data: Lesson) => updateLessonCall(data.id!, {
            title: data.title!,
            description: data.description!,
            durationMinutes: data.durationMinutes || 0,
        }),
        onSuccess: (data: Lesson) => {
            if (!isMounted) return;
            toast.success(`Lesson "${data.title}" updated successfully`)
            setEditingLesson(null)
            queryClient.invalidateQueries({queryKey: ["lessons"]})
            queryClient.invalidateQueries({queryKey: ["lessons-user"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to update lesson")
        },
    })

    const deleteLessonMutation = useMutation({
        mutationFn: (id: number) => deleteLessonCall(id),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Lesson deleted successfully")
            queryClient.invalidateQueries({queryKey: ["lessons"]})
            queryClient.invalidateQueries({queryKey: ["lessons-user"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to delete lesson")
        },
    })

    const assignTagMutation = useMutation({
        mutationFn: ({lessonId, tagId}: { lessonId: number, tagId: number }) => assignTagCall(tagId, lessonId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Tag assigned successfully")
            queryClient.invalidateQueries({queryKey: ["lesson-tags", lesson.id]})
            queryClient.invalidateQueries({queryKey: ["lessons"]})
            queryClient.invalidateQueries({queryKey: ["lessons-user"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to assign tag")
        },
    })

    const unassignTagMutation = useMutation({
        mutationFn: ({lessonId, tagId}: { lessonId: number, tagId: number }) => unassignTagCall(tagId, lessonId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Tag unassigned successfully")
            queryClient.invalidateQueries({queryKey: ["lesson-tags", lesson.id]})
            queryClient.invalidateQueries({queryKey: ["lessons"]})
            queryClient.invalidateQueries({queryKey: ["lessons-user"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to unassign tag")
        },
    })

    const assignContentMutation = useMutation({
        mutationFn: ({lessonId, contentId}: { lessonId: number, contentId: number }) =>
            assignContentCall(contentId, lessonId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Content assigned successfully")
            queryClient.invalidateQueries({queryKey: ["lesson-contents", lesson.id]})
            queryClient.invalidateQueries({queryKey: ["lessons"]})
            queryClient.invalidateQueries({queryKey: ["lessons-user"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to assign content")
        },
    })

    const unassignContentMutation = useMutation({
        mutationFn: ({lessonId, contentId}: { lessonId: number, contentId: number }) =>
            unassignContentCall(contentId, lessonId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Content unassigned successfully")
            queryClient.invalidateQueries({queryKey: ["lesson-contents", lesson.id]})
            queryClient.invalidateQueries({queryKey: ["lessons"]})
            queryClient.invalidateQueries({queryKey: ["lessons-user"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to unassign content")
        },
    })

    const assignCategoryMutation = useMutation({
        mutationFn: ({lessonId, categoryId}: { lessonId: number, categoryId: number }) =>
            assignCategoryCall(categoryId, lessonId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Category assigned successfully")
            queryClient.invalidateQueries({queryKey: ["lesson-categories", lesson.id]})
            queryClient.invalidateQueries({queryKey: ["lessons"]})
            queryClient.invalidateQueries({queryKey: ["lessons-user"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to assign category")
        },
    })

    const unassignCategoryMutation = useMutation({
        mutationFn: ({lessonId, categoryId}: { lessonId: number, categoryId: number }) =>
            unassignCategoryCall(categoryId, lessonId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Category unassigned successfully")
            queryClient.invalidateQueries({queryKey: ["lesson-categories", lesson.id]})
            queryClient.invalidateQueries({queryKey: ["lessons"]})
            queryClient.invalidateQueries({queryKey: ["lessons-user"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to unassign category")
        },
    })

    const assignedTagsList = Array.isArray(assignedTags?.content) ? assignedTags.content : []
    const assignedContentsList = Array.isArray(assignedContents?.content) ? assignedContents.content : []
    const assignedCategoriesList = Array.isArray(assignedCategories?.content) ? assignedCategories.content : []

    if (!isMounted) {
        return (
            <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-semibold">{lesson.title || ''}</h3>
                        {lesson.description && (
                            <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                        )}
                        {lesson.durationMinutes && lesson.durationMinutes > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">Duration: {lesson.durationMinutes} min</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg p-4 space-y-3">
            {editingLesson?.id === lesson.id ? (
                <div className="space-y-2">
                    <Input
                        value={editingLesson?.title || ""}
                        onChange={(e) => setEditingLesson({
                            ...editingLesson,
                            title: e.target.value
                        })}
                    />
                    <Input
                        value={editingLesson?.description || ""}
                        onChange={(e) => setEditingLesson({
                            ...editingLesson,
                            description: e.target.value
                        })}
                        placeholder="Description"
                    />
                    <Input
                        type="number"
                        max={60}
                        value={editingLesson?.durationMinutes || 0}
                        onChange={(e) => setEditingLesson({
                            ...editingLesson,
                            durationMinutes: Number(e.target.value)
                        })}
                        placeholder="Duration in minutes"
                    />
                    <div className="flex gap-2">
                        <Button size="sm"
                                onClick={() => updateLessonMutation.mutate(editingLesson!)}>
                            Save
                        </Button>
                        <Button size="sm" variant="outline"
                                onClick={() => setEditingLesson(null)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-semibold">{lesson.title || ''}</h3>
                            {lesson.description && (
                                <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                            )}
                            {lesson.durationMinutes && lesson.durationMinutes > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">Duration: {lesson.durationMinutes} min</p>
                            )}
                        </div>
                        <div className="flex gap-1">
                            <Button size="sm" variant="ghost"
                                    onClick={() => setEditingLesson(lesson)}>
                                <Edit className="h-4 w-4"/>
                            </Button>
                            <Button size="sm" variant="ghost"
                                    onClick={() => deleteLessonMutation.mutate(lesson.id!)}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <TagIcon className="h-3 w-3"/>
                            {assignedTagsList.length} tags
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <FileText className="h-3 w-3"/>
                            {assignedContentsList.length} contents
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <FolderTree className="h-3 w-3"/>
                            {assignedCategoriesList.length} categories
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Assign Tag</label>
                            <Select
                                value=""
                                onValueChange={(value) => {
                                    assignTagMutation.mutate({lessonId: lesson.id!, tagId: Number(value)})
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a tag to assign"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {(tagsUser ?? [])
                                        .filter((tag) => !assignedTagsList.some((t) => t.id === tag.id))
                                        .map((tag) => (
                                            <SelectItem key={tag.id} value={tag.id?.toString() ?? ""}>
                                                {tag.tag}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Assign Content</label>
                            <Select
                                value=""
                                onValueChange={(value) => {
                                    assignContentMutation.mutate({lessonId: lesson.id!, contentId: Number(value)})
                                }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select content to assign"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {(contentsUser ?? [])
                                        .filter((content) => !assignedContentsList.some((c) => c.contentId === content.contentId))
                                        .map((content) => (
                                            <SelectItem key={content.contentId}
                                                        value={content.contentId?.toString() || ""}>
                                                {content.title}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Assign Category</label>
                            <Select
                                value=""
                                onValueChange={(value) => {
                                    assignCategoryMutation.mutate({lessonId: lesson.id!, categoryId: Number(value)})
                                }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category to assign"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {(categoriesUser ?? [])
                                        .filter((category) => !assignedCategoriesList.some((c) => c.categoryId === category.categoryId))
                                        .map((category) => (
                                            <SelectItem key={category.categoryId}
                                                        value={category.categoryId?.toString() || ""}>
                                                {category.categoryName}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {assignedTagsList.length > 0 && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Assigned Tags:</label>
                            <div className="flex gap-1 flex-wrap">
                                {(assignedTagsList ?? []).map((tag) => (
                                    <Badge key={tag.id} variant="outline" className="text-xs">
                                        <TagIcon className="h-3 w-3 mr-1"/>
                                        {tag?.tag || ''}
                                        <button
                                            onClick={() => unassignTagMutation.mutate({
                                                lessonId: lesson.id!,
                                                tagId: Number(tag.id)
                                            })}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {assignedContentsList.length > 0 && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Assigned Contents:</label>
                            <div className="flex gap-1 flex-wrap">
                                {(assignedContentsList ?? []).map((content) => (
                                    <Badge key={content.contentId} variant="outline" className="text-xs">
                                        <FileText className="h-3 w-3 mr-1"/>
                                        {content.title || ''}
                                        <button
                                            onClick={() => unassignContentMutation.mutate({
                                                lessonId: lesson.id!,
                                                contentId: Number(content.contentId)
                                            })}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {assignedCategoriesList.length > 0 && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Assigned Categories:</label>
                            <div className="flex gap-1 flex-wrap">
                                {(assignedCategoriesList ?? []).map((category) => (
                                    <Badge key={category.categoryId} variant="outline" className="text-xs">
                                        <FolderTree className="h-3 w-3 mr-1"/>
                                        {category.categoryName || ''}
                                        <button
                                            onClick={() => unassignCategoryMutation.mutate({
                                                lessonId: lesson.id!,
                                                categoryId: Number(category.categoryId)
                                            })}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default function LessonManager() {
    const {me: userMe} = useCurrentUser();
    const queryClient = useQueryClient();
    const [isMounted, setIsMounted] = useState(false);

    const [newLessonTitle, setNewLessonTitle] = useState("")
    const [newLessonDescription, setNewLessonDescription] = useState("")
    const [newDurationMinutes, setNewDurationMinutes] = useState("")

    useEffect(() => {
        setIsMounted(true);
        return () => {
            setIsMounted(false);
        };
    }, []);

    const {data: lessonsQuery, fetchNextPage, hasNextPage, isFetchingNextPage} =
        useInfiniteQuery<Page<Lesson>, ErrorResponse, InfiniteData<Page<Lesson>>, [string], number>({
            queryKey: ["lessons"],
            queryFn: () => allLessonsCall(),
            getNextPageParam: (lastPage) => {
                if (!lastPage || lastPage.last === undefined || lastPage.number === undefined) {
                    return undefined;
                }
                return lastPage.last ? undefined : lastPage.number + 1;
            },
            initialPageParam: 0,
            enabled: !!userMe && isMounted,
            staleTime: 30000,
        })

    const lessons = Array.isArray(lessonsQuery?.pages)
        ? lessonsQuery.pages.flatMap((p) => Array.isArray(p?.content) ? p.content : [])
        : []

    const loadMoreRef = useRef<HTMLDivElement | null>(null)
    useInfiniteScroll(loadMoreRef, hasNextPage, isFetchingNextPage, fetchNextPage)

    const {
        data: userLessonsQuery,
        fetchNextPage: fetchNextPageUser,
        hasNextPage: hasNextPageUser,
        isFetchingNextPage: isFetchingNextPageUser
    } =
        useInfiniteQuery<Page<Lesson>, ErrorResponse, InfiniteData<Page<Lesson>>, [string], number>({
            queryKey: ["lessons-user"],
            queryFn: () => userLessonsCall(),
            getNextPageParam: (lastPage) => {
                if (!lastPage || lastPage.last === undefined || lastPage.number === undefined) {
                    return undefined;
                }
                return lastPage.last ? undefined : lastPage.number + 1;
            },
            initialPageParam: 0,
            enabled: !!userMe && isMounted,
            staleTime: 30000,
        })

    const myLessons = Array.isArray(userLessonsQuery?.pages)
        ? userLessonsQuery.pages.flatMap((p) => Array.isArray(p?.content) ? p.content : [])
        : []

    const loadMoreRefUser = useRef<HTMLDivElement | null>(null)
    useInfiniteScroll(loadMoreRefUser, hasNextPageUser, isFetchingNextPageUser, fetchNextPageUser)

    const createLessonMutation = useMutation({
        mutationFn: (data: CreatedLesson) => createLessonCall(data),
        onSuccess: (data: Lesson) => {
            if (!isMounted) return;
            toast.success(`Lesson "${data.title}" created successfully`)
            setNewLessonTitle("")
            setNewLessonDescription("")
            setNewDurationMinutes("")
            queryClient.invalidateQueries({queryKey: ["lessons"]})
            queryClient.invalidateQueries({queryKey: ["lessons-user"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to create lesson")
        },
    })

    if (!isMounted) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-gradient-bg">
            <Sidebar/>
            <main className="flex-1 ml-64">
                <div className="p-8">
                    <div className="container mx-auto p-6 space-y-8">
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold">Lesson Management System</h1>
                            <p className="text-muted-foreground">Create, update, and manage your lessons</p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="h-5 w-5"/>
                                    Create New Lesson
                                </CardTitle>
                                <CardDescription>Add a new lesson to the system</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    placeholder="Lesson title"
                                    value={newLessonTitle}
                                    onChange={(e) => setNewLessonTitle(e.target.value)}
                                />
                                <Input
                                    placeholder="Description (optional)"
                                    value={newLessonDescription}
                                    onChange={(e) => setNewLessonDescription(e.target.value)}
                                />
                                <Input
                                    type="number"
                                    max={60}
                                    value={newDurationMinutes}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (Number(value) > 60) {
                                            setNewDurationMinutes("60");
                                        } else {
                                            setNewDurationMinutes(value);
                                        }
                                    }}
                                    placeholder="Duration in minutes"
                                />
                                <Button
                                    onClick={() => createLessonMutation.mutate({
                                        title: newLessonTitle,
                                        description: newLessonDescription,
                                        durationMinutes: Number(newDurationMinutes) || 0
                                    })}
                                    disabled={!newLessonTitle.trim()}
                                >
                                    Create Lesson
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>My Lessons ({myLessons.length})</CardTitle>
                                <CardDescription>Lessons created by you</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {(myLessons ?? []).map((lesson) => (
                                        <LessonCard key={lesson.id} lesson={lesson}/>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>All Lessons ({lessons.length})</CardTitle>
                                <CardDescription>All lessons in the system (summary view)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    {(lessons ?? []).map((lesson) => (
                                        <div key={lesson.id} className="border rounded-lg p-4 space-y-2">
                                            <h3 className="font-semibold">{lesson.title || ''}</h3>
                                            {lesson.description &&
                                                <p className="text-sm text-muted-foreground">{lesson.description}</p>}
                                            {lesson.durationMinutes && lesson.durationMinutes > 0 && (
                                                <p className="text-xs text-muted-foreground">Duration: {lesson.durationMinutes} min</p>
                                            )}
                                            <div className="flex gap-2 flex-wrap">
                                                <Badge variant="secondary" className="text-xs">
                                                    {lesson.numberOfTags || 0} tags
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    {lesson.numberOfContents || 0} contents
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    {lesson.numberOfCategories || 0} categories
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
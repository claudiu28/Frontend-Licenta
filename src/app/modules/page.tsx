"use client"

import {useState, useRef, useEffect} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Trash2, Edit, Plus, BookOpen, FolderTree, Tag, Eye, EyeOff} from "lucide-react"
import {apiClient} from "@/api/client";
import {CreatedModule, Module} from "@/types/modules/Module";
import {Page} from "@/types/page/page"
import {Tag as TagType} from "@/types/tags/Tag"
import {Lesson} from "@/types/lessons/Lesson";
import {Category} from "@/types/category/Category";
import {useCurrentUser} from "@/hooks/useCurrentUser";
import {InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ErrorResponse} from "@/types/ErrorType";
import {useInfiniteScroll} from "@/hooks/useInfiniteScroll"
import {toast} from "sonner"
import {Sidebar} from "@/components/Sidebar";

const createModuleCall = async (data: CreatedModule) => {
    return apiClient<Module>('module', 'POST', data);
};
const deleteModuleCall = async (id: number) => {
    return apiClient<void>(`module/${id}`, 'DELETE')
};
const updateModuleCall = async (id: number, data: CreatedModule) => {
    return apiClient<Module>(`module/${id}`, 'PATCH', data)
};
const allModulesCall = async () => {
    return apiClient<Page<Module>>(`module/all`, 'GET')
};
const userModulesCall = async (visibility?: 'PUBLIC' | 'PRIVATE') => {
    const query = visibility ? `?visibility=${visibility}` : '';
    return apiClient<Page<Module>>(`module/user${query}`, 'GET')
};
const assignTagCall = async (tagId: number, moduleId: number) => {
    return apiClient<Page<TagType>>(`tag/${tagId}/module/${moduleId}`, 'POST')
};
const unassignTagCall = async (tagId: number, moduleId: number) => {
    return apiClient<Page<TagType>>(`tag/${tagId}/module/${moduleId}`, 'DELETE')
};
const userTagsCall = async () => {
    return apiClient<Page<TagType>>("tag/user", 'GET')
};
const userLessonsCall = async () => {
    return apiClient<Page<Lesson>>('lesson/user', 'GET')
}
const assignLessonCall = async (lessonId: number, moduleId: number) => {
    return apiClient<Page<Lesson>>(`lesson/${lessonId}/module/${moduleId}`, 'POST')
};
const unassignLessonCall = async (lessonId: number, moduleId: number) => {
    return apiClient<Page<Lesson>>(`lesson/${lessonId}/module/${moduleId}`, 'DELETE')
};
const userCategoriesCall = async () => {
    return apiClient<Page<Category>>('category/user', 'GET')
}
const assignCategoryCall = async (categoryId: number, moduleId: number) => {
    return apiClient<Page<Category>>(`category/${categoryId}/module/${moduleId}`, 'POST')
};
const unassignCategoryCall = async (categoryId: number, moduleId: number) => {
    return apiClient<Page<Category>>(`category/${categoryId}/module/${moduleId}`, 'DELETE')
};
const getModuleTagsCall = async (moduleId: number) => {
    return apiClient<Page<TagType>>(`tag/module/${moduleId}`, 'GET')
};
const getModuleLessonsCall = async (moduleId: number) => {
    return apiClient<Page<Lesson>>(`lesson/module/${moduleId}`, 'GET')
};
const getModuleCategoriesCall = async (moduleId: number) => {
    return apiClient<Page<Category>>(`category/module/${moduleId}`, 'GET')
};

function ModuleCard({module}: { module: Module }) {
    const queryClient = useQueryClient();
    const [editingModule, setEditingModule] = useState<Module | null>(null);
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

    const {data: lessonsUserQuery} = useQuery({
        queryKey: ["lessons-user"],
        queryFn: () => userLessonsCall(),
        enabled: isMounted,
        staleTime: 30000,
    })
    const lessonsUser = Array.isArray(lessonsUserQuery?.content) ? lessonsUserQuery.content : []

    const {data: categoriesUserQuery} = useQuery({
        queryKey: ["categories-user"],
        queryFn: () => userCategoriesCall(),
        enabled: isMounted,
        staleTime: 30000,
    })
    const categoriesUser = Array.isArray(categoriesUserQuery?.content) ? categoriesUserQuery.content : []

    const {data: assignedTags} = useQuery({
        queryKey: ["module-tags", module.id],
        queryFn: () => getModuleTagsCall(module.id!),
        enabled: !!module.id && isMounted,
        staleTime: 30000,
    })

    const {data: assignedLessons} = useQuery({
        queryKey: ["module-lessons", module.id],
        queryFn: () => getModuleLessonsCall(module.id!),
        enabled: !!module.id && isMounted,
        staleTime: 30000,
    })

    const {data: assignedCategories} = useQuery({
        queryKey: ["module-categories", module.id],
        queryFn: () => getModuleCategoriesCall(module.id!),
        enabled: !!module.id && isMounted,
        staleTime: 30000,
    })

    const updateModuleMutation = useMutation({
        mutationFn: (data: Module) => updateModuleCall(data.id!, {
            title: data.title!,
            description: data.description!,
            visibility: data.visibility!,
        }),
        onSuccess: (data: Module) => {
            if (!isMounted) return;
            toast.success(`Module "${data.title}" updated successfully`)
            setEditingModule(null)
            queryClient.invalidateQueries({queryKey: ["modules"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PUBLIC"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PRIVATE"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to update module")
        },
    })

    const deleteModuleMutation = useMutation({
        mutationFn: (id: number) => deleteModuleCall(id),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Module deleted successfully")
            queryClient.invalidateQueries({queryKey: ["modules"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PUBLIC"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PRIVATE"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to delete module")
        },
    })

    const assignTagMutation = useMutation({
        mutationFn: ({moduleId, tagId}: { moduleId: number, tagId: number }) => assignTagCall(tagId, moduleId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Tag assigned successfully")
            queryClient.invalidateQueries({queryKey: ["module-tags", module.id]})
            queryClient.invalidateQueries({queryKey: ["modules"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PUBLIC"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PRIVATE"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to assign tag")
        },
    })

    const unassignTagMutation = useMutation({
        mutationFn: ({moduleId, tagId}: { moduleId: number, tagId: number }) => unassignTagCall(tagId, moduleId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Tag unassigned successfully")
            queryClient.invalidateQueries({queryKey: ["module-tags", module.id]})
            queryClient.invalidateQueries({queryKey: ["modules"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PUBLIC"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PRIVATE"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to unassign tag")
        },
    })

    const assignLessonMutation = useMutation({
        mutationFn: ({moduleId, lessonId}: { moduleId: number, lessonId: number }) =>
            assignLessonCall(lessonId, moduleId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Lesson assigned successfully")
            queryClient.invalidateQueries({queryKey: ["module-lessons", module.id]})
            queryClient.invalidateQueries({queryKey: ["modules"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PUBLIC"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PRIVATE"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to assign lesson")
        },
    })

    const unassignLessonMutation = useMutation({
        mutationFn: ({moduleId, lessonId}: { moduleId: number, lessonId: number }) =>
            unassignLessonCall(lessonId, moduleId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Lesson unassigned successfully")
            queryClient.invalidateQueries({queryKey: ["module-lessons", module.id]})
            queryClient.invalidateQueries({queryKey: ["modules"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PUBLIC"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PRIVATE"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to unassign lesson")
        },
    })

    const assignCategoryMutation = useMutation({
        mutationFn: ({moduleId, categoryId}: { moduleId: number, categoryId: number }) =>
            assignCategoryCall(categoryId, moduleId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Category assigned successfully")
            queryClient.invalidateQueries({queryKey: ["module-categories", module.id]})
            queryClient.invalidateQueries({queryKey: ["modules"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PUBLIC"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PRIVATE"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to assign category")
        },
    })

    const unassignCategoryMutation = useMutation({
        mutationFn: ({moduleId, categoryId}: { moduleId: number, categoryId: number }) =>
            unassignCategoryCall(categoryId, moduleId),
        onSuccess: () => {
            if (!isMounted) return;
            toast.success("Category unassigned successfully")
            queryClient.invalidateQueries({queryKey: ["module-categories", module.id]})
            queryClient.invalidateQueries({queryKey: ["modules"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PUBLIC"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PRIVATE"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to unassign category")
        },
    })

    const assignedTagsList = Array.isArray(assignedTags?.content) ? assignedTags.content : []
    const assignedLessonsList = Array.isArray(assignedLessons?.content) ? assignedLessons.content : []
    const assignedCategoriesList = Array.isArray(assignedCategories?.content) ? assignedCategories.content : []

    if (!isMounted) {
        return (
            <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-semibold">{module.title || ''}</h3>
                        {module.description && (
                            <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg p-4 space-y-3">
            {editingModule?.id === module.id ? (
                <div className="space-y-2">
                    <Input
                        value={editingModule?.title || ""}
                        onChange={(e) => setEditingModule({
                            ...editingModule,
                            title: e.target.value
                        })}
                        placeholder="Module title"
                    />
                    <Input
                        value={editingModule?.description || ""}
                        onChange={(e) => setEditingModule({
                            ...editingModule,
                            description: e.target.value
                        })}
                        placeholder="Description"
                    />
                    <Select
                        value={editingModule?.visibility}
                        onValueChange={(value: 'PUBLIC' | 'PRIVATE') =>
                            setEditingModule({...editingModule, visibility: value})
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select visibility"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PUBLIC">Public</SelectItem>
                            <SelectItem value="PRIVATE">Private</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                        <Button size="sm"
                                onClick={() => updateModuleMutation.mutate(editingModule!)}>
                            Save
                        </Button>
                        <Button size="sm" variant="outline"
                                onClick={() => setEditingModule(null)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{module.title || ''}</h3>
                                <Badge variant={module.visibility === 'PUBLIC' ? 'default' : 'secondary'}
                                       className="text-xs flex items-center gap-1">
                                    {module.visibility === 'PUBLIC' ? <Eye className="h-3 w-3"/> : <EyeOff className="h-3 w-3"/>}
                                    {module.visibility}
                                </Badge>
                            </div>
                            {module.description && (
                                <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline"
                                    onClick={() => setEditingModule(module)}>
                                <Edit className="h-4 w-4 mr-1"/>
                                Edit
                            </Button>
                            <Button size="sm" variant="destructive"
                                    onClick={() => deleteModuleMutation.mutate(module.id!)}>
                                <Trash2 className="h-4 w-4 mr-1"/>
                                Delete
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Tag className="h-3 w-3"/>
                            {assignedTagsList.length} tags
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3"/>
                            {assignedLessonsList.length} lessons
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <FolderTree className="h-3 w-3"/>
                            {assignedCategoriesList.length} categories
                        </Badge>
                    </div>

                    <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold flex items-center gap-1">
                                <Tag className="h-4 w-4"/>
                                Tags
                            </label>
                        </div>
                        <Select
                            value={undefined}
                            onValueChange={(value) => {
                                assignTagMutation.mutate({moduleId: module.id!, tagId: Number(value)})
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select tag to assign"/>
                            </SelectTrigger>
                            <SelectContent>
                                {(tagsUser ?? [])
                                    .filter((tag) => !(assignedTagsList ?? []).some((t) => t.id === tag.id))
                                    .map((tag) => (
                                        <SelectItem key={tag.id} value={tag.id?.toString() ?? ""}>
                                            {tag.tag}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        {assignedTagsList.length > 0 && (
                            <div className="flex gap-1 flex-wrap pt-2">
                                {(assignedTagsList ?? []).map((tag) => (
                                    <Badge key={tag.id} variant="outline" className="text-xs">
                                        {tag?.tag || ''}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                            onClick={() => unassignTagMutation.mutate({
                                                moduleId: module.id!,
                                                tagId: Number(tag.id)
                                            })}
                                        >
                                            ×
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold flex items-center gap-1">
                                <BookOpen className="h-4 w-4"/>
                                Lessons
                            </label>
                        </div>
                        <Select
                            value={undefined}
                            onValueChange={(value) => {
                                assignLessonMutation.mutate({moduleId: module.id!, lessonId: Number(value)})
                            }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select lesson to assign"/>
                            </SelectTrigger>
                            <SelectContent>
                                {(lessonsUser ?? [])
                                    .filter((lesson) => !(assignedLessonsList ?? []).some((l) => l.id === lesson.id))
                                    .map((lesson) => (
                                        <SelectItem key={lesson.id}
                                                    value={lesson.id?.toString() || ""}>
                                            {lesson.title}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        {assignedLessonsList.length > 0 && (
                            <div className="flex gap-1 flex-wrap pt-2">
                                {(assignedLessonsList ?? []).map((lesson) => (
                                    <Badge key={lesson.id} variant="outline" className="text-xs">
                                        {lesson.title || ''}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                            onClick={() => unassignLessonMutation.mutate({
                                                moduleId: module.id!,
                                                lessonId: Number(lesson.id)
                                            })}
                                        >
                                            ×
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold flex items-center gap-1">
                                <FolderTree className="h-4 w-4"/>
                                Categories
                            </label>
                        </div>
                        <Select
                            value={undefined}
                            onValueChange={(value) => {
                                assignCategoryMutation.mutate({moduleId: module.id!, categoryId: Number(value)})
                            }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category to assign"/>
                            </SelectTrigger>
                            <SelectContent>
                                {(categoriesUser ?? [])
                                    .filter((category) => !(assignedCategoriesList ?? []).some((c) => c.categoryId === category.categoryId))
                                    .map((category) => (
                                        <SelectItem key={category.categoryId}
                                                    value={category.categoryId?.toString() || ""}>
                                            {category.categoryName}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        {assignedCategoriesList.length > 0 && (
                            <div className="flex gap-1 flex-wrap pt-2">
                                {(assignedCategoriesList ?? []).map((category) => (
                                    <Badge key={category.categoryId} variant="outline" className="text-xs">
                                        {category.categoryName || ''}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                            onClick={() => unassignCategoryMutation.mutate({
                                                moduleId: module.id!,
                                                categoryId: Number(category.categoryId)
                                            })}
                                        >
                                            ×
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default function ModuleManager() {
    const {me: userMe} = useCurrentUser();
    const queryClient = useQueryClient();
    const [isMounted, setIsMounted] = useState(false);

    const [newModuleTitle, setNewModuleTitle] = useState("")
    const [newModuleDescription, setNewModuleDescription] = useState("")
    const [newModuleVisibility, setNewModuleVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')

    useEffect(() => {
        setIsMounted(true);
        return () => {
            setIsMounted(false);
        };
    }, []);

    const {data: modulesQuery, fetchNextPage, hasNextPage, isFetchingNextPage} =
        useInfiniteQuery<Page<Module>, ErrorResponse, InfiniteData<Page<Module>>, [string], number>({
            queryKey: ["modules"],
            queryFn: () => allModulesCall(),
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
    const modules = Array.isArray(modulesQuery?.pages)
        ? modulesQuery.pages.flatMap((p) => Array.isArray(p?.content) ? p.content : [])
        : []
    const loadMoreRef = useRef<HTMLDivElement | null>(null)
    useInfiniteScroll(loadMoreRef, hasNextPage, isFetchingNextPage, fetchNextPage)

    const {data: userPublicModulesQuery, fetchNextPage: fetchNextPagePublic, hasNextPage: hasNextPagePublic, isFetchingNextPage: isFetchingNextPagePublic} =
        useInfiniteQuery<Page<Module>, ErrorResponse, InfiniteData<Page<Module>>, [string, string], number>({
            queryKey: ["modules-user", "PUBLIC"],
            queryFn: () => userModulesCall('PUBLIC'),
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
    const myPublicModules = Array.isArray(userPublicModulesQuery?.pages)
        ? userPublicModulesQuery.pages.flatMap((p) => Array.isArray(p?.content) ? p.content : [])
        : []
    const loadMoreRefPublic = useRef<HTMLDivElement | null>(null)
    useInfiniteScroll(loadMoreRefPublic, hasNextPagePublic, isFetchingNextPagePublic, fetchNextPagePublic)

    const {data: userPrivateModulesQuery, fetchNextPage: fetchNextPagePrivate, hasNextPage: hasNextPagePrivate, isFetchingNextPage: isFetchingNextPagePrivate} =
        useInfiniteQuery<Page<Module>, ErrorResponse, InfiniteData<Page<Module>>, [string, string], number>({
            queryKey: ["modules-user", "PRIVATE"],
            queryFn: () => userModulesCall('PRIVATE'),
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
    const myPrivateModules = Array.isArray(userPrivateModulesQuery?.pages)
        ? userPrivateModulesQuery.pages.flatMap((p) => Array.isArray(p?.content) ? p.content : [])
        : []
    const loadMoreRefPrivate = useRef<HTMLDivElement | null>(null)
    useInfiniteScroll(loadMoreRefPrivate, hasNextPagePrivate, isFetchingNextPagePrivate, fetchNextPagePrivate)

    const createModuleMutation = useMutation({
        mutationFn: (data: CreatedModule) => createModuleCall(data),
        onSuccess: (data: Module) => {
            if (!isMounted) return;
            toast.success(`Module "${data.title}" created successfully`)
            setNewModuleTitle("")
            setNewModuleDescription("")
            setNewModuleVisibility('PUBLIC')
            queryClient.invalidateQueries({queryKey: ["modules"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PUBLIC"]})
            queryClient.invalidateQueries({queryKey: ["modules-user", "PRIVATE"]})
        },
        onError: (error: ErrorResponse) => {
            if (!isMounted) return;
            toast.error(error.message || "Failed to create module")
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
                            <h1 className="text-3xl font-bold">Module Management System</h1>
                            <p className="text-muted-foreground">Create, update, and manage your modules</p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="h-5 w-5"/>
                                    Create New Module
                                </CardTitle>
                                <CardDescription>Add a new module to the system</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    placeholder="Module title"
                                    value={newModuleTitle}
                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                />
                                <Input
                                    placeholder="Description (optional)"
                                    value={newModuleDescription}
                                    onChange={(e) => setNewModuleDescription(e.target.value)}
                                />
                                <Select
                                    value={newModuleVisibility}
                                    onValueChange={(value: 'PUBLIC' | 'PRIVATE') => setNewModuleVisibility(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select visibility"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PUBLIC">Public</SelectItem>
                                        <SelectItem value="PRIVATE">Private</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={() => createModuleMutation.mutate({
                                        title: newModuleTitle,
                                        description: newModuleDescription,
                                        visibility: newModuleVisibility,
                                    })}
                                    disabled={!newModuleTitle.trim()}
                                >
                                    Create Module
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>My Public Modules ({myPublicModules.length})</CardTitle>
                                <CardDescription>Your public modules visible to everyone</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {(myPublicModules ?? []).map((module) => (
                                        <ModuleCard key={module.id} module={module}/>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>My Private Modules ({myPrivateModules.length})</CardTitle>
                                <CardDescription>Your private modules - only visible to you</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {(myPrivateModules ?? []).map((module) => (
                                        <ModuleCard key={module.id} module={module}/>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>All Modules ({modules.length})</CardTitle>
                                <CardDescription>All modules in the system</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    {(modules ?? []).map((module) => (
                                        <div key={module.id} className="border rounded-lg p-4 space-y-2">
                                            <div className="flex items-start justify-between">
                                                <h3 className="font-semibold">{module.title || ''}</h3>
                                                <Badge variant={module.visibility === 'PUBLIC' ? 'default' : 'secondary'}
                                                       className="text-xs flex items-center gap-1">
                                                    {module.visibility === 'PUBLIC' ? <Eye className="h-3 w-3"/> : <EyeOff className="h-3 w-3"/>}
                                                    {module.visibility}
                                                </Badge>
                                            </div>
                                            {module.description &&
                                                <p className="text-sm text-muted-foreground">{module.description}</p>}
                                            <div className="flex gap-2 flex-wrap">
                                                <Badge variant="secondary" className="text-xs">
                                                    {module.numberOfTags || 0} tags
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    {module.numberOfLessons || 0} lessons
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    {module.numberOfCategories || 0} categories
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
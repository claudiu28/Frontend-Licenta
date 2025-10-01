"use client"

import {useState, useRef} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Trash2, Edit, Plus} from "lucide-react"
import {useCurrentUser} from "@/hooks/useCurrentUser";
import {apiClient} from "@/api/client";
import {Page} from "@/types/page/page"
import {InfiniteData, useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {ErrorResponse} from "@/types/ErrorType";
import {useInfiniteScroll} from "@/hooks/useInfiniteScroll";
import {toast} from "sonner";
import {Sidebar} from "@/components/Sidebar";
import {Category, CategoryCreated} from "@/types/category/Category";

const createCategoryCall = async (data: CategoryCreated): Promise<Category> => {
    return apiClient<Category>('category', 'POST', data);
}

const getAllCategoryCall = async () => {
    return apiClient<Page<Category>>('category/all', 'GET');
}

const getAllCategoryUsersCall = async () => {
    return apiClient<Page<Category>>(`category/user`, 'GET');
}

const updateCategoryCall = async (id: number, data: CategoryCreated) => {
    return apiClient<Category>(`category/${id}`, 'PATCH', data);
}

const deleteCategoryCall = async (id: number) => {
    return apiClient<void>(`category/${id}`, 'DELETE');
}

export default function CategoryManager() {
    const {me: userMe} = useCurrentUser();
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryDescription, setNewCategoryDescription] = useState("");
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const queryClient = useQueryClient();
    const username = userMe?.userEssentials?.username! || "";

    const {
        data: categoryQuery,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } =
        useInfiniteQuery<Page<Category>, ErrorResponse, InfiniteData<Page<Category>>, [string], number>({
            queryKey: ["categories"],
            queryFn: () => getAllCategoryCall(),
            getNextPageParam: (last) => (!last.last ? last.number + 1 : undefined),
            initialPageParam: 0,
            enabled: !!username,
        })
    const categories = categoryQuery?.pages.flatMap((p) => p.content) ?? []
    const loadMoreRefs = useRef<HTMLDivElement | null>(null);
    useInfiniteScroll(loadMoreRefs, hasNextPage, isFetchingNextPage, fetchNextPage);

    const {
        data: categoriesUserQuery,
        fetchNextPage: fetchNextPage1,
        hasNextPage: hasNextPage1,
        isFetchingNextPage: isFetchingNextPage1
    } =
        useInfiniteQuery<Page<Category>, ErrorResponse, InfiniteData<Page<Category>>, [string], number>({
            queryKey: ["categories-user"],
            queryFn: () => getAllCategoryUsersCall(),
            getNextPageParam: (last) => (!last.last ? last.number + 1 : undefined),
            initialPageParam: 0,
            enabled: !!username,
        })
    const categoriesUser = categoriesUserQuery?.pages.flatMap((p) => p.content) ?? []
    const loadMoreRefs1 = useRef<HTMLDivElement | null>(null);
    useInfiniteScroll(loadMoreRefs1, hasNextPage1, isFetchingNextPage1, fetchNextPage1);

    const createCategoryMutation = useMutation({
        mutationFn: (data: CategoryCreated) => createCategoryCall(data),
        onSuccess: (data: Category) => {
            toast.success(`Category "${data.categoryName}" created successfully`);
            setNewCategoryName("");
            setNewCategoryDescription("");
            queryClient.invalidateQueries({queryKey: ["categories"]}).then();
            queryClient.invalidateQueries({queryKey: ["categories-user"]}).then();
        },
        onError: (error: ErrorResponse) => {
            toast.error(error.message || "Failed to create category");
        }
    })

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: number) => deleteCategoryCall(id),
        onSuccess: () => {
            toast.success("Category deleted successfully");
            queryClient.invalidateQueries({queryKey: ["categories"]}).then();
            queryClient.invalidateQueries({queryKey: ["categories-user"]}).then();
        },
        onError: (error: ErrorResponse) => {
            toast.error(error.message || "Failed to delete category");
        }
    })

    const updateCategoryMutation = useMutation({
        mutationFn: (data: Category) =>
            updateCategoryCall(data.categoryId!, {
                categoryName: data.categoryName!,
                categoryDescription: data.categoryDescription!
            }),
        onSuccess: (data: Category) => {
            toast.success(`Category "${data.categoryName}" updated successfully`);
            setEditingCategory(null);
            queryClient.invalidateQueries({queryKey: ["categories"]}).then();
            queryClient.invalidateQueries({queryKey: ["categories-user"]}).then();
        },
        onError: (error: ErrorResponse) => {
            toast.error(error.message || "Failed to update category");
        }
    })

    const handleCreateCategory = () => {
        if (!newCategoryName.trim()) return;
        createCategoryMutation.mutate({categoryName: newCategoryName.trim(), categoryDescription: newCategoryDescription});
    }

    const handleDeleteCategory = (id: number) => {
        deleteCategoryMutation.mutate(id);
    };

    const handleEditCategory = () => {
        if (!editingCategory?.categoryId || !editingCategory?.categoryName) return;
        updateCategoryMutation.mutate(editingCategory);
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar/>
            <div className="flex-1 flex flex-col">
                <div className="container mx-auto p-6 space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold">Category Management System</h1>
                        <p className="text-muted-foreground">Create, update, and manage your categories</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5"/>
                                Create New Category
                            </CardTitle>
                            <CardDescription>Add a new category to the system</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <Input
                                    placeholder="Category name"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <Input
                                    placeholder="Category description"
                                    value={newCategoryDescription}
                                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                                />
                                <Button onClick={handleCreateCategory}
                                        disabled={!newCategoryName.trim() && !newCategoryDescription.trim()}>
                                    Create Category
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Categories ({categoriesUser.length})</CardTitle>
                            <CardDescription>Categories created by you</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {categoriesUser.map((category) => (
                                    <div key={category.categoryId} className="border rounded-lg p-4 space-y-2">
                                        {editingCategory?.categoryId === category.categoryId ? (
                                            <div className="space-y-2">
                                                <Input
                                                    value={editingCategory?.categoryName}
                                                    onChange={(e) => setEditingCategory({
                                                        ...editingCategory,
                                                        categoryName: e.target.value
                                                    })}
                                                />
                                                <Input
                                                    value={editingCategory?.categoryDescription}
                                                    onChange={(e) => setEditingCategory({
                                                        ...editingCategory,
                                                        categoryDescription: e.target.value
                                                    })}
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={handleEditCategory}>
                                                        Save
                                                    </Button>
                                                    <Button size="sm" variant="outline"
                                                            onClick={() => setEditingCategory(null)}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="default">{category.categoryName}</Badge>
                                                    <p>
                                                        {category.categoryDescription || "No description"}
                                                    </p>
                                                    <div className="flex gap-1">
                                                        <Button size="sm" variant="ghost"
                                                                onClick={() => setEditingCategory(category)}>
                                                            <Edit className="h-4 w-4"/>
                                                        </Button>
                                                        <Button size="sm" variant="ghost"
                                                                onClick={() => handleDeleteCategory(category.categoryId!)}>
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>All Categories ({categories.length})</CardTitle>
                            <CardDescription>All categories in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {categories.map((category) => (
                                    <div key={category.categoryId} className="border rounded-lg p-4 space-y-2">
                                        <Badge variant="secondary">{category.categoryName}</Badge>
                                        <p>
                                            {category.categoryDescription || "No description"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

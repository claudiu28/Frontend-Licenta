"use client"

import React, {useState, useRef} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {CreateFeedback, Feedback} from "@/types/feedback/page";
import {apiClient} from "@/api/client";
import {Page} from "@/types/page/page"
import {useCurrentUser} from "@/hooks/useCurrentUser";
import {InfiniteData, useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {ErrorResponse} from "@/types/ErrorType";
import {useInfiniteScroll} from "@/hooks/useInfiniteScroll";
import {toast} from "sonner";
import {Sidebar} from "@/components/Sidebar";

const getAllFeedbackCall = async (): Promise<Page<Feedback>> => {
    return apiClient<Page<Feedback>>("feedback/all", "GET");
}

const createFeedbackCall = async (data: CreateFeedback): Promise<Feedback> => {
    return apiClient<Feedback>("feedback", "POST", data);
}

const deleteFeedback = async (id: number) => {
    return apiClient<void>(`feedback/${id}`, "DELETE");
}

const userFeedbackCall = async (): Promise<Page<Feedback>> => {
    return apiClient<Page<Feedback>>("feedback", "GET");
}

const updateFeedbackCall = async (id: number, data: CreateFeedback) => {
    return apiClient<Feedback>(`feedback/${id}`, "PATCH", data);
}

export default function FeedbackCenter() {
    const {me: currentUser} = useCurrentUser();
    const queryClient = useQueryClient();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isUserFeedbacksModalOpen, setIsUserFeedbacksModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null)

    const [feedbackFormData, setFeedbackFormData] = useState({
        title: "",
        rating: 0,
        feedbackText: ""
    })

    // All feedback infinite query
    const {
        data: allFeedbackDataPaged,
        fetchNextPage: fetchNextPage1,
        hasNextPage: hasNextPage1,
        isFetchingNextPage: isFetchingNextPage1
    } = useInfiniteQuery<Page<Feedback>, ErrorResponse, InfiniteData<Page<Feedback>>, [string], number>({
        queryKey: ['allFeedback'],
        queryFn: ({pageParam = 0}) => getAllFeedbackCall(),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage.last) {
                return lastPage.number + 1;
            }
            return undefined;
        }
    })
    const loadMoreRefs = useRef<HTMLDivElement | null>(null);
    useInfiniteScroll(loadMoreRefs, hasNextPage1, isFetchingNextPage1, fetchNextPage1);

    // User feedback infinite query
    const {
        data: userFeedbackDataPaged,
        fetchNextPage: fetchNextPage2,
        hasNextPage: hasNextPage2,
        isFetchingNextPage: isFetchingNextPage2
    } = useInfiniteQuery<Page<Feedback>, ErrorResponse, InfiniteData<Page<Feedback>>, [string], number>({
        queryKey: ['userFeedback'],
        queryFn: ({pageParam = 0}) => userFeedbackCall(),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage.last) {
                return lastPage.number + 1;
            }
            return undefined;
        }
    });
    const loadMoreRefs2 = useRef<HTMLDivElement | null>(null);
    useInfiniteScroll(loadMoreRefs2, hasNextPage2, isFetchingNextPage2, fetchNextPage2);

    const feedbacksAll = allFeedbackDataPaged?.pages.flatMap(page => page.content) || [];
    const feedbacksUser = userFeedbackDataPaged?.pages.flatMap(page => page.content) || [];

    // Mutations
    const createFeedbackMutation = useMutation({
        mutationFn: (data: CreateFeedback) => createFeedbackCall(data),
        onSuccess: () => {
            toast.success("Feedback created successfully")
            setIsCreateModalOpen(false)
            setFeedbackFormData({title: "", rating: 0, feedbackText: ""})
            queryClient.invalidateQueries({queryKey: ["userFeedback"]});
            queryClient.invalidateQueries({queryKey: ["allFeedback"]});
        },
        onError: (error: ErrorResponse) => {
            toast.error("Failed to create feedback: " + error.message)
        },
    })

    const updateFeedbackMutation = useMutation({
        mutationFn: ({id, data}: { id: number, data: CreateFeedback }) => updateFeedbackCall(id, data),
        onSuccess: () => {
            toast.success("Feedback updated successfully")
            setIsEditModalOpen(false)
            setEditingFeedback(null)
            setFeedbackFormData({title: "", rating: 0, feedbackText: ""})
            queryClient.invalidateQueries({queryKey: ["userFeedback"]});
            queryClient.invalidateQueries({queryKey: ["allFeedback"]});
        },
        onError: (error: ErrorResponse) => {
            toast.error("Failed to update feedback: " + error.message)
        },
    });

    const deleteFeedbackMutation = useMutation({
        mutationFn: (id: number) => deleteFeedback(id),
        onSuccess: () => {
            toast.success("Feedback deleted successfully")
            queryClient.invalidateQueries({queryKey: ["userFeedback"]});
            queryClient.invalidateQueries({queryKey: ["allFeedback"]});
        },
        onError: (error: ErrorResponse) => {
            toast.error("Failed to delete feedback: " + error.message)
        },
    });

    // Handlers
    const handleCreateFeedback = () => {
        createFeedbackMutation.mutate({
            title: feedbackFormData.title,
            rating: feedbackFormData.rating,
            feedback: feedbackFormData.feedbackText
        })
    }

    const handleUpdateFeedback = () => {
        if (!editingFeedback) return;
        updateFeedbackMutation.mutate({
            id: editingFeedback.feedbackId!,
            data: {
                title: feedbackFormData.title,
                rating: feedbackFormData.rating,
                feedback: feedbackFormData.feedbackText
            }
        })
    }

    const handleDeleteFeedback = (id: number) => {
        deleteFeedbackMutation.mutate(id)
    }

    const openEditModal = (feedbackItem: Feedback) => {
        setEditingFeedback(feedbackItem)
        setFeedbackFormData({
            title: feedbackItem.title || "",
            rating: feedbackItem.rating || 0,
            feedbackText: feedbackItem.feedbackText || ""
        })
        setIsEditModalOpen(true)
    }


    return (
        <div className="flex min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/30">
            <aside className="sticky top-0 h-screen">
                <Sidebar/>
            </aside>
            <main className="flex-1 overflow-y-auto">

                <div className="flex-1 md:ml-0">
                    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
                        <div className="max-w-6xl mx-auto space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900">Feedback Center</h1>
                                    <p className="text-muted-foreground">Share your thoughts and help us improve</p>
                                </div>
                                <div className="flex gap-3">
                                    <Dialog open={isUserFeedbacksModalOpen} onOpenChange={setIsUserFeedbacksModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor"
                                                     viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                                </svg>
                                                User Feedbacks
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[700px] max-h-[600px]">
                                            <DialogHeader>
                                                <DialogTitle>Your Feedbacks</DialogTitle>
                                                <DialogDescription>Manage and track your submitted
                                                    feedback</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 overflow-y-auto max-h-[400px]">
                                                {feedbacksUser.length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <p className="text-muted-foreground">You haven't submitted any
                                                            feedback yet</p>
                                                    </div>
                                                ) : (
                                                    feedbacksUser.map((item) => (
                                                        <div key={item.feedbackId}
                                                             className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <h3 className="font-semibold">{item.title}</h3>
                                                                    </div>
                                                                    <p className="text-muted-foreground text-sm">{item.feedbackText}</p>
                                                                    {item.rating && (
                                                                        <div className="flex items-center gap-1 mt-2">
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <svg key={i}
                                                                                     className={`w-4 h-4 ${i < (item.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                                     fill="currentColor"
                                                                                     viewBox="0 0 20 20">
                                                                                    <path
                                                                                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                                                                </svg>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2 ml-4">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => openEditModal(item)}
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none"
                                                                             stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round"
                                                                                  strokeLinejoin="round" strokeWidth={2}
                                                                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                                        </svg>
                                                                    </Button>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="outline" size="sm"
                                                                                    className="text-red-600 hover:text-red-700">
                                                                                <svg className="w-4 h-4" fill="none"
                                                                                     stroke="currentColor"
                                                                                     viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round"
                                                                                          strokeLinejoin="round"
                                                                                          strokeWidth={2}
                                                                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                                                </svg>
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Delete
                                                                                    Feedback</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Are you sure you want to delete this
                                                                                    feedback? This action cannot be
                                                                                    undone.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => handleDeleteFeedback(item.feedbackId!)}
                                                                                    className="bg-red-600 hover:bg-red-700"
                                                                                >
                                                                                    Delete
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                                <div ref={loadMoreRefs2}>
                                                    {isFetchingNextPage2 &&
                                                        <div className="text-center py-4">Loading more...</div>}
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Create Feedback Button */}
                                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor"
                                                     viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M12 4v16m8-8H4"/>
                                                </svg>
                                                Create Feedback
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[525px]">
                                            <DialogHeader>
                                                <DialogTitle>Create New Feedback</DialogTitle>
                                                <DialogDescription>Share your thoughts, report bugs, or suggest
                                                    improvements</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="title">Title</Label>
                                                    <Input
                                                        id="title"
                                                        value={feedbackFormData.title}
                                                        onChange={(e) => setFeedbackFormData(prev => ({
                                                            ...prev,
                                                            title: e.target.value
                                                        }))}
                                                        placeholder="Brief description of your feedback"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="rating">Rating</Label>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onClick={() => setFeedbackFormData(prev => ({
                                                                    ...prev,
                                                                    rating: star
                                                                }))}
                                                                className={`text-2xl ${star <= feedbackFormData.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                                                            >
                                                                ★
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="description">Description</Label>
                                                    <Textarea
                                                        id="description"
                                                        value={feedbackFormData.feedbackText}
                                                        onChange={(e) => setFeedbackFormData(prev => ({
                                                            ...prev,
                                                            feedbackText: e.target.value
                                                        }))}
                                                        placeholder="Provide detailed information about your feedback"
                                                        rows={4}
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-3">
                                                    <Button variant="outline"
                                                            onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                                    <Button
                                                        onClick={handleCreateFeedback}
                                                        disabled={!feedbackFormData.title || !feedbackFormData.feedbackText}
                                                    >
                                                        Create Feedback
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>All Feedback</CardTitle>
                                    <CardDescription>Browse all submitted feedback from the community</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {feedbacksAll.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50">
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-medium mb-2">No feedback available</h3>
                                            <p className="text-muted-foreground">Be the first to submit feedback!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {feedbacksAll.map((item) => (
                                                <div key={item.feedbackId}
                                                     className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="font-semibold">{item.title}</h3>
                                                            </div>
                                                            <p className="text-muted-foreground mb-2">{item.feedbackText}</p>
                                                            {item.rating && (
                                                                <div className="flex items-center gap-1">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <svg key={i}
                                                                             className={`w-4 h-4 ${i < (item.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                             fill="currentColor" viewBox="0 0 20 20">
                                                                            <path
                                                                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                                                        </svg>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={loadMoreRefs}>
                                                {isFetchingNextPage1 &&
                                                    <div className="text-center py-4">Loading more...</div>}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                                <DialogContent className="sm:max-w-[525px]">
                                    <DialogHeader>
                                        <DialogTitle>Edit Feedback</DialogTitle>
                                        <DialogDescription>Update your feedback details</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="edit-title">Title</Label>
                                            <Input
                                                id="edit-title"
                                                value={feedbackFormData.title}
                                                onChange={(e) => setFeedbackFormData(prev => ({
                                                    ...prev,
                                                    title: e.target.value
                                                }))}
                                                placeholder="Brief description of your feedback"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="edit-rating">Rating</Label>
                                            <div className="flex items-center gap-1 mt-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setFeedbackFormData(prev => ({
                                                            ...prev,
                                                            rating: star
                                                        }))}
                                                        className={`text-2xl ${star <= feedbackFormData.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                                                    >
                                                        ★
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="edit-description">Description</Label>
                                            <Textarea
                                                id="edit-description"
                                                value={feedbackFormData.feedbackText}
                                                onChange={(e) => setFeedbackFormData(prev => ({
                                                    ...prev,
                                                    feedbackText: e.target.value
                                                }))}
                                                placeholder="Provide detailed information about your feedback"
                                                rows={4}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <Button variant="outline"
                                                    onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                            <Button
                                                onClick={handleUpdateFeedback}
                                                disabled={!feedbackFormData.title || !feedbackFormData.feedbackText}
                                            >
                                                Update Feedback
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
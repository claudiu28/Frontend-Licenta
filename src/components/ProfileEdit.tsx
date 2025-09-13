"use client";

import {
    Activity,
    Apple,
    Camera,
    Dumbbell,
    Edit,
    Heart,
    Settings,
    Target,
    Trash2,
    Upload,
    User,
} from "lucide-react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {Popover, PopoverTrigger, PopoverContent} from "@/components/ui/popover";
import {AlertCircle} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";
import React, {useEffect, useRef, useState} from "react";
import {
    ActivityLevelType,
    EquipmentAccessType,
    GenderType,
    GoalType,
    WellnessDetails,
} from "@/types/profile/WellnessType";
import {
    UpdateInformation,
    UploadAvatar,
    UserDetails,
} from "@/types/profile/UserType";
import {apiClient} from "@/api/client";
import {useMutation, useQuery} from "@tanstack/react-query";
import {ErrorResponse} from "@/types/ErrorType";
import {toast} from "sonner";
import {useCurrentUser} from "@/hooks/useCurrentUser";
import {Post} from "@/types/social/Post";
import {Page} from "@/types/page/page";
import {PostCard} from "@/components/PostCard";
import {UserPostsTabs} from "@/components/ProfilePostTab";


export const wellnessMeProfile = async (): Promise<WellnessDetails> => {
    return apiClient<WellnessDetails>(`wellness/me`, "GET");
};

export const updateProfileInformation = async (data: UpdateInformation): Promise<UserDetails> => {
    return apiClient<UserDetails>(`profile/me/information`, "PATCH", data);
};

export const wellnessUpdateProfile = async (data: WellnessDetails): Promise<WellnessDetails> => {
    return apiClient<WellnessDetails>("wellness/profile", "PATCH", data);
};

export const deleteProfilePicture = async (): Promise<UserDetails> => {
    return apiClient<UserDetails>(`profile/me/avatar`, "DELETE");
};

export const uploadProfilePicture = async (uploadData: UploadAvatar): Promise<UserDetails> => {
    return apiClient<UserDetails>(`profile/me/avatar`, "POST", uploadData.formData);
};


export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingWellness, setIsEditingWellness] = useState(false);

    const {me: meUser} = useCurrentUser();
    const {data: wellnessPrivate} = useQuery<WellnessDetails, ErrorResponse, WellnessDetails>({
        queryKey: ['wellness'],
        queryFn: () => wellnessMeProfile(),
        staleTime: 300000,
    });
    const [wellnessForm, setWellnessForm] = useState<WellnessDetails>({});
    const [userDetailsForm, setUserDetailsForm] = useState({
        username: meUser?.userEssentials?.username || "",
        email: meUser?.userEssentials?.email || "",
        firstName: meUser?.firstName || "",
        lastName: meUser?.lastName || "",
        phoneNumber: meUser?.phoneNumber || "",
        country: meUser?.country || "",
        city: meUser?.city || "",
        address: meUser?.address || "",
        bio: meUser?.bio || "",
        profilePicture: meUser?.profilePicture || ""
    });

    useEffect(() => {
        if (wellnessPrivate) {
            setWellnessForm({
                gender: wellnessPrivate.gender as GenderType | undefined,
                birthDate: wellnessPrivate.birthDate ?? undefined,
                activityLevel: wellnessPrivate.activityLevel as ActivityLevelType | undefined,
                heightCm: wellnessPrivate.heightCm ?? null,
                weightKg: wellnessPrivate.weightKg ?? null,
                primaryGoal: wellnessPrivate.primaryGoal as GoalType | undefined,
                equipmentAccess: wellnessPrivate.equipmentAccess as EquipmentAccessType | undefined,
                mealsPerDay: wellnessPrivate.mealsPerDay ?? null,
                dislikedFoods: wellnessPrivate.dislikedFoods ?? "",
                sleepTargetHours: wellnessPrivate.sleepTargetHours ?? null,
                hydrationTargetMl: wellnessPrivate.hydrationTargetMl ?? null,
                stepsTarget: wellnessPrivate.stepsTarget ?? null,
            });
        }
    }, [wellnessPrivate]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const initials = (meUser?.firstName?.[0] ?? "") + (meUser?.lastName?.[0] ?? "");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const updateProfileMutation = useMutation<UserDetails, ErrorResponse, UpdateInformation>({
        mutationFn: updateProfileInformation,
        onSuccess: (data) => {
            setUserDetailsForm({
                username: data.userEssentials?.username || "",
                email: data.userEssentials?.email || "",
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                phoneNumber: data.phoneNumber || "",
                country: data.country || "",
                city: data.city || "",
                address: data.address || "",
                bio: data.bio || "",
                profilePicture: data.profilePicture || ""
            });
            setIsEditing(false);
            toast.success("Profile updated successfully");
        },
        onError: (error) => {
            toast.error("Failed to update profile: " + (error.message || "Unknown"));
        },
    });

    const wellnessUpdate = useMutation<WellnessDetails, ErrorResponse, WellnessDetails>({
        mutationFn: wellnessUpdateProfile,
        onSuccess: (data) => {
            setWellnessForm({
                gender: data.gender as GenderType | undefined,
                birthDate: data.birthDate ?? undefined,
                activityLevel: data.activityLevel as ActivityLevelType | undefined,
                heightCm: data.heightCm ?? null,
                weightKg: data.weightKg ?? null,
                primaryGoal: data.primaryGoal as GoalType | undefined,
                equipmentAccess: data.equipmentAccess as EquipmentAccessType | undefined,
                mealsPerDay: data.mealsPerDay ?? null,
                dislikedFoods: data.dislikedFoods ?? "",
                sleepTargetHours: data.sleepTargetHours ?? null,
                hydrationTargetMl: data.hydrationTargetMl ?? null,
                stepsTarget: data.stepsTarget ?? null,
            });
            setIsEditingWellness(false);
            toast.success("Wellness updated successfully");
        },
        onError: (error) => {
            toast.error("Failed to update wellness: " + (error.message || "Unknown"));
        },
    });

    const uploadAvatarMutation = useMutation<UserDetails, ErrorResponse, UploadAvatar>({
        mutationFn: uploadProfilePicture,
        onSuccess: (data) => {
            setUserDetailsForm((prev) => ({
                ...prev,
                profilePicture: data.profilePicture || "",
            }));
            toast.success("Profile picture uploaded");
        },
        onError: (error) =>
            toast.error("Upload failed: " + (error.message || "Unknown")),
    });

    const deleteAvatarMutation = useMutation<UserDetails, ErrorResponse, void>({
        mutationFn: deleteProfilePicture,
        onSuccess: () => {
            setUserDetailsForm((prev) => ({...prev, profilePicture: ""}));
            toast.success("Profile picture removed");
        },
        onError: (error) =>
            toast.error("Failed to remove picture: " + (error.message || "Unknown")),
    });

    const handleRemovePicture = () => {
        deleteAvatarMutation.mutate();
    }

    const handleSaveAccount = () => {
        updateProfileMutation.mutate({
            username: userDetailsForm.username, firstName: userDetailsForm.firstName,
            lastName: userDetailsForm.lastName, phoneNumber: userDetailsForm.phoneNumber,
            country: userDetailsForm.country, city: userDetailsForm.city,
            address: userDetailsForm.address, bio: userDetailsForm.bio,
        });
    }

    const handleSaveWellness = () => {
        wellnessUpdate.mutate(wellnessForm);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    }

    const handleSavePicture = () => {
        if (!selectedFile) {
            toast.error("Please select a file first");
            return;
        }
        const formData = new FormData();
        formData.append("file", selectedFile);
        uploadAvatarMutation.mutate({formData});
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCancelPicture = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

    }
    const username = meUser?.userEssentials?.username || "";

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/30">
            <div className="flex-1 md:ml-0">
                <div className="container mx-auto p-4 lg:p-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div
                            className="text-center py-8 px-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                            <div
                                className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                                <User className="w-8 h-8 text-primary-foreground"/>
                            </div>
                            <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">Your Profile</h1>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
                                Manage your account details and wellness journey in one beautiful place
                            </p>
                        </div>

                        <Tabs defaultValue="account" className="space-y-6">
                            <div className="flex justify-center">
                                <TabsList
                                    className="grid w-full max-w-md grid-cols-2 h-12 bg-card border border-border">
                                    <TabsTrigger
                                        value="account"
                                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
                                    >
                                        <User className="w-4 h-4 mr-2"/>
                                        Account
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="wellness"
                                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
                                    >
                                        <Heart className="w-4 h-4 mr-2"/>
                                        Wellness
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="account" className="space-y-6">

                                <Card className="enhanced-card border-green-100 bg-card/50 backdrop-blur-sm">
                                    <CardHeader className="pb-4 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Camera className="w-5 h-5 text-primary"/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Profile Picture</CardTitle>
                                                <CardDescription>Manage your profile image below</CardDescription>
                                            </div>
                                        </div>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700">
                                                    <AlertCircle className="h-5 w-5"/>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 text-sm">
                                                <p className="font-medium text-foreground mb-1">Profile Picture
                                                    Guidelines:</p>
                                                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                                    <li>Supported formats: JPG, PNG</li>
                                                    <li>Max size: 2MB</li>
                                                    <li>Square images recommended (1:1 ratio)</li>
                                                    <li>Clear and centered face preferred</li>
                                                </ul>
                                            </PopoverContent>
                                        </Popover>
                                    </CardHeader>

                                    <CardContent className="flex flex-col items-center gap-6">
                                        <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-md">
                                            <AvatarImage
                                                className="object-cover"
                                                src={
                                                    meUser?.profilePicture?.startsWith("http")
                                                        ? meUser?.profilePicture
                                                        : meUser?.profilePicture
                                                            ? `http://localhost:8081/${meUser?.profilePicture}`
                                                            : undefined
                                                }
                                            />
                                            <AvatarFallback
                                                className="text-xl font-semibold bg-primary/10 text-primary">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex gap-3">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="bg-primary hover:bg-primary/90"
                                            >
                                                <Upload className="h-4 w-4 mr-2"/>
                                                Upload Picture
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-destructive/20 text-destructive hover:bg-destructive/10"
                                                onClick={handleRemovePicture}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2"/>
                                                Remove Picture
                                            </Button>
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t border-border/30 w-full justify-end">
                                            <Button variant="outline" onClick={handleCancelPicture}>
                                                Cancel
                                            </Button>
                                            <Button className="bg-teal-600 hover:bg-teal-800"
                                                    onClick={handleSavePicture}>
                                                Save
                                            </Button>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                                               onChange={handleFileChange}/>
                                    </CardContent>
                                </Card>
                                <Card className="enhanced-card border-green-100 bg-card/50 backdrop-blur-sm">
                                    <CardHeader className="flex flex-row items-center justify-between pb-6">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Settings className="w-5 h-5 text-primary"/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Account Details</CardTitle>
                                                <CardDescription>Your personal information and contact
                                                    details</CardDescription>
                                            </div>
                                        </div>
                                        {!isEditing && (
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <Edit className="h-4 w-4 mr-2"/>
                                                Edit Profile
                                            </Button>
                                        )}
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-foreground">Username</Label>
                                                <Input
                                                    value={meUser?.userEssentials?.username || ""}
                                                    disabled
                                                    className="bg-muted/50 border-border/50"
                                                />
                                                <p className="text-xs text-muted-foreground">Username cannot be
                                                    changed</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-foreground">Email</Label>
                                                <Input
                                                    value={meUser?.userEssentials?.email || ""}
                                                    disabled
                                                    className="bg-muted/50 border-border/50"
                                                />
                                                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-foreground">First
                                                    Name</Label>
                                                <Input
                                                    value={userDetailsForm.firstName || ""}
                                                    onChange={(e) =>
                                                        setUserDetailsForm((prev) => ({
                                                            ...prev,
                                                            firstName: e.target.value,
                                                        }))
                                                    }
                                                    disabled={!isEditing}
                                                    className={!isEditing ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-foreground">Last Name</Label>
                                                <Input
                                                    value={userDetailsForm.lastName || ""}
                                                    onChange={(e) =>
                                                        setUserDetailsForm((prev) => ({
                                                            ...prev,
                                                            lastName: e.target.value,
                                                        }))
                                                    }
                                                    disabled={!isEditing}
                                                    className={!isEditing ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-foreground">Phone
                                                    Number</Label>
                                                <Input
                                                    value={userDetailsForm.phoneNumber || ""}
                                                    onChange={(e) =>
                                                        setUserDetailsForm((prev) => ({
                                                            ...prev,
                                                            phoneNumber: e.target.value,
                                                        }))
                                                    }
                                                    disabled={!isEditing}
                                                    className={!isEditing ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-foreground">Country</Label>
                                                <Input
                                                    value={userDetailsForm.country || ""}
                                                    onChange={(e) =>
                                                        setUserDetailsForm((prev) => ({
                                                            ...prev,
                                                            country: e.target.value,
                                                        }))
                                                    }
                                                    disabled={!isEditing}
                                                    className={!isEditing ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-foreground">City</Label>
                                                <Input
                                                    value={userDetailsForm.city || ""}
                                                    onChange={(e) => setUserDetailsForm((prev) => ({
                                                        ...prev,
                                                        city: e.target.value
                                                    }))}
                                                    disabled={!isEditing}
                                                    className={!isEditing ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-foreground">Address</Label>
                                                <Input
                                                    value={userDetailsForm.address || ""}
                                                    onChange={(e) =>
                                                        setUserDetailsForm((prev) => ({
                                                            ...prev,
                                                            address: e.target.value,
                                                        }))
                                                    }
                                                    disabled={!isEditing}
                                                    className={!isEditing ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-foreground">Bio</Label>
                                            <Textarea
                                                value={userDetailsForm.bio || ""}
                                                onChange={(e) => setUserDetailsForm((prev) => ({
                                                    ...prev,
                                                    bio: e.target.value
                                                }))}
                                                disabled={!isEditing}
                                                rows={4}
                                                className={!isEditing ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"}
                                                placeholder="Tell us a bit about yourself..."
                                            />
                                        </div>
                                    </CardContent>

                                    {isEditing && (
                                        <CardFooter className="flex justify-end gap-3 pt-6 border-t border-border/50">
                                            <Button variant="outline" onClick={() => setIsEditing(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button onClick={handleSaveAccount}
                                                    className="bg-teal-600 hover:bg-teal-800">
                                                Save Changes
                                            </Button>
                                        </CardFooter>
                                    )}
                                </Card>
                            </TabsContent>

                            <TabsContent value="wellness" className="space-y-6">
                                <Card
                                    className="enhanced-card border-green-100 bg-card/50 backdrop-blur-sm">
                                    <CardHeader className="flex flex-row items-center justify-between pb-6">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Heart className="w-5 h-5 text-primary"/>
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Wellness Profile</CardTitle>
                                                <CardDescription>Your health stats, goals, and
                                                    preferences</CardDescription>
                                            </div>
                                        </div>
                                        {!isEditingWellness && (
                                            <Button variant="outline" onClick={() => setIsEditingWellness(true)}
                                            >
                                                <Edit className="h-4 w-4 mr-2"/>
                                                Edit Wellness Profile
                                            </Button>
                                        )}
                                    </CardHeader>

                                    <CardContent className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                                                <User className="w-4 h-4 text-primary"/>
                                                <h3 className="font-semibold text-foreground">Personal Information</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label
                                                        className="text-sm font-medium text-foreground">Gender</Label>
                                                    <select
                                                        className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        value={wellnessForm.gender ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                gender: (e.target.value || undefined) as GenderType,
                                                            }))
                                                        }
                                                        disabled={!isEditingWellness}
                                                    >
                                                        <option value="">Select gender</option>
                                                        <option value="MALE">Male</option>
                                                        <option value="FEMALE">Female</option>
                                                        <option value="OTHER">Other</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Birth
                                                        Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={wellnessForm.birthDate ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                birthDate: e.target.value || undefined,
                                                            }))
                                                        }
                                                        disabled={!isEditingWellness}
                                                        className={
                                                            !isEditingWellness ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Activity
                                                        Level</Label>
                                                    <select
                                                        className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        value={wellnessForm.activityLevel ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                activityLevel: (e.target.value || undefined) as ActivityLevelType,
                                                            }))
                                                        }
                                                        disabled={!isEditingWellness}
                                                    >
                                                        <option value="">Select activity level</option>
                                                        <option value="SEDENTARY">Sedentary</option>
                                                        <option value="LIGHT">Light</option>
                                                        <option value="MODERATE">Moderate</option>
                                                        <option value="ACTIVE">Active</option>
                                                        <option value="VERY_ACTIVE">Very Active</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                                                <Activity className="w-4 h-4 text-primary"/>
                                                <h3 className="font-semibold text-foreground">Physical Stats &
                                                    Goals</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Height
                                                        (cm)</Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={wellnessForm.heightCm ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                heightCm: e.target.value === "" ? null : Number(e.target.value),
                                                            }))
                                                        }
                                                        disabled={!isEditingWellness}
                                                        className={
                                                            !isEditingWellness ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Weight
                                                        (kg)</Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={wellnessForm.weightKg ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                weightKg: e.target.value === "" ? null : Number(e.target.value),
                                                            }))
                                                        }
                                                        disabled={!isEditingWellness}
                                                        className={
                                                            !isEditingWellness ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Primary
                                                        Goal</Label>
                                                    <select
                                                        className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        value={wellnessForm.primaryGoal ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                primaryGoal: (e.target.value || undefined) as GoalType,
                                                            }))
                                                        }
                                                        disabled={!isEditingWellness}
                                                    >
                                                        <option value="">Select goal</option>
                                                        <option value="LOSE_FAT">Fat Loss</option>
                                                        <option value="MAINTAIN">Maintenance</option>
                                                        <option value="GAIN_MUSCLE">Muscle Gain</option>
                                                        <option value="PERFORMANCE">Performance</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                                                <Dumbbell className="w-4 h-4 text-primary"/>
                                                <h3 className="font-semibold text-foreground">Training & Equipment</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Equipment
                                                        Access</Label>
                                                    <select
                                                        className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        value={wellnessForm.equipmentAccess ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                equipmentAccess: (e.target.value || undefined) as EquipmentAccessType,
                                                            }))
                                                        }
                                                        disabled={!isEditingWellness}
                                                    >
                                                        <option value="">Select equipment access</option>
                                                        <option value="NONE">None</option>
                                                        <option value="HOME_MINIMAL">Home (Minimal)</option>
                                                        <option value="HOME_FULL">Home (Full)</option>
                                                        <option value="GYM">Gym</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                                                <Apple className="w-4 h-4 text-primary"/>
                                                <h3 className="font-semibold text-foreground">Nutrition & Diet</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Meals per
                                                        Day</Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={wellnessForm.mealsPerDay ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                mealsPerDay: e.target.value === "" ? null : Number(e.target.value),
                                                            }))
                                                        }
                                                        disabled={!isEditingWellness}
                                                        className={
                                                            !isEditingWellness ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Disliked
                                                        Foods</Label>
                                                    <Textarea
                                                        value={wellnessForm.dislikedFoods ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                dislikedFoods: e.target.value,
                                                            }))
                                                        }
                                                        rows={3}
                                                        disabled={!isEditingWellness}
                                                        className={
                                                            !isEditingWellness ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"
                                                        }
                                                        placeholder="List foods you dislike..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                                                <Target className="w-4 h-4 text-primary"/>
                                                <h3 className="font-semibold text-foreground">Daily Targets</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Sleep Target
                                                        (hours)</Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={wellnessForm.sleepTargetHours ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                sleepTargetHours: e.target.value === "" ? null : Number(e.target.value),
                                                            }))
                                                        }
                                                        disabled={!isEditingWellness}
                                                        className={
                                                            !isEditingWellness ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Hydration
                                                        Target (ml)</Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={wellnessForm.hydrationTargetMl ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                hydrationTargetMl: e.target.value === "" ? null : Number(e.target.value),
                                                            }))
                                                        }
                                                        disabled={!isEditingWellness}
                                                        className={
                                                            !isEditingWellness ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-foreground">Steps
                                                        Target</Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={wellnessForm.stepsTarget ?? ""}
                                                        onChange={(e) =>
                                                            setWellnessForm((s) => ({
                                                                ...s,
                                                                stepsTarget: e.target.value === "" ? null : Number(e.target.value),
                                                            }))
                                                        }
                                                        disabled={!isEditingWellness}
                                                        className={
                                                            !isEditingWellness ? "bg-muted/30" : "focus:ring-primary/20 focus:border-primary"
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>

                                    {isEditingWellness && (
                                        <CardFooter className="flex justify-end gap-3 pt-6 border-t border-border/50">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsEditingWellness(false)
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSaveWellness}
                                                className="bg-teal-600 hover:bg-teal-800"
                                            >
                                                Save Changes
                                            </Button>
                                        </CardFooter>
                                    )}
                                </Card>
                            </TabsContent>
                        </Tabs>
                        <UserPostsTabs username={username}/>
                    </div>
                </div>
            </div>
        </div>
    )
}

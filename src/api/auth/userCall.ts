import {apiClient} from "@/api/client";
import {UserDetails} from "@/types/profile/UserType";
import {Page} from "@/types/page/page";
import {WellnessDetails} from "@/types/profile/WellnessType";

export const getMe = async (): Promise<UserDetails> => {
    return apiClient<UserDetails>("profile/me", "GET");
};

export const getPublicMe = async (username: string): Promise<UserDetails> => {
    return apiClient<UserDetails>(`profile/${username}`, "GET")
}

export const wellnessMeProfilePublic = async (username: string): Promise<WellnessDetails> => {
    return apiClient<WellnessDetails>(`wellness/${username}`, 'GET')
}

export const searchProfiles = async (keyword: string, page: number = 0, size: number = 20):
    Promise<Page<UserDetails>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('keyword', keyword);
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());
    return apiClient<Page<UserDetails>>(`profile?${queryParams.toString()}`, 'GET');
};


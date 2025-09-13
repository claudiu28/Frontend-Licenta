import {useQuery} from "@tanstack/react-query";
import {UserDetails} from "@/types/profile/UserType";
import {ErrorResponse} from "@/types/ErrorType"
import {WellnessDetails} from "@/types/profile/WellnessType";
import {getPublicMe, wellnessMeProfilePublic} from "@/api/auth/userCall";


export const usePublicProfile = (username: string) => {
    return useQuery<UserDetails, ErrorResponse>({
        queryKey: ['profile', username],
        queryFn: () => getPublicMe(username),
        enabled: !!username,
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    });
};

export const useWellnessPublicProfile = (username: string) => {
    return useQuery<WellnessDetails, ErrorResponse>({
        queryKey: ['wellness', username],
        queryFn: () => wellnessMeProfilePublic(username),
        enabled: !!username,
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    });
};
import {useAuth} from "@/hooks/useAuth";

export const useCurrentUser = () => {
    const {me, isLoadingMe, refetchMe} = useAuth();
    return {me, isLoadingMe, refetchMe};
};
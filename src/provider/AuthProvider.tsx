import {TOKEN_NAME} from "@/const/const";
import {AuthContext} from "@/context/AuthContext";
import {deleteCookie, getCookie, setCookie} from "cookies-next";
import React, {useCallback, useEffect, useState} from "react";
import {toast} from "sonner";
import {LogoutRequest} from "@/types/auth/LogoutType";
import {RegisterRequest, RegisterResponse} from "@/types/auth/RegisterType";
import {LoginRequest, LoginResponse} from "@/types/auth/LoginType";
import {ForgotPasswordRequest, ForgotPasswordResponse} from "@/types/auth/ForgotPasswordType";
import {ResetPasswordRequest, ResetPasswordResponse} from "@/types/auth/ResetPasswordType";
import {RefreshTypeRequest, RefreshTypeResponse} from "@/types/auth/RefreshType";
import {VerifyEmailRequest, VerifyEmailResponse} from "@/types/auth/VerifyEmail";
import {SendVerificationRequest, SendVerificationResponse} from "@/types/auth/SendVerificationRequest";
import {
    useForgotPassword,
    useLogin,
    useLogout,
    useRefresh,
    useRegister, useResetPassword,
    useSendVerification,
    useVerifyEmail
} from "@/hooks/useAuth";
import {getSubject, secondsUntilExpire} from "@/help/jwtParsing";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {getMe} from "@/api/auth/userCall";


export const AuthProvider = ({children}: { children: React.ReactNode }) => {

    const registerMutation = useRegister();
    const sendVerificationMutation = useSendVerification();
    const verifyEmailMutation = useVerifyEmail();

    const loginMutation = useLogin();
    const logoutMutation = useLogout();
    const refreshTokenMutation = useRefresh();

    const forgotPasswordMutation = useForgotPassword();
    const resetPasswordMutation = useResetPassword();

    const isRefreshingRef = React.useRef<boolean>(false);
    const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [usernameCache, setUsernameCache] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const REFRESH_BUFFER_SECONDS = 120;
    const MIN_REFRESH_INTERVAL = 30;
    const CRITICAL_TIME_THRESHOLD = 90

    const {data: me, isLoading: isLoadingMe, error: meError, refetch: refetchMe} = useQuery({
        queryKey: ["me"],
        queryFn: getMe,
        enabled: isLoggedIn && isInitialized,
        retry: 2,
        staleTime: 300000,
        refetchOnWindowFocus: true,
    });

    const validateToken = useCallback((token: string): boolean => {
        try {
            const timeLeft = secondsUntilExpire(token, 0);
            return timeLeft > 0;
        } catch (error) {
            return false;
        }
    }, []);

    const clearRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);


    const setAccessCookie = useCallback((accessToken: string) => {
        const maxAge = secondsUntilExpire(accessToken, 0);
        setCookie(TOKEN_NAME, accessToken, {
            path: "/",
            sameSite: "lax",
            maxAge: maxAge,
        });
        setIsLoggedIn(true);
    }, []);

    const schedulerRefreshToken = useCallback((accessToken: string) => {
        clearRefreshTimer();
        const timeAvailable = secondsUntilExpire(accessToken, 0);
        const timeUntilRefresh = timeAvailable - REFRESH_BUFFER_SECONDS;
        const scheduleIn = Math.max(timeUntilRefresh, MIN_REFRESH_INTERVAL);
        const delaySchedule = scheduleIn * 1000;
        if (scheduleIn <= MIN_REFRESH_INTERVAL && timeAvailable < REFRESH_BUFFER_SECONDS) {
            refresh({username: getSubject(accessToken)}).catch(() => {
                deleteCookie(TOKEN_NAME);
                setIsLoggedIn(false);
                clearRefreshTimer();
            });
            return;
        }
        refreshTimerRef.current = setTimeout(() => {
            refresh({username: getSubject(accessToken)}).catch(() => {
                deleteCookie(TOKEN_NAME);
                setIsLoggedIn(false);
                clearRefreshTimer();
            });
        }, delaySchedule);
    }, [clearRefreshTimer, REFRESH_BUFFER_SECONDS, MIN_REFRESH_INTERVAL]);

    const refresh = useCallback(
        async (data: RefreshTypeRequest): Promise<RefreshTypeResponse> => {
            if (isRefreshingRef.current) {
                throw new Error('Refresh already in progress');
            }
            try {
                isRefreshingRef.current = true;
                const response = await refreshTokenMutation.mutateAsync(data);
                const accessToken = response.access_token;
                if (accessToken) {
                    setAccessCookie(accessToken);
                    schedulerRefreshToken(accessToken);
                    await refetchMe();
                }
                return response;
            } catch (err: any) {
                setIsLoggedIn(false);
                deleteCookie(TOKEN_NAME);
                clearRefreshTimer();
                throw err;
            } finally {
                isRefreshingRef.current = false;
            }
        }, [refreshTokenMutation, setAccessCookie, schedulerRefreshToken]);

    const checkAuthState = useCallback(() => {
        const accessToken = getCookie(TOKEN_NAME) as string | undefined;

        if (!accessToken) {
            setIsLoggedIn(false);
            if (!isInitialized) setIsInitialized(true);
            return;
        }

        if (validateToken(accessToken)) {
            setIsLoggedIn(true);
        } else {
            const username = usernameCache || getSubject(accessToken);
            refresh({username})
                .then(() => setIsLoggedIn(true))
                .catch(() => {
                    setIsLoggedIn(false);
                    deleteCookie(TOKEN_NAME);
                    clearRefreshTimer();
                });
        }

        if (!isInitialized) {
            setIsInitialized(true);
        }
    }, [validateToken, clearRefreshTimer, isInitialized, refresh]);

    useEffect(() => {
        checkAuthState();
    }, [checkAuthState]);

    useEffect(() => {
        if (meError && 'status' in meError && meError.status === 401) {
            console.warn('Authentication error detected, logging out...');
            if (me?.userEssentials?.username) {
                logout({username: me.userEssentials.username}).catch(() => {
                    deleteCookie(TOKEN_NAME);
                    setIsLoggedIn(false);
                    clearRefreshTimer();
                });
            } else {
                deleteCookie(TOKEN_NAME);
                setIsLoggedIn(false);
                clearRefreshTimer();
            }
        }
    }, [meError, me?.userEssentials?.username]);


    useEffect(() => {
        const accessToken = getCookie(TOKEN_NAME) as string | undefined;
        if (accessToken && isLoggedIn) {
            schedulerRefreshToken(accessToken);
        }
        return () => clearRefreshTimer();
    }, [schedulerRefreshToken, clearRefreshTimer]);


    useEffect(() => {
            const onFocus = () => {
                const accessToken = getCookie(TOKEN_NAME) as string | undefined;
                if (!accessToken) {
                    setIsLoggedIn(false);
                    deleteCookie(TOKEN_NAME);
                    clearRefreshTimer();
                    return;
                }
                const username = usernameCache || getSubject(accessToken);
                if (!validateToken(accessToken)) {
                    refresh({username: username}).then(() => {
                        setIsLoggedIn(true);
                    }).catch(() => {
                        setIsLoggedIn(false);
                        deleteCookie(TOKEN_NAME);
                        clearRefreshTimer();
                    });
                    return;
                }
                const leftSeconds = secondsUntilExpire(accessToken, 0);
                if (leftSeconds < CRITICAL_TIME_THRESHOLD && !isRefreshingRef.current) {
                    const username = usernameCache || getSubject(accessToken);
                    refresh({username}).catch(() => {
                        setIsLoggedIn(false);
                        deleteCookie(TOKEN_NAME);
                        clearRefreshTimer();
                    })
                }
            }
            if (typeof window !== "undefined") {
                window.addEventListener("focus", onFocus);
                return () => window.removeEventListener("focus", onFocus);
            }
        }, [refresh, clearRefreshTimer, CRITICAL_TIME_THRESHOLD]
    );

    useEffect(() => {
        const stored = localStorage.getItem("username_cache");
        if (stored) setUsernameCache(stored);
    }, []);

    const login = useCallback(
        async (data: LoginRequest): Promise<LoginResponse> => {
            try {
                const response = await loginMutation.mutateAsync(data);
                toast.success("Login with success");
                const accessToken = response.access_token;
                if (accessToken) {
                    setAccessCookie(accessToken);
                    schedulerRefreshToken(accessToken);
                    const username = getSubject(accessToken);
                    setUsernameCache(username);
                    localStorage.setItem("username_cache", username);
                    await refetchMe();
                }
                return response;
            } catch (err: any) {
                setIsLoggedIn(false);
                throw err;
            }
        }, [loginMutation, setAccessCookie, schedulerRefreshToken]);

    const logout = useCallback(
        async (data: LogoutRequest): Promise<void> => {
            try {
                const response = await logoutMutation.mutateAsync(data);
                toast.success("Logout with success");
                deleteCookie(TOKEN_NAME);
                clearRefreshTimer();
                localStorage.removeItem("username_cache");
                setUsernameCache(null);
                setIsLoggedIn(false);
                queryClient.removeQueries({ queryKey: ["me"] });
                return response;
            } catch (err: any) {
                setIsLoggedIn(false);
                deleteCookie(TOKEN_NAME);
                setIsLoggedIn(false);
                clearRefreshTimer();
                localStorage.removeItem("username_cache");
                setUsernameCache(null);
                queryClient.removeQueries({ queryKey: ["me"] });
                throw err;
            }
        }, [logoutMutation, clearRefreshTimer]
    );

    const register = useCallback(
        async (data: RegisterRequest): Promise<RegisterResponse> => {
            try {
                const response = await registerMutation.mutateAsync(data);
                toast.success("User registered successfully!");
                return response;
            } catch (err: any) {
                throw err;
            }
        },
        [registerMutation]
    );

    const sendVerification = useCallback(
        async (data: SendVerificationRequest): Promise<SendVerificationResponse> => {
            try {
                const response = await sendVerificationMutation.mutateAsync(data);
                toast.success("User send verification successfully!");
                return response;
            } catch (err: any) {
                throw err;
            }
        }, [sendVerificationMutation]
    );


    const verifyEmail = useCallback(
        async (data: VerifyEmailRequest): Promise<VerifyEmailResponse> => {
            try {
                const response = await verifyEmailMutation.mutateAsync(data);
                toast.success("Email verified with success!");
                return response;
            } catch (err: any) {
                throw err;
            }
        }, [verifyEmailMutation]);


    const forgotPassword = useCallback(
        async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
            try {
                const response = await forgotPasswordMutation.mutateAsync(data);
                toast.success("Link to reset send with success!");
                return response;
            } catch (err: any) {
                throw err;
            }
        }, [forgotPasswordMutation]);

    const resetPassword = useCallback(
        async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
            try {
                const response = await resetPasswordMutation.mutateAsync(data);
                toast.success("Reset your password with success!");
                return response;
            } catch (err: any) {
                throw err;
            }
        }, [resetPasswordMutation]);


    return (
        <AuthContext.Provider
            value={{
                register,
                login,
                logout,
                refresh,
                verifyEmail,
                forgotPassword,
                resetPassword,
                sendVerification,
                isLoggedIn,
                isInitialized,
                me,
                isLoadingMe,
                refetchMe,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

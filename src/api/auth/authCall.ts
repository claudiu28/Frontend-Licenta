import {RegisterRequest, RegisterResponse} from "@/types/auth/RegisterType";
import {apiClient} from "@/api/client";
import {SendVerificationRequest, SendVerificationResponse} from "@/types/auth/SendVerificationRequest";
import {VerifyEmailRequest, VerifyEmailResponse} from "@/types/auth/VerifyEmail";
import {LoginRequest, LoginResponse} from "@/types/auth/LoginType";
import {RefreshTypeRequest, RefreshTypeResponse} from "@/types/auth/RefreshType";
import {LogoutRequest} from "@/types/auth/LogoutType";
import {ForgotPasswordRequest, ForgotPasswordResponse} from "@/types/auth/ForgotPasswordType";
import {ResetPasswordRequest, ResetPasswordResponse} from "@/types/auth/ResetPasswordType";


export const registerCall = async (data: RegisterRequest) => {
    console.log("[Auth]: Register user")
    return apiClient<RegisterResponse>("auth/register", "POST", data);
}

export const sendVerification = async ({email}: SendVerificationRequest) => {
    console.log("[Auth] Verification email to:", email);
    if (!email) throw new Error("Email is required");
    const queryParam = new URLSearchParams({email}).toString();
    return apiClient<SendVerificationResponse>(`auth/send-verification?${queryParam}`, "POST");
}

export const verifyEmail = async ({email, token}: VerifyEmailRequest) => {
    console.log("[Auth]: Verification email to:", email);
    if (!email) throw new Error("email is required");
    if (!token) throw new Error("token is required");
    const queryParams = new URLSearchParams({email, token}).toString();

    return apiClient<VerifyEmailResponse>(`auth/verify-email?${queryParams}`, "GET");
}

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
    console.log("[Auth]: Login user")
    return apiClient<LoginResponse>("auth/login", "POST", data, {withCredentials: true});
}

export const refreshTokenUser = async (data: RefreshTypeRequest) => {
    console.log("[Auth]: Refresh user")
    return apiClient<RefreshTypeResponse>("auth/refresh", "POST", data, {withCredentials: true, skipToken: true});
}

export const logoutUser = async ({username}: LogoutRequest) => {
    console.log("[Auth]: Logout user")
    return apiClient<void>("auth/logout", "POST", {username}, {withCredentials: true});
}

export const forgotPasswordUser = async ({email}: ForgotPasswordRequest) => {
    if (!email) throw new Error("email is required");
    const queryParam = new URLSearchParams({email}).toString();
    return apiClient<ForgotPasswordResponse>(`auth/forgot-password?${queryParam}`, "POST");
}

export const resetPasswordUser = async ({email, token, newPassword}: ResetPasswordRequest) => {
    if (!email) throw new Error("email is required");
    if (!token) throw new Error("token is required");
    const queryParam = new URLSearchParams({email, token}).toString();
    return apiClient<ResetPasswordResponse>(`auth/reset-password?${queryParam}`, "POST", {newPassword});
}
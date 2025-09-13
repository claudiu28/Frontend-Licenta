import {RegisterRequest, RegisterResponse} from "@/types/auth/RegisterType";
import {LoginRequest, LoginResponse} from "@/types/auth/LoginType";
import {LogoutRequest} from "@/types/auth/LogoutType";
import {ForgotPasswordRequest, ForgotPasswordResponse} from "@/types/auth/ForgotPasswordType";
import {ResetPasswordRequest, ResetPasswordResponse} from "@/types/auth/ResetPasswordType";
import {RefreshTypeRequest, RefreshTypeResponse} from "@/types/auth/RefreshType";
import {VerifyEmailRequest, VerifyEmailResponse} from "@/types/auth/VerifyEmail";
import {SendVerificationRequest, SendVerificationResponse} from "@/types/auth/SendVerificationRequest";
import {UserDetails} from "@/types/profile/UserType";

export type AuthContextType = {
    register: (data: RegisterRequest) => Promise<RegisterResponse>;
    login: (data: LoginRequest) => Promise<LoginResponse>;
    logout: (data: LogoutRequest) => Promise<void>;
    forgotPassword: (data: ForgotPasswordRequest) => Promise<ForgotPasswordResponse>;
    resetPassword: (data: ResetPasswordRequest) => Promise<ResetPasswordResponse>;
    refresh: (data: RefreshTypeRequest) => Promise<RefreshTypeResponse>;
    verifyEmail: (data: VerifyEmailRequest) => Promise<VerifyEmailResponse>;
    sendVerification: (data: SendVerificationRequest) => Promise<SendVerificationResponse>;
    isLoggedIn: boolean,
    isInitialized: boolean,
    me?: UserDetails;
    isLoadingMe: boolean;
    refetchMe: () => void;
}
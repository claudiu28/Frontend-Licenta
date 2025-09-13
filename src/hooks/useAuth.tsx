import {useContext} from "react";
import {AuthContext} from "@/context/AuthContext";
import {
    forgotPasswordUser,
    loginUser,
    logoutUser,
    refreshTokenUser,
    registerCall, resetPasswordUser,
    sendVerification,
    verifyEmail
} from "@/api/auth/authCall";
import {useMutation} from "@tanstack/react-query";
import {RegisterRequest, RegisterResponse} from "@/types/auth/RegisterType";
import {ErrorResponse} from "@/types/ErrorType";
import {SendVerificationRequest, SendVerificationResponse} from "@/types/auth/SendVerificationRequest";
import {VerifyEmailRequest, VerifyEmailResponse} from "@/types/auth/VerifyEmail";
import {LoginRequest, LoginResponse} from "@/types/auth/LoginType";
import {RefreshTypeRequest, RefreshTypeResponse} from "@/types/auth/RefreshType";
import {LogoutRequest} from "@/types/auth/LogoutType";
import {ForgotPasswordRequest, ForgotPasswordResponse} from "@/types/auth/ForgotPasswordType";
import {ResetPasswordRequest, ResetPasswordResponse} from "@/types/auth/ResetPasswordType";

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const useRegister = () => {
    return useMutation<RegisterResponse, ErrorResponse, RegisterRequest>({
        mutationFn: registerCall,
    });
};


export const useSendVerification = () => {
    return useMutation<SendVerificationResponse, ErrorResponse, SendVerificationRequest>({
        mutationFn: sendVerification
    });
};

export const useVerifyEmail = () => {
    return useMutation<VerifyEmailResponse, ErrorResponse, VerifyEmailRequest>({
        mutationFn: verifyEmail,
    });
};

export const useLogin = () => {
    return useMutation<LoginResponse, ErrorResponse, LoginRequest>({
        mutationFn: loginUser,
    });
};

export const useRefresh = () => {
    return useMutation<RefreshTypeResponse, ErrorResponse, RefreshTypeRequest>({
        mutationFn: refreshTokenUser
    });
};

export const useLogout = () => {
    return useMutation<void, ErrorResponse, LogoutRequest>({
        mutationFn: logoutUser,
    });
};

export const useForgotPassword = () => {
    return useMutation<ForgotPasswordResponse, ErrorResponse, ForgotPasswordRequest>({
        mutationFn: forgotPasswordUser,
    });
};

export const useResetPassword = () => {
    return useMutation<ResetPasswordResponse, ErrorResponse, ResetPasswordRequest>({
        mutationFn: resetPasswordUser,
    });
};


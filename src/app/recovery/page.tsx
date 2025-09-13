"use client";

import {
    Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {
    Mail, RefreshCw, CheckCircle2, XCircle, Eye, EyeOff, Lock, AtSign, ArrowRight, KeyRound
} from "lucide-react";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import {useAuth} from "@/hooks/useAuth";

import * as z from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormField, FormItem, FormLabel, FormControl, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {useCountdown} from "@/hooks/useCountdown";

type View = "forgot" | "instructions" | "form" | "success" | "error";

export default function RecoveryPage() {
    const router = useRouter();
    const params = useSearchParams();
    const {forgotPassword, resetPassword} = useAuth();

    const [email, setEmail] = useState("");
    const [view, setView] = useState<View>("forgot");
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const {seconds, isReady, formatTime, start} = useCountdown(120);

    const forgotSchema = z.object({
        email: z
            .string()
            .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
                message: "Please enter a valid email address.",
            }),
    });
    const forgotForm = useForm<z.infer<typeof forgotSchema>>({
        resolver: zodResolver(forgotSchema),
        defaultValues: {email: ""},
    });

    const resetSchema = z.object({
        password: z.string()
            .min(8, {message: "Password must be at least 8 characters long."})
            .regex(/[A-Z]/, {message: "Password must include at least one uppercase letter."})
            .regex(/[a-z]/, {message: "Password must include at least one lowercase letter."})
            .regex(/[0-9]/, {message: "Password must include at least one number."})
            .regex(/[^A-Za-z0-9]/, {message: "Password must include at least one special character."}),
    });
    const resetForm = useForm<z.infer<typeof resetSchema>>({
        resolver: zodResolver(resetSchema),
        mode: "onChange",
        defaultValues: {password: ""},
    });

    const password = resetForm.watch("password");
    const isValidPassword =
        password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) &&
        /\d/.test(password) && /[^a-zA-Z0-9]/.test(password);

    const key = params.toString();
    const lastKeyRef = useRef<string>("");

    useEffect(() => {
        if (key === lastKeyRef.current) return;
        lastKeyRef.current = key;

        (async () => {
            setGlobalError(null);

            const qEmail = params.get("email") ?? "";
            const qToken = params.get("token");

            if (!qEmail && !qToken) {
                setView("forgot");
                return;
            }

            if (qEmail && !qToken) {
                setEmail(qEmail);
                try {
                    await forgotPassword({email: qEmail});
                    setView("instructions");
                    start();
                } catch (e: any) {
                    setView("error");
                    setGlobalError(e?.message || "Failed to send reset email.");
                }
                return;
            }

            if (qEmail && qToken) {
                setEmail(qEmail);
                setView("form");
                return;
            }

            setView("error");
            setGlobalError("Invalid recovery URL.");
        })();
    }, [key, params, forgotPassword, start]);

    const handleForgotSubmit = async (data: z.infer<typeof forgotSchema>) => {
        setGlobalError(null);
        router.push(`/recovery?email=${encodeURIComponent(data.email)}`);
    };

    const handleResend = async () => {
        if (!email || !isReady) return;
        try {
            await forgotPassword({email});
            start();
        } catch (e: any) {
            setGlobalError(e?.message || "Failed to resend email.");
        }
    };

    const handleResetSubmit = async (data: z.infer<typeof resetSchema>) => {
        const token = params.get("token");
        if (!token) {
            setGlobalError("Invalid or missing reset token.");
            return;
        }
        try {
            await resetPassword({email, token, newPassword: data.password});
            setView("success");
            setTimeout(() => router.push("/login"), 3000);
        } catch (e: any) {
            setGlobalError(e?.message || "Something went wrong while resetting your password.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen font-body text-slate-900 dark:text-white py-10">
            <Card className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
                {/* ERROR */}
                {view === "error" && (
                    <>
                        <CardHeader className="space-y-1 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                                    <XCircle className="h-10 w-10 text-red-600 dark:text-red-300"/>
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold">Something went wrong</CardTitle>
                            <CardDescription>{globalError ?? "The recovery link is invalid or has expired."}</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button variant="outline" onClick={() => router.push("/recovery")}>Back</Button>
                            <Button onClick={() => router.push("/")}>Home</Button>
                        </CardFooter>
                    </>
                )}

                {view === "success" && (
                    <>
                        <CardHeader className="space-y-1 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-300"/>
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold">Password updated</CardTitle>
                            <CardDescription>You’ll be redirected shortly.</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center">
                            <Button variant="link" onClick={() => router.push("/")} className="hover:text-emerald-700">
                                Go to home
                            </Button>
                        </CardFooter>
                    </>
                )}

                {view === "forgot" && (
                    <>
                        <CardHeader className="space-y-1 text-center">
                            <div className="flex justify-center mb-4">
                                <div
                                    className="p-3 rounded-full bg-background border-2 border-emerald-600 dark:border-emerald-400">
                                    <KeyRound className="h-10 w-10 text-emerald-700 dark:text-emerald-300"/>
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
                            <CardDescription>Enter your email and we’ll send you a reset link.</CardDescription>
                        </CardHeader>

                        <CardContent>
                            {globalError && <Alert variant="destructive"
                                                   className="mb-4"><AlertDescription>{globalError}</AlertDescription></Alert>}
                            <Form {...forgotForm}>
                                <form onSubmit={forgotForm.handleSubmit(handleForgotSubmit)} className="space-y-4">
                                    <FormField
                                        control={forgotForm.control}
                                        name="email"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Email address</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center relative">
                                                        <AtSign
                                                            className="absolute left-3 h-4 w-4 text-muted-foreground"/>
                                                        <Input placeholder="you@example.com" {...field} className="pl-9"
                                                               type="email"/>
                                                    </div>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                        Send reset link <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </>
                )}

                {view === "instructions" && (
                    <>
                        <CardHeader className="space-y-1 text-center">
                            <div className="flex justify-center mb-4">
                                <div
                                    className="p-3 rounded-full bg-background border-2 border-emerald-600 dark:border-emerald-400">
                                    <Mail className="h-10 w-10 text-emerald-700 dark:text-emerald-300"/>
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                            <CardDescription>
                                We’ve sent a password reset link to{" "}
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">{email}</span>.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {globalError &&
                                <Alert variant="destructive"><AlertDescription>{globalError}</AlertDescription></Alert>}
                            <div className="bg-muted p-4 rounded-lg text-sm">
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Open your inbox and find our message.</li>
                                    <li>Click the reset link inside.</li>
                                    <li>This page will load the reset form.</li>
                                </ol>
                            </div>
                            <div className="text-center text-sm">
                                {isReady ? (
                                    <Button variant="link" onClick={handleResend}
                                            className="p-0 h-auto text-emerald-600">
                                        <RefreshCw className="h-3 w-3 mr-1"/> Resend email
                                    </Button>
                                ) : (
                                    <p className="text-amber-600">You can resend in {formatTime(seconds)}.</p>
                                )}
                            </div>
                        </CardContent>
                    </>
                )}

                {view === "form" && (
                    <>
                        <CardHeader className="space-y-1 text-center">
                            <div className="flex justify-center mb-4">
                                <div
                                    className="p-3 rounded-full bg-background border-2 border-emerald-600 dark:border-emerald-400">
                                    <Lock className="h-10 w-10 text-emerald-700 dark:text-emerald-300"/>
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
                        </CardHeader>

                        <CardContent>
                            {globalError && <Alert variant="destructive"
                                                   className="mb-4"><AlertDescription>{globalError}</AlertDescription></Alert>}
                            <Form {...resetForm}>
                                <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4">
                                    <FormField
                                        control={resetForm.control}
                                        name="password"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>New password</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="Enter a new password"
                                                            className={`transition-all duration-150 ring-1 ${
                                                                password.length > 0
                                                                    ? isValidPassword
                                                                        ? "ring-green-500"
                                                                        : "ring-red-500"
                                                                    : "ring-gray-300"
                                                            }`}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-0 top-0 h-full px-3"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? (
                                                                <Eye className="h-4 w-4 text-muted-foreground"/>
                                                            ) : (
                                                                <EyeOff className="h-4 w-4 text-muted-foreground"/>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                        Update password
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}

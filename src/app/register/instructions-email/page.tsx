"use client";

import {
    Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useCountdown } from "@/hooks/useCountdown";

type View = "instructions" | "verifying" | "success" | "error";

export default function EmailVerificationPage() {
    const router = useRouter();
    const params = useSearchParams();
    const { sendVerification, verifyEmail } = useAuth();

    const [email, setEmail] = useState("");
    const [view, setView] = useState<View>("instructions");

    const { seconds, isReady, formatTime, start } = useCountdown(86400);

    const key = params.toString();
    const lastKeyRef = useRef<string>("");

    useEffect(() => {
        if (key === lastKeyRef.current) return;
        lastKeyRef.current = key;

        (async () => {
            const qEmail = params.get("email") ?? "";
            const qToken = params.get("token");
            if (!qEmail) return;

            setEmail(qEmail);

            if (qToken) {
                setView("verifying");
                try {
                    await verifyEmail({ email: qEmail, token: qToken });
                    setView("success");
                    setTimeout(() => router.push("/login"), 5000);
                } catch {
                    setView("error");
                }
                return;
            }

            try {
                await sendVerification({ email: qEmail });
            } finally {
                setView("instructions");
                start();
            }
        })();
    }, [key]);

    const handleResend = async () => {
        if (!email || !isReady) return;
        try {
            console.log("[Auth] Resend verification link");
            await sendVerification({ email });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            start();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen font-body text-slate-900 dark:text-white py-10">
            <Card className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">

                {view === "verifying" && (
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin h-10 w-10" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Verifying your account...</CardTitle>
                        <CardDescription>Please wait while we confirm your verification link.</CardDescription>
                    </CardHeader>
                )}

                {view === "success" && (
                    <>
                        <CardHeader className="space-y-1">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-300" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold text-center">Account verified</CardTitle>
                            <CardDescription className="text-center">
                                {email ? `Great! We’ve verified ${email}. You can now log in.` : "Great! Your account has been verified. You can now log in."}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center">
                            <Button onClick={() => router.push("/login")}>Go to login</Button>
                        </CardFooter>
                    </>
                )}

                {view === "error" && (
                    <>
                        <CardHeader className="space-y-1">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                                    <XCircle className="h-10 w-10 text-red-600 dark:text-red-300" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold text-center">Verification failed</CardTitle>
                            <CardDescription className="text-center">
                                The verification link is invalid or has expired. You can request a new link and try again.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button variant="outline" onClick={handleResend} disabled={!isReady}>
                                {isReady ? "Resend verification" : `Resend available in ${formatTime(seconds)}`}
                            </Button>
                            <Button onClick={() => router.push("/signup")}>Create a new account</Button>
                        </CardFooter>
                    </>
                )}

                {view === "instructions" && (
                    <>
                        <CardHeader className="space-y-1">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 rounded-full bg-background border-2 border-teal-600 dark:border-teal-400">
                                    <Mail className="h-10 w-10 text-teal-700 dark:text-teal-300" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl text-center">Check your email</CardTitle>
                            <CardDescription className="text-center">
                                We’ve sent a verification link to{" "}
                                <span className="font-semibold text-teal-700 dark:text-teal-300">{email}</span>.
                                Click the link in the email to activate your account.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg">
                                <h3 className="mb-2 font-medium">What happens next?</h3>
                                <ol className="list-decimal list-inside text-sm space-y-1">
                                    <li>Open your inbox and find our message.</li>
                                    <li>Click the verification link inside the email.</li>
                                </ol>
                            </div>

                            <div className="text-center text-sm text-muted-foreground">
                                {isReady ? (
                                    <Button variant="link" onClick={handleResend} className="p-0 h-auto">
                                        <div className="flex items-center gap-1 justify-center hover:text-teal-600">
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            <span>Resend verification email</span>
                                        </div>
                                    </Button>
                                ) : (
                                    <p className="text-amber-600 dark:text-amber-300">
                                        You can request a new verification email in{" "}
                                        <span className="font-mono">{formatTime(seconds)}</span>.
                                    </p>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-center items-center">
                            <Button variant="link" onClick={() => router.push("/")} className="hover:text-teal-700">
                                <span>Back to home</span>
                            </Button>
                        </CardFooter>
                    </>
                )}
            </Card>
        </div>
    );
}

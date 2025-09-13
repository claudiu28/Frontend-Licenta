"use client";
import {useState, useEffect, useMemo} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {Button} from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Eye, EyeOff, Check, X, UserRound} from "lucide-react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/hooks/useAuth";
import {toast} from "sonner";

export default function RegisterForm() {
    const router = useRouter();

    const formSchema = useMemo(() => {
        return z
            .object({
                username: z
                    .string()
                    .min(4, {message: "Username must be at least 4 characters."})
                    .max(20, {message: "Username must be at most 20 characters."}),
                email: z
                    .string()
                    .min(4)
                    .max(50)
                    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
                        message: "Please enter a valid email address.",
                    }),
                password: z
                    .string()
                    .min(8, {message: "Password must be at least 8 characters."})
                    .max(100)
                    .regex(/[A-Z]/, {message: "Must include at least one uppercase letter."})
                    .regex(/[a-z]/, {message: "Must include at least one lowercase letter."})
                    .regex(/[0-9]/, {message: "Must include at least one number."})
                    .regex(/[^A-Za-z0-9]/, {
                        message: "Must include at least one special character.",
                    }),
                confirmPassword: z.string(),
            })
            .refine((data) => data.password === data.confirmPassword, {
                message: "Passwords do not match.",
                path: ["confirmPassword"],
            });
    }, []);

    type SignUpSchema = z.infer<typeof formSchema>;

    const form = useForm<SignUpSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    type PasswordRuleKey = "length" | "uppercase" | "lowercase" | "digit" | "special";

    const passwordValue = form.watch("password");

    useEffect(() => {
        const updated = {
            length: passwordValue.length >= 8,
            uppercase: /[A-Z]/.test(passwordValue),
            lowercase: /[a-z]/.test(passwordValue),
            digit: /[0-9]/.test(passwordValue),
            special: /[^A-Za-z0-9]/.test(passwordValue),
        };
        setPasswordRequirements(updated);
    }, [passwordValue]);

    const {register} = useAuth();

    const onSubmit = async (data: SignUpSchema) => {
        try {
            setIsLoading(true);
            await register({
                username: data.username,
                email: data.email,
                password: data.password,
                confirmPassword: data.confirmPassword,
            });
            router.push(`/register/instructions-email?email=${encodeURIComponent(data.email)}`);
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };
    const [passwordRequirements, setPasswordRequirements] = useState<Record<PasswordRuleKey, boolean>>({
        length: false,
        uppercase: false,
        lowercase: false,
        digit: false,
        special: false,
    })
    const passwordRules: { label: string; key: PasswordRuleKey }[] = [
        {label: "At least 8 characters", key: "length"},
        {label: "One uppercase letter", key: "uppercase"},
        {label: "One lowercase letter", key: "lowercase"},
        {label: "One number", key: "digit"},
        {label: "One special character (e.g. !@#$%)", key: "special"},
    ];
    return (
        <div className="container flex items-center justify-center min-h-screen px-4 py-8">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6 bg-white shadow-md rounded-xl p-8 w-full max-w-md md:max-w-lg mx-auto"
                >
                    <div className="flex flex-col items-center space-y-4 mb-6">
                        <div className="p-3 rounded-full bg-teal-500 border-2 border-teal-700 dark:border-teal-300">
                            <UserRound className="h-10 w-10 text-white"/>
                        </div>
                        <h2 className="text-2xl font-semibold text-center text-teal-700 dark:text-teal-300">
                            Create your account
                        </h2>
                        <p className="text-sm text-center text-teal-600">
                            Fill in the details below to sign up.
                        </p>
                    </div>

                    <FormField
                        control={form.control}
                        name="username"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter your username" {...field} />
                                </FormControl>
                                <FormMessage className="text-red-500"/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="you@example.com" type="email" {...field} />
                                </FormControl>
                                <FormMessage className="text-red-500"/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="Enter your password"
                                            type={showPassword ? "text" : "password"}
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                        >
                                            {!showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-red-500"/>
                                <div className="text-xs mt-2">
                                    <p className="mb-1">Your password must include:</p>
                                    <ul className="space-y-1">
                                        {passwordRules.map(({label, key}) => (
                                            <li key={key} className="flex items-center space-x-2">
                                                <span
                                                    className={`flex-shrink-0 ${passwordRequirements[key] ? "text-green-500" : "text-red-500"}`}>
                                                    {passwordRequirements[key] ? <Check size={16}/> : <X size={16}/>}
                                                </span>
                                                <span
                                                    className={`${passwordRequirements[key] ? "text-green-700 dark:text-green-500" : "text-red-700 dark:text-red-400"}`}>
                                                          {label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="Re-enter your password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                        >
                                            {!showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-red-500"/>
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"/>
                Creating your account...
              </span>
                        ) : (
                            "Sign up"
                        )}
                    </Button>

                    <div className="text-center">
                        <Button
                            variant="link"
                            onClick={() => router.push("/login")}
                            type="button"
                            className="text-teal-600 hover:text-white hover:text-teal-700 transition-colors"
                        >
                            Have an account? Log in
                        </Button>
                        <Button
                            variant="link"
                            onClick={() => router.push("/")}
                            type="button"
                            className="text-teal-600 hover:text-white hover:text-teal-700 transition-colors"
                        >
                            Back to home
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

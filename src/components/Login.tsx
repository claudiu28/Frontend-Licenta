"use client"
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useState} from "react";
import {Eye, EyeOff, UserRound} from "lucide-react";
import {useAuth} from "@/hooks/useAuth";
import {z} from "zod";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

export default function LoginForm() {
    const {login} = useAuth();
    const router = useRouter();

    const loginSchema = z.object({
        email: z
            .string()
            .min(4)
            .max(50)
            .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
                message: "Please enter a valid email address.",
            }),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(20, "Password must be at most 20 characters long")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[0-9]/, "Password must contain at least one digit")
            .regex(/[\W_]/, "Password must contain at least one special character")
            .regex(/^\S*$/, "Password must not contain spaces"),
    });

    type LoginSchema = z.infer<typeof loginSchema>;

    const form = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: LoginSchema) => {
        try {
            setIsLoading(true);
            await login({
                email: data.email,
                password: data.password,
            });
            router.push("/home");
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen w-full px-4 py-10 bg-background">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 bg-white dark:bg-secondary shadow-md rounded-xl p-8 w-full max-w-md md:max-w-lg mx-auto"
                >
                    <div className="flex flex-col items-center space-y-4 mb-4">
                        <div className="p-3 rounded-full bg-teal-500 border-2 border-teal-700 dark:border-teal-300">
                            <UserRound className="h-10 w-10 text-white"/>
                        </div>
                        <h2 className="text-2xl font-semibold text-center text-teal-700 dark:text-teal-300">
                            Log in to your account
                        </h2>
                        <p className="text-sm text-center text-teal-600">
                            Enter your email and password to continue
                        </p>
                    </div>

                    <FormField
                        control={form.control}
                        name="email"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        {...field}
                                    />
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
                                    <div className="relative w-full">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            className="w-full pr-10"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2"
                                            tabIndex={-1}
                                        >
                                            {!showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-red-500"/>
                            </FormItem>
                        )}
                    />

                    <div className="-mt-2 mb-2">
                        <Button
                            variant="link"
                            className="p-0 text-sm text-left text-teal-700 hover:text-teal-900"
                            onClick={() => router.push("/recovery")}
                            type="button"
                        >
                            Forgot your password?
                        </Button>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-teal-700 text-white hover:bg-teal-900 transition-colors"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"/>
                    Logging in...
                 </span>
                        ) : (
                            "Log in"
                        )}
                    </Button>

                    <div className="pt-2 flex justify-center items-center space-x-6 text-teal-700 hover:text-teal-900">
                        <Button
                            variant="link"
                            onClick={() => router.push("/register")}
                            type="button"
                        >
                            Create an account
                        </Button>
                        <Button
                            variant="link"
                            onClick={() => router.push("/")}
                            type="button"
                        >
                            Back to home
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

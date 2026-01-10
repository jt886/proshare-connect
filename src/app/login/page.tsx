"use client";

import { useState } from "react";
import { signIn } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await signIn(formData);

        if (result?.error) {
            console.error("Login result error:", result.error);
            toast.error(result.error);
            setIsLoading(false);
        } else {
            toast.success("Welcome back! Redirecting...");
            // Next.js will handle the redirect thrown by the server action
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-sm border-none shadow-2xl bg-secondary/10 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        Welcome Back
                    </CardTitle>
                    <CardDescription>
                        Enter your credentials to access ProShare Connect.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                disabled={isLoading}
                                className="h-12 bg-background/50 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                disabled={isLoading}
                                className="h-12 bg-background/50 border-white/10"
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground mt-4 flex flex-col gap-2">
                            <span>
                                Don&apos;t have an account?{" "}
                                <Link href="/signup" className="text-primary hover:underline font-bold">
                                    Sign Up
                                </Link>
                            </span>
                            <Link href="/" className="text-xs hover:underline opacity-50">
                                Back to Landing
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

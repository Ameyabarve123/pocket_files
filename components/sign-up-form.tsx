"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import GoogleLoginButton from "./google-login-button";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Check if passwords match
    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Check password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    // Check username length
    if (username.length < 3) {
      setError("Username must be at least 3 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            username: username,
          }
        },
      });

      if (error) {
        // Check for duplicate email error - Supabase error codes
        if (error.status === 422 || 
            error.message.toLowerCase().includes("already") || 
            error.message.toLowerCase().includes("exists") ||
            error.message.toLowerCase().includes("registered")) {
          throw new Error("An account with this email already exists. Please sign in instead.");
        }
        throw error;
      }

      // If signUp succeeds but user already exists, Supabase might return the user without creating a new one
      if (data?.user && !data.session && data.user.identities?.length === 0) {
        throw new Error("An account with this email already exists. Please sign in instead.");
      }

      // Success - redirect to success page
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleLoginButton>
          </GoogleLoginButton>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
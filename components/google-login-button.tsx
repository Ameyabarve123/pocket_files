"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: any;
    handleSignInWithGoogle?: (response: any) => void;
  }
}

const GoogleLoginButton = () => {
  const supabase = createClient();
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    window.handleSignInWithGoogle = async (response: any) => {
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });

        if (error) throw error;
        router.push("/dashboard");
      } catch (error) {
        // console.error("Error signing in with Google:", error);
        setError("Failed to sign in with Google. Please try again.");
      }
    };

    const initializeGoogleButton = () => {
      if (!window.google || !buttonRef.current) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: window.handleSignInWithGoogle,
          auto_select: false,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          shape: "pill",
          theme: "outline",
          text: "signin_with",
          size: "large",
          logo_alignment: "left",
        });

        return true;
      } catch (error) {
        console.error("Error initializing Google button:", error);
        setError("Unable to load Google Sign-In. Please refresh the page.");
        return false;
      }
    };

    if (initializeGoogleButton()) {
      return () => {
        delete window.handleSignInWithGoogle;
      };
    }

    let attempts = 0;
    const interval = setInterval(() => {
      if (initializeGoogleButton() || ++attempts >= 50) {
        clearInterval(interval);
        if (attempts >= 50) {
          setError("Unable to load Google Sign-In. Please refresh the page.");
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      delete window.handleSignInWithGoogle;
    };
  }, [isClient, supabase, router]);

  if (!isClient) {
    return <div className="mb-5 h-10"></div>;
  }

  return (
    <>
      {error && (
        <div className="mb-5 text-sm text-red-500">
          {error}
        </div>
      )}
      <div ref={buttonRef} className="mb-5"></div>
    </>
  );
};

export default GoogleLoginButton;
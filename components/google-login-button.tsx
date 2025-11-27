"use client";

import Script from "next/script";
import { useEffect } from "react";
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

  useEffect(() => {
    // Define the callback function globally so Google can call it
    window.handleSignInWithGoogle = async (response: any) => {
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });

        if (error) throw error;

        console.log("Successfully signed in with Google");
        router.push("/dashboard");
      } catch (error) {
        console.error("Error signing in with Google:", error);
      }
    };

    return () => {
      delete window.handleSignInWithGoogle;
    };
  }, [supabase, router]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <div
        id="g_id_onload"
        data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        data-context="use"
        data-ux_mode="popup"
        data-callback="handleSignInWithGoogle"
        data-auto_prompt="false"
      ></div>

      <div
        className="g_id_signin mb-5"
        data-type="standard"
        data-shape="pill"
        data-theme="outline"
        data-text="signin_with"
        data-size="large"
        data-logo_alignment="left"
      ></div>
    </>
  );
};

export default GoogleLoginButton;
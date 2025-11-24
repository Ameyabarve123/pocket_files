"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LongTermStorage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDeleteProfile = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will delete all your files permanently."
    );
    
    if (!confirmed) return;

    const doubleConfirm = confirm(
      "This is your last chance. This action cannot be undone and will delete all your files permanetly."
    );

    if (!doubleConfirm) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Not authenticated");
        return;
      }

      // Call delete API
      const response = await fetch('/api/delete/profile', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.error) {
        alert("Error deleting account: " + result.error);
      } else {
        alert("Account deleted successfully");
        // Sign out and redirect
        await supabase.auth.signOut();
        router.push('/');
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 h-full">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and data
          </p>
        </div>

        {/* Danger Zone */}
        <div className="border bg-black border-destructive/50 rounded-lg p-6 bg-destructive/5">
          <h1 className="text-xl font-semibold text-destructive mb-2">
            Danger Zone
          </h1>
          <p className="text-m text-muted-foreground mb-4">
            Once you delete your account, there is no going back. This will permanently delete:
          </p>
          <ul className="text-m text-muted-foreground mb-4 space-y-1 list-disc list-inside">
            <li>Your profile and account data</li>
            <li>All uploaded files and folders</li>
          </ul>

          <h1 className="text-destructive mb-4">IF YOU HAVE A PRO OR PREMIUM ACCOUNT, YOU WILL LOOSE YOUR MEMBERSHIP WITH NO REFUND</h1>
          
          <Button 
            variant="destructive"
            onClick={handleDeleteProfile}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting Account..." : "Delete Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
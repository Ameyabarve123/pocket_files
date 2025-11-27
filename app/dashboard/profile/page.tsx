"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Upload } from "lucide-react";
import { useStorage } from "@/components/storage-context";
import { useAlert } from "@/components/use-alert";

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Form states
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [email, setEmail] = useState("");

  const { refreshStorage } = useStorage();
  const { showAlert } = useAlert();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, profile_picture")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username || "");
        setProfilePictureUrl(profile.profile_picture || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      showAlert("Error", "Username cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ username: username.trim() })
        .eq("id", user.id);

      if (error) {
        showAlert("Error", `Error updating username: ${error.message}`);
      } else {
        showAlert("Success", "Username updated successfully!");
        await refreshStorage();
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert("Error", "Failed to update username");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showAlert("Error", "Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Error", "New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      showAlert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        showAlert("Error", `Error updating password: ${error.message}`);
      } else {
        showAlert("Success", "Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        await refreshStorage();
      }
    } catch (error) {
      showAlert("Error", "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfilePicture = async () => {
    if (!profilePicture) {
      showAlert("Error", "Please select an image");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;
      
      // ALWAYS use the same filename regardless of uploaded file type
      const fileName = `${user.id}/profile`;  

      // Upload with upsert - will replace if exists
      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(fileName, profilePicture, { 
          upsert: true,
          contentType: profilePicture.type  // Browser will still serve it correctly
        });

      if (uploadError) {
        showAlert("Error", `Error uploading image: ${uploadError.message}`);
        return;
      }

      // Get public URL (add timestamp to bust cache)
      const { data: { publicUrl } } = supabase.storage
        .from('profile_images')
        .getPublicUrl(fileName);
      
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture: urlWithCacheBust })
        .eq("id", user.id);

      if (updateError) {
        showAlert("Error", `Error updating profile: ${updateError.message}`);
      } else {
        setProfilePictureUrl(urlWithCacheBust);
        showAlert("Success", "Profile picture updated successfully!");
        setProfilePicture(null);
        await refreshStorage();
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert("Error", "Failed to update profile picture");
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account information
          </p>
        </div>

        {/* Profile Picture Section */}
        <div className="border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {profilePictureUrl != '""' ? (
                <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Profile Picture</h2>
              <p className="text-sm text-muted-foreground">
                Update your profile picture
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <Button 
              onClick={handleUpdateProfilePicture}
              disabled={loading || !profilePicture}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {loading ? "Uploading..." : "Upload Profile Picture"}
            </Button>
          </div>
        </div>

        {/* Email (Read-only) */}
        <div className="border border-border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Email Address</h2>
            <p className="text-sm text-muted-foreground">
              Your email address cannot be changed
            </p>
          </div>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
          />
        </div>

        {/* Username Section */}
        <div className="border border-border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Username</h2>
            <p className="text-sm text-muted-foreground">
              Update your display name
            </p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button 
              onClick={handleUpdateUsername}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Updating..." : "Update Username"}
            </Button>
          </div>
        </div>

        {/* Password Section */}
        <div className="border border-border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Change Password</h2>
            <p className="text-sm text-muted-foreground">
              Update your password
            </p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button 
              onClick={handleUpdatePassword}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
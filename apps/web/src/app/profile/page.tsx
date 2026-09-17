'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useGamify } from "@/components/gamification/GamificationProvider";
import FriendsList from "@/components/social/FriendsList";
import BadgeCollection from "@/components/gamification/BadgeCollection";
import ProgressChart from "@/components/gamification/ProgressChart";

export default function ProfilePage() {
  const [profile, setProfile] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
    }
    setLoading(false);
  }

  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio })
      .eq("id", user.id);

    if (!error) {
      setIsEditing(false);
      loadProfile();
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <button
          onClick={() => isEditing ? saveProfile() : setIsEditing(true)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-fg text-sm"
        >
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>

      <div className="rounded-xl border p-6 bg-card">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-2xl">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full" />
            ) : (
              <span>{(profile?.display_name || "U")[0]}</span>
            )}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="w-full rounded-lg border border-border p-2 mb-2"
              />
            ) : (
              <div className="text-xl font-bold">{profile?.display_name || "Anonymous"}</div>
            )}
            <div className="text-sm text-muted-foreground">
              Level {profile?.level || 1} · {profile?.total_xp || 0} XP
            </div>
          </div>
        </div>

        {isEditing ? (
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={3}
            className="w-full rounded-lg border border-border p-2 text-sm"
          />
        ) : (
          <div className="text-sm">{profile?.bio || "No bio yet."}</div>
        )}
      </div>

      <ProgressChart />
      <BadgeCollection />
      <FriendsList />
    </div>
  );
}
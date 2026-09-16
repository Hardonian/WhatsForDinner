"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { hapticTap } from "@/components/gamification/Haptics";

export default function FriendsList() {
  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadFriends();
  }, []);

  async function loadFriends() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: friendships } = await supabase
      .from("friendships")
      .select("*, profiles!friendships_addressee_id_fkey(display_name, avatar_url, id)")
      .eq("requester_id", user.id)
      .eq("status", "accepted");

    const { data: received } = await supabase
      .from("friendships")
      .select("*, profiles!friendships_requester_id_fkey(display_name, avatar_url, id)")
      .eq("addressee_id", user.id)
      .eq("status", "accepted");

    const { data: pendingRequests } = await supabase
      .from("friendships")
      .select("*, profiles!friendships_requester_id_fkey(display_name, avatar_url, id)")
      .eq("addressee_id", user.id)
      .eq("status", "pending");

    const allFriends = [
      ...(friendships?.map(f => ({ ...f.profiles, friendship_id: f.id })) || []),
      ...(received?.map(f => ({ ...f.profiles, friendship_id: f.id })) || [])
    ];

    setFriends(allFriends);
    setPending(pendingRequests?.map(f => ({ ...f.profiles, friendship_id: f.id })) || []);
  }

  async function acceptFriend(friendshipId: number) {
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);

    hapticTap();
    loadFriends();
  }

  async function sendFriendRequest(userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("friendships")
      .insert({ requester_id: user.id, addressee_id: userId, status: "pending" });

    hapticTap();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Friends</h2>

      {pending.length > 0 && (
        <div className="rounded-xl border p-4 bg-card">
          <div className="text-sm font-semibold mb-2">Pending Requests</div>
          <div className="space-y-2">
            {pending.map((friend) => (
              <div key={friend.friendship_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <span className="text-xs">{(friend.display_name || "U")[0]}</span>
                    )}
                  </div>
                  <span className="text-sm">{friend.display_name || "Anonymous"}</span>
                </div>
                <button
                  onClick={() => acceptFriend(friend.friendship_id)}
                  className="px-3 py-1 rounded-lg bg-primary text-primary-fg text-xs"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {friends.length === 0 ? (
          <div className="text-sm text-muted-foreground">No friends yet. Start connecting!</div>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                ) : (
                  <span>{(friend.display_name || "U")[0]}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{friend.display_name || "Anonymous"}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

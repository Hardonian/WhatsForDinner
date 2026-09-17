'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import ReactionBar from "@/components/social/ReactionBar";
import CommentSection from "@/components/social/CommentSection";
import LiveCookingFeed from "@/components/social/LiveCookingFeed";
import StartCookingActivity from "@/components/social/StartCookingActivity";
import FamilyCookOff from "@/components/social/FamilyCookOff";

export default function Community(){
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"feed" | "cooking" | "cookoff">("feed");

  useEffect(() => {
    if (activeTab === "feed") {
      loadPosts();
      subscribeToPosts();
    }
  }, [activeTab]);

  function subscribeToPosts() {
    const channel = supabase
      .channel('community-posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      }, () => {
        loadPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (!error && data) setPosts(data);
    setLoading(false);
  }

  async function createPost() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newPost.trim()) return;

    const { error } = await supabase
      .from("posts")
      .insert({ user_id: user.id, body: newPost });

    if (!error) {
      setNewPost("");
      loadPosts();
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Community</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        {(["feed", "cooking", "cookoff"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "feed" && "📝 Feed"}
            {tab === "cooking" && "👨‍🍳 Live Cooking"}
            {tab === "cookoff" && "🏆 Cook-Off"}
          </button>
        ))}
      </div>

      {/* Feed Tab */}
      {activeTab === "feed" && (
        <>
          <div className="rounded-2xl border p-4 bg-card">
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="Share your progress, ask questions, give kudos..."
              rows={3}
              className="w-full rounded-xl border border-border p-3 mb-2"
            />
            <button
              onClick={createPost}
              className="h-10 px-4 rounded-xl bg-primary text-primary-fg"
              disabled={!newPost.trim()}
            >
              Post
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">👋</div>
                  <div>Be the first to share!</div>
                </div>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="rounded-2xl border p-4 bg-card">
                    <header className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {post.profiles?.avatar_url ? (
                          <img src={post.profiles.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <span className="text-xs">{(post.profiles?.display_name || "User")[0]}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{post.profiles?.display_name || "Anonymous"}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </header>
                    <p className="text-sm mb-3">{post.body}</p>
                    <ReactionBar postId={post.id} />
                    <CommentSection postId={post.id} />
                  </article>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Live Cooking Tab */}
      {activeTab === "cooking" && (
        <div className="space-y-4">
          <StartCookingActivity />
          <LiveCookingFeed />
        </div>
      )}

      {/* Cook-Off Tab */}
      {activeTab === "cookoff" && (
        <FamilyCookOff />
      )}
    </div>
  );
}
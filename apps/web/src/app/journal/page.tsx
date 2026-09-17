'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import Confetti from "@/components/gamification/Confetti";
import { hapticTap } from "@/components/gamification/Haptics";

const MOODS = [
  { value: "great", emoji: "😊", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "challenging", emoji: "😔", label: "Challenging" },
  { value: "tough", emoji: "😢", label: "Tough" },
];

export default function JournalPage(){
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [mood, setMood] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isShared, setIsShared] = useState(false);

  async function save() {
    hapticTap();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data, error } = await supabase
      .from("journal_entries")
      .insert({ 
        user_id: user.id, 
        body: text,
        mood: mood || null,
        tags: tags.length > 0 ? tags : null,
        is_shared: isShared
      })
      .select("*")
      .single();
    
    setSaved(!error);
    if (!error) {
      setText("");
      setMood("");
      setTags([]);
      setIsShared(false);
    }
  }

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
  }

  useEffect(()=>{ 
    if(saved) { 
      const t = setTimeout(()=>setSaved(false), 2000); 
      return ()=>clearTimeout(t); 
    } 
  }, [saved]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Journal</h1>
      
      <div className="space-y-3">
        <textarea 
          value={text} 
          onChange={e=>setText(e.target.value)} 
          rows={8}
          className="w-full rounded-xl border border-border p-3" 
          placeholder="Reflect on today's progress…"
        />
        
        <div>
          <label className="text-sm font-medium mb-2 block">How are you feeling?</label>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map(m => (
              <button
                key={m.value}
                onClick={() => setMood(mood === m.value ? "" : m.value)}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  mood === m.value ? "bg-primary text-primary-fg border-primary" : "bg-card"
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyPress={e => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
              className="flex-1 rounded-lg border border-border p-2 text-sm"
            />
            <button onClick={addTag} className="px-4 rounded-lg bg-secondary text-sm">Add</button>
          </div>
          {tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:opacity-70">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isShared}
            onChange={e => setIsShared(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Share this entry with the community</span>
        </label>
      </div>

      <div className="flex gap-2">
        <button 
          className="h-10 px-4 rounded-xl bg-primary text-primary-fg" 
          onClick={save}
          disabled={!text.trim()}
        >
          Save Entry
        </button>
      </div>
      
      <div aria-live="polite" className="text-sm text-muted-foreground">
        {saved ? "Saved ✓" : ""}
      </div>
      <Confetti when={saved}/>
    </div>
  );
}
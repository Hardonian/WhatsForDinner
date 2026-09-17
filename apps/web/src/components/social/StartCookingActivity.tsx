"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { hapticTap } from "@/components/gamification/Haptics";
import { awardXp } from "@/components/gamification/GamificationProvider";
import Confetti from "@/components/gamification/Confetti";

export default function StartCookingActivity() {
  const [isActive, setIsActive] = useState(false);
  const [mealName, setMealName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [familyName, setFamilyName] = useState("");
  const [currentActivity, setCurrentActivity] = useState<any>(null);

  useEffect(() => {
    checkActiveCooking();
  }, []);

  async function checkActiveCooking() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("cooking_activities")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_live", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setIsActive(true);
      setCurrentActivity(data);
      setMealName(data.meal_name);
      setDescription(data.description || "");
      setIngredients(data.ingredients || []);
      setCookingTime(String(data.cooking_time_minutes || ""));
      setDifficulty(data.difficulty || "easy");
      setFamilyName(data.family_name || "");
    }
  }

  async function startCooking() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !mealName.trim()) return;

    const { data, error } = await supabase
      .from("cooking_activities")
      .insert({
        user_id: user.id,
        meal_name: mealName,
        description: description || null,
        ingredients: ingredients.length > 0 ? ingredients : null,
        cooking_time_minutes: cookingTime ? parseInt(cookingTime) : null,
        difficulty,
        family_name: familyName || null,
        is_live: true,
      })
      .select()
      .single();

    if (!error && data) {
      setIsActive(true);
      setCurrentActivity(data);
      hapticTap();
      awardXp(10);
    }
  }

  async function stopCooking() {
    if (!currentActivity) return;

    const { error } = await supabase
      .from("cooking_activities")
      .update({ is_live: false, ended_at: new Date().toISOString() })
      .eq("id", currentActivity.id);

    if (!error) {
      setIsActive(false);
      setCurrentActivity(null);
      hapticTap();
      awardXp(15);
    }
  }

  function addIngredient() {
    if (ingredientInput.trim() && !ingredients.includes(ingredientInput.trim())) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput("");
    }
  }

  function removeIngredient(ing: string) {
    setIngredients(ingredients.filter((i) => i !== ing));
  }

  if (isActive && currentActivity) {
    return (
      <div className="rounded-xl border p-4 bg-card border-red-500">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="font-semibold">Live Cooking: {currentActivity.meal_name}</span>
          </div>
          <button
            onClick={stopCooking}
            className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm"
          >
            End Cooking
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          Started {Math.floor((Date.now() - new Date(currentActivity.started_at).getTime()) / 60000)}{" "}
          minutes ago
        </div>
        <div className="mt-2 text-sm">
          👁️ {currentActivity.views_count || 0} views · ❤️ {currentActivity.likes_count || 0} likes
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 bg-card">
      <h3 className="font-semibold mb-3">Start Live Cooking</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Family Name (optional)</label>
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="The Smith Family"
            className="w-full rounded-lg border border-border p-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">What are you cooking? *</label>
          <input
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="Homemade Pizza"
            className="w-full rounded-lg border border-border p-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sharing our secret family recipe..."
            rows={2}
            className="w-full rounded-lg border border-border p-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Ingredients</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
              placeholder="Add ingredient..."
              className="flex-1 rounded-lg border border-border p-2 text-sm"
            />
            <button
              onClick={addIngredient}
              className="px-3 py-2 rounded-lg bg-secondary text-sm"
            >
              Add
            </button>
          </div>
          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs"
                >
                  {ing}
                  <button
                    onClick={() => removeIngredient(ing)}
                    className="hover:opacity-70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Cooking Time (min)</label>
            <input
              type="number"
              value={cookingTime}
              onChange={(e) => setCookingTime(e.target.value)}
              placeholder="30"
              className="w-full rounded-lg border border-border p-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
              className="w-full rounded-lg border border-border p-2 text-sm"
            >
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>
          </div>
        </div>

        <button
          onClick={startCooking}
          disabled={!mealName.trim()}
          className="w-full px-4 py-2 rounded-xl bg-primary text-primary-fg font-medium disabled:opacity-50"
        >
          🔴 Go Live!
        </button>
      </div>
    </div>
  );
}

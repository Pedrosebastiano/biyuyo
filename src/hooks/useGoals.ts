import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // O tu cliente de DB

export function useGoals(userId: string) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error) setGoals(data);
      setLoading(false);
    };

    fetchGoals();
  }, [userId]);

  return { goals, setGoals, loading };
}
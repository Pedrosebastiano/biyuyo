import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export function useGoals(userId: string) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/goals/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return { goals, setGoals, loading, refreshGoals: fetchGoals };
}
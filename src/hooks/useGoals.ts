import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export function useGoals(userId: string, sharedId?: string) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const url = sharedId
        ? `${API_URL}/goals/${userId}?sharedId=${sharedId}`
        : `${API_URL}/goals/${userId}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, sharedId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return { goals, setGoals, loading, refreshGoals: fetchGoals };
}
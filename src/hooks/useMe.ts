import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  role: "admin" | "teacher" | "learner";
  classroom_id: string | null;
  difficulty_level: number;
  l1: string | null;
}

export const useMe = (userId?: string | null) => {
  return useQuery({
    queryKey: ["me", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,email,role,classroom_id,difficulty_level,l1")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile) ?? null;
    },
    staleTime: 60_000,
  });
};

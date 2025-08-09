import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Recording { id: string; audio_url: string; created_at: string; dailyword_id: string; learner_id: string; }

export const useLearnerRecordings = (learnerId?: string | null) => {
  return useQuery({
    queryKey: ["learner-recordings", learnerId],
    enabled: !!learnerId,
    queryFn: async (): Promise<Recording[]> => {
      if (!learnerId) return [];
      const { data, error } = await supabase
        .from("learner_recordings")
        .select("id,audio_url,created_at,dailyword_id,learner_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Recording[];
    },
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LearnerProfile {
  id: string;
  name: string;
  l1: string | null;
  difficulty_level: number;
  role: string;
  classroom_id: string;
}

export const useLearnerProfiles = (classroomId?: string | null) => {
  return useQuery({
    queryKey: ["learner-profiles", classroomId],
    enabled: !!classroomId,
    queryFn: async (): Promise<LearnerProfile[]> => {
      if (!classroomId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,l1,difficulty_level,role,classroom_id")
        .eq("classroom_id", classroomId)
        .eq("role", "learner")
        .order("name");
      if (error) throw error;
      return (data ?? []) as LearnerProfile[];
    },
  });
};
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TaskResultPayload {
  task_id: string;
  learner_id: string;
  response: any;
  score?: number | null;
}

export const useSubmitTaskResult = () => {
  return useMutation({
    mutationFn: async (payload: TaskResultPayload) => {
      const { error } = await supabase.from("task_results").insert({
        task_id: payload.task_id,
        learner_id: payload.learner_id,
        response: payload.response,
        score: payload.score ?? null,
      });
      if (error) throw error;
    },
  });
};

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DailyWord {
  id: string;
  classroom_id: string;
  date: string; // ISO date
  norwegian: string;
  theme: string | null;
  image_url: string | null;
  image_alt: string | null;
  approved: boolean;
}

export interface LevelText { id: string; level: number; text: string; image_url: string | null; image_alt: string | null; dailyword_id: string; }
export interface Translation { id: string; language_code: string; text: string; dailyword_id: string; }
export interface Pronunciation { id: string; language_code: string; audio_url: string; dailyword_id: string; }
export interface Task { id: string; type: string; level: number; data: any; answer: any; dailyword_id: string; }

export const useTodayOrLatestWord = (classroomId?: string | null) => {
  return useQuery({
    queryKey: ["dailyword-latest", classroomId],
    enabled: !!classroomId,
    queryFn: async (): Promise<DailyWord | null> => {
      if (!classroomId) return null;
      const { data, error } = await supabase
        .from("daily_words")
        .select("id,classroom_id,date,norwegian,theme,image_url,image_alt,approved")
        .eq("classroom_id", classroomId)
        .eq("approved", true)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as DailyWord | null;
    },
    staleTime: 60_000,
  });
};

export const useDailyWordBundle = (dailywordId?: string | null, l1?: string | null, level?: number) => {
  return useQuery({
    queryKey: ["dailyword-bundle", dailywordId, l1, level],
    enabled: !!dailywordId,
    queryFn: async () => {
      if (!dailywordId) return null;
      const [translations, levelTexts, pronunciations, tasks] = await Promise.all([
        supabase.from("translations").select("id,language_code,text,dailyword_id").eq("dailyword_id", dailywordId),
        supabase.from("level_texts").select("id,level,text,image_url,image_alt,dailyword_id").eq("dailyword_id", dailywordId),
        supabase.from("pronunciations").select("id,language_code,audio_url,dailyword_id").eq("dailyword_id", dailywordId),
        supabase.from("tasks").select("id,type,level,data,answer,dailyword_id").eq("dailyword_id", dailywordId),
      ]);
      if (translations.error) throw translations.error;
      if (levelTexts.error) throw levelTexts.error;
      if (pronunciations.error) throw pronunciations.error;
      if (tasks.error) throw tasks.error;
      return {
        translations: translations.data as Translation[],
        levelTexts: (levelTexts.data as LevelText[]).sort((a,b)=>a.level-b.level),
        pronunciations: pronunciations.data as Pronunciation[],
        tasks: (tasks.data as Task[]).sort((a,b)=>a.level-b.level),
      };
    }
  });
};

export const useDailyWordsHistory = (classroomId?: string | null, page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ["dailywords-history", classroomId, page, pageSize],
    enabled: !!classroomId,
    queryFn: async (): Promise<DailyWord[]> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("daily_words")
        .select("id,classroom_id,date,norwegian,theme,image_url,image_alt,approved")
        .eq("classroom_id", classroomId)
        .order("date", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data ?? []) as DailyWord[];
    },
  });
};

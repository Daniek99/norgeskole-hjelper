import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization")! } },
  });

  try {
    const { classroom_id } = await req.json();
    if (!classroom_id) return new Response(JSON.stringify({ error: "classroom_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Build a tiny weekly test from latest approved daily words (fallback)
    const dw = await supabase
      .from("daily_words")
      .select("id,date,norwegian")
      .eq("classroom_id", classroom_id)
      .eq("approved", true)
      .order("date", { ascending: false })
      .limit(5);

    const tasks = (dw.data ?? []).map((d: any) => ({
      type: "mcq",
      prompt: `Hva er dagens ord ${d.date}?`,
      data: { question: `Velg riktig ord (${d.date})`, options: [d.norwegian, "feil 1", "feil 2"] },
      answer: { index: 0 },
    }));

    const isoWeek = (() => {
      const now = new Date();
      const onejan = new Date(now.getFullYear(), 0, 1);
      const day = Math.floor((now.getTime() - onejan.getTime()) / 86400000);
      return Math.ceil((now.getDay() + 1 + day) / 7);
    })();

    const payload = { iso_week: isoWeek, date: new Date().toISOString().slice(0,10), tasks, auto_grade: true, classroom_id };
    const { error } = await supabase.from("weekly_tests").insert(payload as any);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

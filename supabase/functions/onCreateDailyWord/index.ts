import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization")! } },
  });

  try {
    const { classroom_id, norwegian, theme, date, demo } = await req.json();
    if (!classroom_id || !norwegian || !date) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1) Upsert daily_words by (classroom_id, date)
    const existing = await supabase
      .from("daily_words")
      .select("id")
      .eq("classroom_id", classroom_id)
      .eq("date", date)
      .maybeSingle();
    let dailyword_id: string | null = existing.data?.id ?? null;

    if (!dailyword_id) {
      const ins = await supabase.from("daily_words").insert({ classroom_id, norwegian, theme, date, approved: false }).select("id").single();
      if (ins.error) throw ins.error;
      dailyword_id = ins.data.id;
    } else {
      const upd = await supabase.from("daily_words").update({ norwegian, theme, approved: false }).eq("id", dailyword_id);
      if (upd.error) throw upd.error;
    }

    // 2) Collect distinct L1 from class profiles
    const prof = await supabase.from("profiles").select("l1").eq("classroom_id", classroom_id);
    const l1Set = new Set<string>();
    (prof.data ?? []).forEach((p: any) => { if (p.l1) l1Set.add(p.l1); });

    // 3) Translations (fallback: copy norwegian)
    for (const l1 of Array.from(l1Set)) {
      let translated = norwegian;
      const baseUrl = Deno.env.get("LIBRETRANSLATE_BASE_URL");
      if (!demo && baseUrl) {
        try {
          const res = await fetch(`${baseUrl}/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: norwegian, source: "no", target: l1 }),
          });
          const j = await res.json();
          translated = j.translatedText ?? norwegian;
        } catch (_) { /* ignore */ }
      }
      await supabase.from("translations").delete().eq("dailyword_id", dailyword_id).eq("language_code", l1);
      await supabase.from("translations").insert({ dailyword_id, language_code: l1, text: translated });
    }

    // 4) Image generation (Hugging Face FLUX.1-schnell if available; else SVG)
    let imageUrl = "";
    const imageAlt = `Illustrasjon av ${norwegian}`;
    try {
      const hfKey = Deno.env.get("HUGGINGFACE_API_TOKEN");
      if (!demo && hfKey) {
        const prompt = `Norwegian word: ${norwegian}. Illustration. Simple, clear, high contrast, SFW, educational.`;
        const hfRes = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: prompt }),
        });
        if (!hfRes.ok) throw new Error("HF request failed");
        const arr = new Uint8Array(await hfRes.arrayBuffer());
        const fileNamePng = `dailyword-${dailyword_id}.png`;
        await supabase.storage.from("generated").upload(fileNamePng, arr, { contentType: "image/png", upsert: true });
        const { data: pubPng } = await supabase.storage.from("generated").getPublicUrl(fileNamePng);
        imageUrl = pubPng.publicUrl;
      }
    } catch (_) { /* ignore */ }

    if (!imageUrl) {
      const fileNameSvg = `dailyword-${dailyword_id}.svg`;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
        <defs><linearGradient id='g' x1='0' x2='1'><stop offset='0%' stop-color='hsl(226,75%,45%)'/><stop offset='100%' stop-color='hsl(190,90%,42%)'/></linearGradient></defs>
        <rect width='100%' height='100%' fill='url(#g)'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='80' fill='white' font-family='sans-serif'>${norwegian}</text>
      </svg>`;
      const bytes = new TextEncoder().encode(svg);
      await supabase.storage.from("generated").upload(fileNameSvg, bytes, { contentType: "image/svg+xml", upsert: true });
      const { data: pubSvg } = await supabase.storage.from("generated").getPublicUrl(fileNameSvg);
      imageUrl = pubSvg.publicUrl;
    }

    await supabase.from("daily_words").update({ image_url: imageUrl, image_alt: imageAlt }).eq("id", dailyword_id);

    // 5) Level texts (OpenRouter if available; else simple samples)
    let texts: string[] | null = null;
    try {
      const orKey = Deno.env.get("OPENROUTER_API_KEY");
      if (!demo && orKey) {
        const prompt = `Du skal lage 3 svært korte norske lesetekster (nivå 1-3) for voksne A1-A2. Bruk nøkkelordet \"${norwegian}\".\n` +
          `Nivå 1: 1-2 enkle setninger. Nivå 2: 2-3 enkle setninger. Nivå 3: 3-4 korte setninger.\n` +
          `Returner som JSON-array med tre strenger.`;
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "meta-llama/llama-3.1-8b-instruct:free",
            messages: [
              { role: "system", content: "Du skriver veldig enkle norske setninger for voksne på nivå A1-A2." },
              { role: "user", content: prompt },
            ],
            temperature: 0.4,
          }),
        });
        const j = await orRes.json();
        const content = j?.choices?.[0]?.message?.content ?? "";
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length >= 3) {
            texts = [String(parsed[0]), String(parsed[1]), String(parsed[2])];
          }
        } catch {
          const parts = String(content).split("\n").filter(Boolean).slice(0, 3);
          if (parts.length === 3) texts = parts;
        }
      }
    } catch (_) { /* ignore */ }

    if (!texts) {
      texts = [
        `Jeg ser ${norwegian}. Det er fint.`,
        `${norwegian} er tema i dag. Vi lærer ord og setninger om ${norwegian}.`,
        `I dag snakker vi om ${norwegian}. Les og øv: "${norwegian}".`,
      ];
    }

    await supabase.from("level_texts").delete().eq("dailyword_id", dailyword_id);
    await supabase.from("level_texts").insert([
      { dailyword_id, level: 1, text: texts[0], image_url: imageUrl, image_alt: `Nivå 1: ${norwegian}` },
      { dailyword_id, level: 2, text: texts[1], image_url: imageUrl, image_alt: `Nivå 2: ${norwegian}` },
      { dailyword_id, level: 3, text: texts[2], image_url: imageUrl, image_alt: `Nivå 3: ${norwegian}` },
    ]);

    // 6) Tasks (basic MCQ per level)
    await supabase.from("tasks").delete().eq("dailyword_id", dailyword_id);
    const mcq = (lvl: number) => ({
      dailyword_id,
      type: "mcq" as any,
      level: lvl,
      prompt: `Velg riktig ord: ${norwegian}`,
      data: { question: `Hva er dagens ord?`, options: [norwegian, "mat", "hus", "bok"] },
      answer: { index: 0 },
    });
    await supabase.from("tasks").insert([mcq(1), mcq(2), mcq(3)]);

    return new Response(JSON.stringify({ ok: true, dailyword_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

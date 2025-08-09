import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { useDailyWordBundle, useTodayOrLatestWord } from "@/hooks/useDailyWords";
import { HighContrastToggle } from "@/components/HighContrastToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveTaskRenderer } from "@/components/InteractiveTaskRenderer";
import { speak, stopSpeak } from "@/lib/tts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const LearnerHome = () => {
  const { user } = useAuth();
  const { data: me } = useMe(user?.id);
  const { data: dw } = useTodayOrLatestWord(me?.classroom_id ?? null);
  const { data: bundle } = useDailyWordBundle(dw?.id, me?.l1 ?? undefined, me?.difficulty_level);

  const l1Translation = useMemo(() =>
    bundle?.translations.find(t => t.language_code === (me?.l1 ?? ""))?.text ?? null
  , [bundle, me?.l1]);

  const tasksForLevel = useMemo(() => (bundle?.tasks ?? []).filter(t => t.level === (me?.difficulty_level ?? 1)), [bundle, me?.difficulty_level]);
  const levelText = useMemo(() => (bundle?.levelTexts ?? []).find(t => t.level === (me?.difficulty_level ?? 1))?.text ?? null, [bundle, me?.difficulty_level]);

  return (
    <main className="min-h-screen container py-4 space-y-4">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Hei, {me?.name ?? "elev"}</h1>
        <HighContrastToggle />
      </header>

      {dw && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Dagens ord</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {dw.image_url && (
              <img src={dw.image_url} alt={dw.image_alt ?? dw.norwegian} className="w-full max-h-64 object-cover rounded-md" loading="lazy" />
            )}
            <div className="text-center space-y-2">
              <div className="text-4xl font-extrabold">{dw.norwegian}</div>
              {l1Translation && <div className="text-xl text-muted-foreground">{l1Translation}</div>}
              <div className="flex gap-2 justify-center">
                <Button onClick={() => speak(dw.norwegian, "no-NO")}>Spill av (NO)</Button>
                {l1Translation && <Button variant="secondary" onClick={() => speak(l1Translation, (me?.l1 ?? "en"))}>Spill av (L1)</Button>}
                <Button variant="ghost" onClick={stopSpeak}>Stopp</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {levelText && (
        <Card>
          <CardHeader><CardTitle>Les (nivå {me?.difficulty_level})</CardTitle></CardHeader>
          <CardContent>
            <p className="leading-relaxed text-lg">{levelText}</p>
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-xl font-semibold">Oppgaver</h2>
        {tasksForLevel.map(task => (
          <InteractiveTaskRenderer key={task.id} task={task as any} onSubmit={async (score, response) => {
            if (!user) return;
            const { error } = await supabase.from("task_results").insert({ task_id: task.id, learner_id: user.id, response, score });
            if (error) toast({ title: "Kunne ikke lagre", description: error.message });
            else toast({ title: "Svar lagret" });
          }} />
        ))}
      </section>

      {dw && <Recorder dailywordId={dw.id} />}
    </main>
  );
};

const Recorder = ({ dailywordId }: { dailywordId: string }) => {
  const { user } = useAuth();
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorder.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      chunks.current = [];
      if (!user) return;
      const path = `user/${user.id}/${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage.from("audio").upload(path, blob, { contentType: "audio/webm" });
      if (upErr) return toast({ title: "Opplasting feilet", description: upErr.message });
      const { data } = await supabase.storage.from("audio").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      const { error: insErr } = await supabase.from("learner_recordings").insert({ audio_url: publicUrl, learner_id: user.id, dailyword_id: dailywordId });
      if (insErr) toast({ title: "Kunne ikke lagre", description: insErr.message });
      else toast({ title: "Lyd lagret" });
    };
    mediaRecorder.start();
    setRec(mediaRecorder);
    setRecording(true);
  };

  const stop = () => {
    rec?.stop();
    setRecording(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Snakk</CardTitle></CardHeader>
      <CardContent className="flex gap-2">
        {!recording ? (
          <Button onClick={start}>Start opptak</Button>
        ) : (
          <Button variant="destructive" onClick={stop}>Stopp</Button>
        )}
      </CardContent>
    </Card>
  );
};

export default LearnerHome;

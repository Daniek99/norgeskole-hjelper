import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { useDailyWordBundle, useTodayOrLatestWord, useDailyWordsHistory } from "@/hooks/useDailyWords";
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
  const { data: history } = useDailyWordsHistory(me?.classroom_id ?? null, 1, 10);
  const { data: bundle } = useDailyWordBundle(dw?.id, me?.l1 ?? undefined, me?.difficulty_level);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const navigate = useNavigate();

  const l1Translation = useMemo(() =>
    bundle?.translations.find(t => t.language_code === (me?.l1 ?? ""))?.text ?? null
  , [bundle, me?.l1]);

  const tasksForLevel = useMemo(() => (bundle?.tasks ?? []).filter(t => t.level === (me?.difficulty_level ?? 1)), [bundle, me?.difficulty_level]);
  const levelText = useMemo(() => (bundle?.levelTexts ?? []).find(t => t.level === (me?.difficulty_level ?? 1))?.text ?? null, [bundle, me?.difficulty_level]);

  const navigateToPastContent = (dailyWordId: string) => {
    navigate(`/elev/daily-word/${dailyWordId}`);
  };

  return (
    <main className="min-h-screen py-8">
      {/* Top right controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Link to="/elev/profile">
          <Button variant="outline">Min profil</Button>
        </Link>
        <HighContrastToggle />
      </div>

      {/* Centered main content */}
      <div className="container max-w-4xl mx-auto space-y-8">
        {/* Greeting centered at top */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6">Hei, {me?.name ?? "elev"}</h1>
        </div>

        {/* Navigation for past content */}
        {history && history.length > 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Tidligere innhold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {history.filter(h => h.approved).map(h => (
                  <Button 
                    key={h.id} 
                    variant={h.id === dw?.id ? "default" : "outline"}
                    onClick={() => navigateToPastContent(h.id)}
                    className="text-sm"
                  >
                    {h.date}: {h.norwegian}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {dw && (
          <div className="text-center space-y-6">
            {/* Daily word/theme header */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Dagens ord/tema</h2>
              <div className="text-5xl font-extrabold text-primary">
                {dw.theme || dw.norwegian}
              </div>
              {dw.theme && (
                <div className="text-3xl font-semibold text-muted-foreground">
                  {dw.norwegian}
                </div>
              )}
              {l1Translation && (
                <div className="text-2xl text-muted-foreground">
                  {l1Translation}
                </div>
              )}
            </div>

            {/* Audio controls */}
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => speak(dw.norwegian, "no-NO")} size="lg">
                🔊 Spill av (NO)
              </Button>
              {l1Translation && (
                <Button variant="secondary" onClick={() => speak(l1Translation, (me?.l1 ?? "en"))} size="lg">
                  🔊 Spill av (L1)
                </Button>
              )}
              <Button variant="outline" onClick={stopSpeak} size="lg">
                ⏹️ Stopp
              </Button>
            </div>

            {/* AI generated image */}
            {dw.image_url && (
              <div className="flex justify-center">
                <img 
                  src={dw.image_url} 
                  alt={dw.image_alt ?? dw.norwegian} 
                  className="max-w-lg max-h-96 object-cover rounded-lg shadow-lg" 
                  loading="lazy" 
                />
              </div>
            )}
          </div>
        )}

        {/* Reading text */}
        {levelText && (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Les (nivå {me?.difficulty_level})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-lg text-center">{levelText}</p>
            </CardContent>
          </Card>
        )}

        {/* Tasks */}
        {tasksForLevel.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Oppgaver</h2>
            <div className="max-w-2xl mx-auto space-y-4">
              {tasksForLevel.map(task => (
                <InteractiveTaskRenderer 
                  key={task.id} 
                  task={task as any} 
                  onSubmit={async (score, response) => {
                    if (!user) return;
                    const { error } = await supabase.from("task_results").insert({ 
                      task_id: task.id, 
                      learner_id: user.id, 
                      response, 
                      score 
                    });
                    if (error) toast({ title: "Kunne ikke lagre", description: error.message });
                    else toast({ title: "Svar lagret" });
                  }} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Recording functionality */}
        {dw && (
          <div className="max-w-md mx-auto">
            <Recorder dailywordId={dw.id} />
          </div>
        )}
      </div>
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
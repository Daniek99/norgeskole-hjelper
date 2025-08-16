import { useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { useDailyWordBundle } from "@/hooks/useDailyWords";
import { HighContrastToggle } from "@/components/HighContrastToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveTaskRenderer } from "@/components/InteractiveTaskRenderer";
import { speak, stopSpeak } from "@/lib/tts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DailyWordDetail = () => {
  const { dailyWordId } = useParams<{ dailyWordId: string }>();
  const { user } = useAuth();
  const { data: me } = useMe(user?.id);
  const { data: bundle } = useDailyWordBundle(dailyWordId, me?.l1 ?? undefined, me?.difficulty_level);
  const location = useLocation();
  const isTeacher = location.pathname.startsWith('/teacher');

  const dailyWord = useMemo(() => {
    if (!bundle) return null;
    // Get daily word info from the first available data
    const firstTranslation = bundle.translations[0];
    const firstLevelText = bundle.levelTexts[0];
    return {
      norwegian: firstTranslation?.dailyword_id || "",
      theme: null, // We don't have theme in the bundle, could be enhanced
    };
  }, [bundle]);

  const l1Translation = useMemo(() =>
    bundle?.translations.find(t => t.language_code === (me?.l1 ?? ""))?.text ?? null
  , [bundle, me?.l1]);

  const tasksForLevel = useMemo(() => (bundle?.tasks ?? []).filter(t => t.level === (me?.difficulty_level ?? 1)), [bundle, me?.difficulty_level]);
  const levelText = useMemo(() => (bundle?.levelTexts ?? []).find(t => t.level === (me?.difficulty_level ?? 1))?.text ?? null, [bundle, me?.difficulty_level]);

  if (!bundle) {
    return (
      <main className="min-h-screen py-8">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center">
            <p>Laster innhold...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8">
      {/* Top right controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        {isTeacher ? (
          <>
            <Link to="/teacher">
              <Button variant="outline">Tilbake til dashboard</Button>
            </Link>
            <Link to="/teacher/profile">
              <Button variant="outline">Min profil</Button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/elev">
              <Button variant="outline">Tilbake til hjem</Button>
            </Link>
            <Link to="/elev/profile">
              <Button variant="outline">Min profil</Button>
            </Link>
          </>
        )}
        <HighContrastToggle />
      </div>

      {/* Centered main content */}
      <div className="container max-w-4xl mx-auto space-y-8">
        {/* Greeting centered at top */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6">
            {isTeacher ? "Innholdsforhåndsvisning" : "Historisk innhold"}
          </h1>
        </div>

        {bundle && (
          <div className="text-center space-y-6">
            {/* Daily word/theme header */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Ord/tema</h2>
              <div className="text-5xl font-extrabold text-primary">
                {bundle.translations[0]?.text || "Ukjent ord"}
              </div>
              {l1Translation && (
                <div className="text-2xl text-muted-foreground">
                  {l1Translation}
                </div>
              )}
            </div>

            {/* Audio controls */}
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => speak(bundle.translations[0]?.text || "", "no-NO")} size="lg">
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
      </div>
    </main>
  );
};

export default DailyWordDetail;
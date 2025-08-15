import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { useDailyWordsHistory } from "@/hooks/useDailyWords";
import { useLearnerRecordings } from "@/hooks/useLearnerRecordings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { data: me } = useMe(user?.id);
  const { data: history } = useDailyWordsHistory(me?.classroom_id ?? null, 1, 20);

  const [norwegian, setNorwegian] = useState("");
  const [theme, setTheme] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));

  const generate = async (demo = false) => {
    if (!me?.classroom_id) return toast({ title: "Mangler klasserom" });
    const { data, error } = await supabase.functions.invoke("onCreateDailyWord", {
      body: { classroom_id: me.classroom_id, norwegian, theme: theme || null, date, demo },
    });
    if (error) return toast({ title: "Generering feilet", description: error.message });
    toast({ title: "Innhold generert" });
  };

  const approve = async (dailyword_id: string) => {
    const { error } = await supabase.functions.invoke("approveDailyWord", { body: { dailyword_id } });
    if (error) return toast({ title: "Publisering feilet", description: error.message });
    toast({ title: "Publisert" });
  };

  return (
    <main className="min-h-screen container py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Lærer</h1>
        <Link to="/teacher/profile">
          <Button variant="outline">Min profil</Button>
        </Link>
      </div>
      <Tabs defaultValue="dagens">
        <TabsList className="mb-4">
          <TabsTrigger value="dagens">Dagens ord</TabsTrigger>
          <TabsTrigger value="historikk">Historikk</TabsTrigger>
          <TabsTrigger value="elever">Elever</TabsTrigger>
          <TabsTrigger value="videoer">Videoer</TabsTrigger>
        </TabsList>

        <TabsContent value="dagens">
          <Card>
            <CardHeader><CardTitle>Opprett dagens ord</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Norsk</Label>
                <Input value={norwegian} onChange={(e)=>setNorwegian(e.target.value)} placeholder="ord/tema" />
              </div>
              <div className="grid gap-2">
                <Label>Tema (valgfritt)</Label>
                <Input value={theme} onChange={(e)=>setTheme(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Dato</Label>
                <Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
              </div>
              <div className="md:col-span-3 flex gap-2">
                <Button onClick={()=>generate(false)}>Generer innhold</Button>
                <Button variant="outline" onClick={()=>generate(true)}>Demo (uten nøkler)</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historikk">
          <div className="grid md:grid-cols-2 gap-4">
            {history?.map(dw => (
              <Card key={dw.id}>
                <CardHeader>
                  <CardTitle>{dw.date}: {dw.norwegian}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  {dw.image_url && <img src={dw.image_url} alt={dw.image_alt ?? dw.norwegian} className="w-24 h-24 object-cover rounded-md" loading="lazy" />}
                  <div className="space-x-2">
                    {!dw.approved && <Button onClick={()=>approve(dw.id)}>Godkjenn & Publiser</Button>}
                    <Link to={`/teacher/daily-word/${dw.id}`}>
                      <Button variant="outline">Se innhold</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="elever">
          <LearnerManager classroomId={me?.classroom_id} />
        </TabsContent>

        <TabsContent value="videoer">
          <VideosManager />
        </TabsContent>
      </Tabs>
    </main>
  );
};

const LearnerManager = ({ classroomId }: { classroomId?: string | null }) => {
  const [learners, setLearners] = useState<any[]>([]);

  const loadLearners = async () => {
    if (!classroomId) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,difficulty_level,l1")
      .eq("classroom_id", classroomId)
      .eq("role", "learner")
      .order("name");
    if (!error) setLearners(data ?? []);
  };

  const updateLearnerLevel = async (learnerId: string, newLevel: number) => {
    const { error } = await supabase
      .from("profiles")
      .update({ difficulty_level: newLevel })
      .eq("id", learnerId);
    if (error) return toast({ title: "Oppdatering feilet", description: error.message });
    toast({ title: "Nivå oppdatert" });
    loadLearners();
  };

  useEffect(() => { loadLearners(); }, [classroomId]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Elever i klassen</h3>
      <div className="grid gap-4">
        {learners.map(learner => (
          <Card key={learner.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{learner.name}</span>
                <div className="flex items-center gap-2">
                  <Label>Nivå:</Label>
                  <Select 
                    value={learner.difficulty_level.toString()} 
                    onValueChange={(value) => updateLearnerLevel(learner.id, parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Morsmål: {learner.l1 || "Ikke angitt"}
              </p>
              <LearnerRecordings learnerId={learner.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const LearnerRecordings = ({ learnerId }: { learnerId: string }) => {
  const { data: recordings } = useLearnerRecordings(learnerId);

  return (
    <div className="space-y-2">
      <h4 className="font-medium">Lydopptak ({recordings?.length || 0})</h4>
      <div className="grid gap-2 max-h-32 overflow-y-auto">
        {recordings?.slice(0, 5).map(recording => (
          <div key={recording.id} className="flex items-center gap-2 p-2 bg-muted rounded">
            <audio controls className="flex-1 h-8">
              <source src={recording.audio_url} type="audio/webm" />
            </audio>
            <span className="text-xs text-muted-foreground">
              {new Date(recording.created_at).toLocaleDateString('no')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const VideosManager = () => {
  const { user } = useAuth();
  const { data: me } = useMe(user?.id);
  const [url, setUrl] = useState("");
  const [list, setList] = useState<any[]>([]);

  const load = async () => {
    if (!me?.classroom_id) return;
    const { data, error } = await supabase
      .from("videos")
      .select("id,title,url,created_at")
      .eq("classroom_id", me.classroom_id)
      .order("created_at", { ascending: false });
    if (!error) setList(data ?? []);
  };

  const add = async () => {
    if (!me?.classroom_id || !url) return;
    const title = "Video";
    const { error } = await supabase.from("videos").insert({ title, url, classroom_id: me.classroom_id });
    if (error) return toast({ title: "Kunne ikke lagre", description: error.message });
    setUrl("");
    toast({ title: "Lagt til" });
    load();
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder="YouTube/Vimeo URL" value={url} onChange={(e)=>setUrl(e.target.value)} />
        <Button onClick={add}>Lagre</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map(v => (
          <div key={v.id} className="aspect-video rounded-md overflow-hidden border">
            <iframe className="w-full h-full" src={v.url} title={v.title} allowFullScreen loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherDashboard;
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { useDailyWordsHistory } from "@/hooks/useDailyWords";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <h1 className="text-2xl font-bold mb-4">Lærer</h1>
      <Tabs defaultValue="dagens">
        <TabsList className="mb-4">
          <TabsTrigger value="dagens">Dagens ord</TabsTrigger>
          <TabsTrigger value="historikk">Historikk</TabsTrigger>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videoer">
          <VideosManager />
        </TabsContent>
      </Tabs>
    </main>
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

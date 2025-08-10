import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";


const L1_OPTIONS = [
  { code: "en", name: "Engelsk" },
  { code: "ar", name: "Arabisk" },
  { code: "uk", name: "Ukrainsk" },
  { code: "so", name: "Somali" },
  { code: "tr", name: "Tyrkisk" },
  { code: "fa", name: "Farsi" },
  { code: "pl", name: "Polsk" },
  { code: "other", name: "Annet" },
];

const AuthGate = () => {
  const [role, setRole] = useState<"teacher" | "learner" | null>(null);
  const [invite, setInvite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [l1, setL1] = useState("en");
  const navigate = useNavigate();

  // Smooth redirect if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role === "teacher") navigate("/teacher");
      else if (profile?.role === "learner") navigate("/elev");
      else if (profile?.role === "admin") navigate("/admin");
    });
  }, []);

  const goInvite = () => {
    if (!invite) return toast({ title: "Skriv inn invitasjonskode" });
    navigate(`/invite/${invite}`);
  };
  const teacherLogin = async () => {
    if (!email || !password) return toast({ title: "Fyll inn e-post og passord" });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return toast({ title: "Innlogging feilet", description: error.message });

    // If invite code provided, finalize teacher linkage
    if (invite) {
      const { error: rpcErr } = await supabase.rpc("register_with_invite", {
        invite_code: invite,
        name: name || email.split("@")[0],
        l1_code: null,
        want_role: "teacher",
      });
      if (rpcErr) {
        toast({ title: "Invitasjon feilet", description: rpcErr.message });
      }
    }

    navigate("/teacher");
  };

  const teacherSignUp = async () => {
    if (!email || !password) return toast({ title: "Fyll inn e-post og passord" });
    const redirectUrl = `${window.location.origin}/teacher`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) return toast({ title: "Registrering feilet", description: error.message });
    toast({ title: "Sjekk e-posten for å bekrefte" });
  };

  const learnerSignUp = async () => {
    if (!invite) return toast({ title: "Invitasjonskode mangler" });
    if (!name || !password) return toast({ title: "Navn og passord er påkrevd" });
    const stubEmail = `${crypto.randomUUID()}@noemail.local`;
    const { data, error } = await supabase.auth.signUp({ email: stubEmail, password });
    if (error || !data.user) return toast({ title: "Registrering feilet", description: error?.message });

    const { error: rpcErr } = await supabase.rpc("register_with_invite", {
      invite_code: invite,
      name,
      l1_code: l1 === "other" ? null : l1,
      want_role: "learner",
    });
    if (rpcErr) return toast({ title: "Kunne ikke bruke invitasjon", description: rpcErr.message });
    navigate("/elev");
  };

  return (
    <main className="min-h-screen bg-hero">
      <section className="container py-10">
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <h1 className="text-3xl font-bold">Velkommen til NorskA2-Prelit</h1>
          <p className="text-muted-foreground">Velg rolle og skriv inn invitasjonskode for å komme i gang.</p>

          <div className="flex gap-2 justify-center">
            <Button variant={role === "teacher" ? "hero" : "secondary"} onClick={() => setRole("teacher")}>Jeg er lærer</Button>
            <Button variant={role === "learner" ? "hero" : "secondary"} onClick={() => setRole("learner")}>Jeg er elev</Button>
          </div>

          <div className="flex gap-2 justify-center">
            <Input placeholder="Invitasjonskode" value={invite} onChange={(e) => setInvite(e.target.value)} />
            <Button variant="outline" onClick={goInvite}>Fortsett</Button>
          </div>

          {role === "teacher" && (
            <Card>
              <CardHeader>
                <CardTitle>Lærer – e-post og passord</CardTitle>
                <CardDescription>Logg inn eller registrer ny konto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 text-left">
                  <Label htmlFor="email">E-post</Label>
                  <Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
                </div>
                <div className="grid gap-2 text-left">
                  <Label htmlFor="pw">Passord</Label>
                  <Input id="pw" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={teacherLogin}>Logg inn</Button>
                  <Button variant="outline" onClick={teacherSignUp}>Registrer</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {role === "learner" && (
            <Card>
              <CardHeader>
                <CardTitle>Elev – rask registrering</CardTitle>
                <CardDescription>Kun navn, passord og morsmål</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 text-left">
                  <Label htmlFor="name">Navn</Label>
                  <Input id="name" value={name} onChange={(e)=>setName(e.target.value)} />
                </div>
                <div className="grid gap-2 text-left">
                  <Label htmlFor="pw2">Passord</Label>
                  <Input id="pw2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
                </div>
                <div className="grid gap-2 text-left">
                  <Label htmlFor="l1">Morsmål</Label>
                  <select id="l1" className="h-10 rounded-md border bg-background px-3" value={l1} onChange={(e)=>setL1(e.target.value)}>
                    {L1_OPTIONS.map(o=> <option key={o.code} value={o.code}>{o.name}</option>)}
                  </select>
                </div>
                <Button variant="hero" onClick={learnerSignUp}>Fortsett</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
};

export default AuthGate;

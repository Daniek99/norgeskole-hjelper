// src/pages/InvitePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "teacher" | "learner" | "admin";

export default function InvitePage() {
  const { code } = useParams(); // URL-param: /invite/:code
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Teacher fields
  const [tName, setTName] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [tPass, setTPass] = useState("");

  // Learner fields
  const [lName, setLName] = useState("");
  const [lPass, setLPass] = useState("");
  const [l1, setL1] = useState("");

  // ------------------------------------------------------------------
  // Hent rollen for invitasjonskoden ved å slå opp i admin_invite_links
  // ------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      if (!code) return;
      setLoading(true);
      setError(null);
      console.log("Slår opp invitasjon for kode:", code);
      const { data, error } = await supabase
        .from("admin_invite_links")
        .select("role")
        .eq("code", code)
        .eq("active", true)
        .maybeSingle();

      console.log("InvitePage check result:", { data, error });

      if (error) {
        console.error("Database error:", error);
        setError("Feil ved oppslag av invitasjon.");
        setRole(null);
      } else if (!data) {
        console.log("No invite found for code:", code);
        setError("Ugyldig eller inaktiv invitasjon.");
        setRole(null);
      } else {
        setRole(data.role as Role);
      }
      setLoading(false);
    })();
  }, [code]);

  const isTeacher = role === "teacher";
  const isLearner = role === "learner";

  // Opprett/bruk sesjon: prøv login, hvis ikke -> sign up
  async function ensureSessionEmail(email: string, password: string) {
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!signInErr) return;

    const { error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpErr) throw signUpErr;

    // Better wait: Poll for session with timeout (replaced fixed delay)
    let attempts = 0;
    while (attempts < 10) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return;
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5s interval, max 5s
      attempts++;
    }
    throw new Error("Session not created after timeout");
  }

  // -----------------------------
  // Fortsett for lærer
  // -----------------------------
  async function handleTeacherContinue() {
  try {
    if (!code) return;
    if (!tEmail || !tPass) {
      setError("E-post og passord er påkrevd.");
      return;
    }
    setLoading(true);
    await ensureSessionEmail(tEmail, tPass);

    console.log("Before RPC call with code:", code, "name:", tName || tEmail.split("@")[0]);
    const { error: rpcErr } = await supabase.rpc("register_with_invite", {
      invite_code: code,
      name: tName || tEmail.split("@")[0],
      l1_code: null,
      want_role: "teacher",
    });
    if (rpcErr) throw rpcErr;
    console.log("RPC succeeded, refreshing session");

    // Refresh session and profile
    await supabase.auth.refreshSession();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle(); // Ensure client cache updates
    }

    // Force page reload to clear state and trigger proper routing
    window.location.href = "/teacher";
  } catch (e: any) {
    console.error("Teacher continue error:", e);
    setError(e.message ?? "Noe gikk galt ved lærer-registrering.");
  } finally {
    setLoading(false);
  }
}

  // -----------------------------
  // Fortsett for elev
  // -----------------------------
  async function handleLearnerContinue() {
    try {
      if (!code) return;
      if (!lName || !lPass) {
        setError("Navn og passord er påkrevd."); // Added basic validation
        return;
      }
      setLoading(true);

      // Elever bruker “stub” e-post (ingen bekreftelse trengs)
      const stub = `${crypto.randomUUID()}@noemail.local`;
      await ensureSessionEmail(stub, lPass);

      const { error: rpcErr } = await supabase.rpc("register_with_invite", {
        invite_code: code,
        name: lName,
        l1_code: l1 || null,
        want_role: "learner",
      });
      if (rpcErr) throw rpcErr;

    // Force page reload to clear state and trigger proper routing
    window.location.href = "/elev";
    } catch (e: any) {
      console.error("Learner continue error:", e); // Added console logging for debug
      setError(e.message ?? "Noe gikk galt ved elev-registrering.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-xl p-8 text-center">Laster…</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <h2 className="text-2xl font-semibold mb-4">Invitasjon</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => navigate("/")}>Til forsiden</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-8">
      <h2 className="text-3xl font-bold mb-2">Invitasjon</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Kode: <span className="font-mono">{code}</span>
      </p>

      {isTeacher && (
        <div className="space-y-4">
          <p>
            Denne invitasjonen er for rollen: <b>lærer</b>
          </p>

          <div className="space-y-2">
            <Label>Navn</Label>
            <Input value={tName} onChange={(e) => setTName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-post</Label>
            <Input value={tEmail} onChange={(e) => setTEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Passord</Label>
            <Input
              type="password"
              value={tPass}
              onChange={(e) => setTPass(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleTeacherContinue}
            disabled={loading}
          >
            {loading ? "Sender…" : "Fortsett som lærer"}
          </Button>
        </div>
      )}

      {isLearner && (
        <div className="space-y-4">
          <p>
            Denne invitasjonen er for rollen: <b>elev</b>
          </p>

          <div className="space-y-2">
            <Label>Navn</Label>
            <Input value={lName} onChange={(e) => setLName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Passord</Label>
            <Input
              type="password"
              value={lPass}
              onChange={(e) => setLPass(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Morsmål (L1)</Label>
            <Input
              value={l1}
              onChange={(e) => setL1(e.target.value)}
              placeholder="ar / so / fa / ps / ..."
            />
          </div>

          <Button
            className="w-full"
            onClick={handleLearnerContinue}
            disabled={loading}
          >
            {loading ? "Sender…" : "Fortsett som elev"}
          </Button>
        </div>
      )}

      {!isTeacher && !isLearner && <div>Ukjent rolle i invitasjonen.</div>}
    </div>
  );
}
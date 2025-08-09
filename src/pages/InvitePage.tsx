// src/pages/InvitePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "teacher" | "learner" | "admin";

export default function InvitePage() {
  const { code } = useParams();
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

  useEffect(() => {
    let active = true;
    (async () => {
      if (!code) return;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("admin_invite_links")
        .select("for_role, active")
        .eq("invite_code", code)
        .maybeSingle();

      if (!active) return;
      if (error || !data || !data.active) {
        setError("Ugyldig eller inaktiv invitasjon.");
        setRole(null);
      } else {
        setRole(data.for_role as Role);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [code]);

  const isTeacher = role === "teacher";
  const isLearner = role === "learner";

  async function ensureSessionEmail(email: string, password: string) {
    // Try sign in; if user doesn't exist, sign up
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
  }

  async function handleTeacherContinue() {
    try {
      if (!code) return;
      setLoading(true);
      await ensureSessionEmail(tEmail, tPass);
      // attach to classroom + role
      const { error: rpcErr } = await supabase.rpc("register_with_invite", {
        invite_code: code,
        name: tName || tEmail.split("@")[0],
        l1_code: null,
        want_role: "teacher",
      });
      if (rpcErr) throw rpcErr;
      navigate("/teacher");
    } catch (e: any) {
      setError(e.message ?? "Noe gikk galt ved lærer-registrering.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLearnerContinue() {
    try {
      if (!code) return;
      setLoading(true);
      // learners use stub email
      const stub = `${crypto.randomUUID()}@noemail.local`;
      await ensureSessionEmail(stub, lPass);
      const { error: rpcErr } = await supabase.rpc("register_with_invite", {
        invite_code: code,
        name: lName,
        l1_code: l1 || null,
        want_role: "learner",
      });
      if (rpcErr) throw rpcErr;
      navigate("/elev");
    } catch (e: any) {
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
          <p>Denne invitasjonen er for rollen: <b>lærer</b></p>

          <div className="space-y-2">
            <Label>Navn</Label>
            <Input value={tName} onChange={e => setTName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E‑post</Label>
            <Input value={tEmail} onChange={e => setTEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Passord</Label>
            <Input type="password" value={tPass} onChange={e => setTPass(e.target.value)} />
          </div>

          <Button className="w-full" onClick={handleTeacherContinue} disabled={loading}>
            {loading ? "Sender…" : "Fortsett som lærer"}
          </Button>
        </div>
      )}

      {isLearner && (
        <div className="space-y-4">
          <p>Denne invitasjonen er for rollen: <b>elev</b></p>

          <div className="space-y-2">
            <Label>Navn</Label>
            <Input value={lName} onChange={e => setLName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Passord</Label>
            <Input type="password" value={lPass} onChange={e => setLPass(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Morsmål (L1)</Label>
            <Input value={l1} onChange={e => setL1(e.target.value)} placeholder="ar / so / fa / ps / ..." />
          </div>

          <Button className="w-full" onClick={handleLearnerContinue} disabled={loading}>
            {loading ? "Sender…" : "Fortsett som elev"}
          </Button>
        </div>
      )}

      {!isTeacher && !isLearner && (
        <div>Ukjent rolle i invitasjonen.</div>
      )}
    </div>
  );
}

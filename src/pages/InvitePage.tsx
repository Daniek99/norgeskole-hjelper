import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const InvitePage = () => {
  const { code } = useParams();
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase
        .from("admin_invite_links")
        .select("for_role")
        .eq("invite_code", code)
        .eq("active", true)
        .maybeSingle();
      setRole((data as any)?.for_role ?? null);
    };
    run();
  }, [code]);

  return (
    <main className="min-h-screen grid place-items-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Invitasjon</CardTitle>
          <CardDescription>Kode: {code}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {role ? (
            <>
              <p>Denne invitasjonen er for rollen: <strong>{role}</strong></p>
              <Button onClick={() => navigate("/")}>Fortsett</Button>
            </>
          ) : (
            <p>Ugyldig eller inaktiv invitasjon.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default InvitePage;

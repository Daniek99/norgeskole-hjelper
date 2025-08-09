import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [invites, setInvites] = useState<any[]>([]);

  const load = async () => {
    const { data, error } = await supabase
      .from("admin_invite_links")
      .select("id,invite_code,active,for_role,created_at");
    if (error) return; // RLS might block if not admin
    setInvites(data ?? []);
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="container py-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin</h1>
      <Card>
        <CardHeader><CardTitle>Invitasjonslenker</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {invites.length === 0 && <p>Ingen invitasjoner å vise.</p>}
          <ul className="space-y-2">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2">
                <span>{i.for_role} – {i.invite_code}</span>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/invite/${i.invite_code}`);
                    toast({ title: "Lenke kopiert" });
                  }}
                >
                  Kopier lenke
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
};

export default AdminDashboard;

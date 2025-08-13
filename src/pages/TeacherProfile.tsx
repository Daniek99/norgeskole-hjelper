import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { HighContrastToggle } from "@/components/HighContrastToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const TeacherProfile = () => {
  const { user } = useAuth();
  const { data: me, refetch } = useMe(user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(me?.name || "");

  const handleSave = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", user.id);
      
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke oppdatere profil" });
    } else {
      toast({ title: "Lagret", description: "Profil oppdatert" });
      setIsEditing(false);
      refetch();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!me) {
    return <div className="mx-auto max-w-xl p-8 text-center">Laster…</div>;
  }

  return (
    <main className="min-h-screen py-8">
      {/* Top controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Link to="/teacher">
          <Button variant="outline">Tilbake til dashboard</Button>
        </Link>
        <HighContrastToggle />
      </div>

      {/* Main content */}
      <div className="container max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Min profil</h1>
          <p className="text-muted-foreground">Administrer din lærerkonto</p>
        </div>

        {/* Profile Settings */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profilinnstillinger</CardTitle>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Rediger
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Navn</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ditt navn"
                />
              ) : (
                <p className="text-lg">{me.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>E-post</Label>
              <p className="text-lg">{me.email || "Ikke angitt"}</p>
            </div>

            <div className="grid gap-2">
              <Label>Rolle</Label>
              <Badge variant="secondary" className="w-fit">
                {me.role === "teacher" ? "Lærer" : me.role === "admin" ? "Administrator" : me.role}
              </Badge>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave}>Lagre endringer</Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setName(me.name);
                  }}
                >
                  Avbryt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Classroom Info */}
        {me.classroom_id && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Klasseromsinformasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Klasserom ID</p>
                <p className="text-lg font-mono">{me.classroom_id}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Actions */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Kontohandlinger</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="destructive">
              Logg ut
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default TeacherProfile;
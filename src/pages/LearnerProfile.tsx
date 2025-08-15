import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { useLearnerRecordings } from "@/hooks/useLearnerRecordings";
import { HighContrastToggle } from "@/components/HighContrastToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const L1_OPTIONS = [
  { code: "en", name: "Engelsk" },
  { code: "ar", name: "Arabisk" },
  { code: "uk", name: "Ukrainsk" },
  { code: "so", name: "Somali" },
  { code: "tr", name: "Tyrkisk" },
  { code: "fa", name: "Farsi" },
  { code: "pl", name: "Polsk" },
];

const LearnerProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: me, isLoading: profileLoading, refetch } = useMe(user?.id);
  const { data: recordings, isLoading: recordingsLoading } = useLearnerRecordings(user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [l1, setL1] = useState("en");
  const [difficultyLevel, setDifficultyLevel] = useState(1);

  // Update form state when profile data loads
  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setL1(me.l1 || "en");
      setDifficultyLevel(me.difficulty_level || 1);
    }
  }, [me]);

  const handleSave = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        l1,
        difficulty_level: difficultyLevel,
      })
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

  if (authLoading || profileLoading) {
    return <div className="mx-auto max-w-xl p-8 text-center">Laster…</div>;
  }

  if (!user || !me) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <p>Kunne ikke laste profil. <Link to="/elev">Gå tilbake</Link></p>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8">
      {/* Top controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Link to="/elev">
          <Button variant="outline">Tilbake til hjem</Button>
        </Link>
        <HighContrastToggle />
      </div>

      {/* Main content */}
      <div className="container max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Min profil</h1>
          <p className="text-muted-foreground">Administrer din konto og innstillinger</p>
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
              <Label htmlFor="l1">Morsmål</Label>
              {isEditing ? (
                <Select value={l1} onValueChange={setL1}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {L1_OPTIONS.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg">
                  {L1_OPTIONS.find(o => o.code === me.l1)?.name || "Ikke angitt"}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="level">Vanskelighetsgrad</Label>
              {isEditing ? (
                <Select value={difficultyLevel.toString()} onValueChange={(v) => setDifficultyLevel(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nivå 1 (Begynner)</SelectItem>
                    <SelectItem value="2">Nivå 2 (Middels)</SelectItem>
                    <SelectItem value="3">Nivå 3 (Avansert)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg">Nivå {me.difficulty_level}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Rolle</Label>
              <Badge variant="secondary" className="w-fit">
                {me.role === "learner" ? "Elev" : me.role}
              </Badge>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave}>Lagre endringer</Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setName(me.name || "");
                    setL1(me.l1 || "en");
                    setDifficultyLevel(me.difficulty_level || 1);
                  }}
                >
                  Avbryt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Mine statistikker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {recordingsLoading ? "..." : (recordings?.length || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Lydopptak</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{me.difficulty_level}</p>
                <p className="text-sm text-muted-foreground">Nåværende nivå</p>
              </div>
            </div>
          </CardContent>
        </Card>

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

export default LearnerProfile;
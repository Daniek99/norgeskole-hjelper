import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthGate from "./AuthGate";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.role === "admin") navigate("/admin");
        else if (profile?.role === "teacher") navigate("/teacher");
        else if (profile?.role === "learner") navigate("/elev");
        else setIsAuthenticated(false);
      } else {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  if (isAuthenticated === null) {
    return <div className="mx-auto max-w-xl p-8 text-center">Laster…</div>;
  }

  return <AuthGate />;
};

export default Index;

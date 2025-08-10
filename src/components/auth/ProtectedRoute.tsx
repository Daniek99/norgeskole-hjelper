import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  role: "teacher" | "learner" | "admin";
}

export const ProtectedRoute = ({ role }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

useEffect(() => {
  const fetchUserRole = async () => {
    console.log("Fetching user role...");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log("User found, fetching profile:", user.id);
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error) console.error("Profile fetch error:", error);
      setUserRole(profile?.role || null);
      console.log("User role set to:", profile?.role);
    } else {
      console.log("No user found");
    }
    setLoading(false);
  };
  fetchUserRole();
}, []);

  if (loading) {
    return <div className="mx-auto max-w-xl p-8 text-center">Laster…</div>;
  }

  if (!userRole || userRole !== role) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
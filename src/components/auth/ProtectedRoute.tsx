import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { Loader2 } from "lucide-react";

interface Props { role: "teacher" | "learner" | "admin" }

export const ProtectedRoute = ({ role }: Props) => {
  const { user, loading } = useAuth();
  const { data: me, isLoading } = useMe(user?.id);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!me) return <Navigate to="/" replace />;
  if (me.role !== role) {
    if (me.role === "teacher" || me.role === "admin") return <Navigate to="/teacher" replace />;
    return <Navigate to="/elev" replace />;
  }
  return <Outlet />;
};

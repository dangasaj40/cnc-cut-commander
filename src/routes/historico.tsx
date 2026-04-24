import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import HistoricoPage from "@/features/Historico";

export const Route = createFileRoute("/historico")({ component: Page });
function Page() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <AppShell><HistoricoPage /></AppShell>;
}

import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import ProducaoPage from "@/features/Producao";

export const Route = createFileRoute("/producao")({ component: Page });
function Page() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <AppShell><ProducaoPage /></AppShell>;
}

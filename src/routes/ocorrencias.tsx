import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import OcorrenciasPage from "@/features/Ocorrencias";

export const Route = createFileRoute("/ocorrencias")({ component: Page });
function Page() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <AppShell><OcorrenciasPage /></AppShell>;
}

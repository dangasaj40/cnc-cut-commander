import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import OperadoresPage from "@/features/Operadores";

export const Route = createFileRoute("/operadores")({ component: Page });
function Page() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <AppShell><OperadoresPage /></AppShell>;
}

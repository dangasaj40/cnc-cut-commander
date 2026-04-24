import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import Dashboard from "@/features/Dashboard";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { user, loading } = useAuth();
  if (loading) return <BootSplash />;
  if (!user) return <Navigate to="/login" />;
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function BootSplash() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-[10px] tracking-[0.3em] text-laser uppercase animate-pulse">// INITIALIZING</div>
        <div className="mt-3 text-xs text-muted-foreground tracking-widest">PLASMA CONTROL</div>
      </div>
    </div>
  );
}

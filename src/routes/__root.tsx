import { createRootRoute, Link, Outlet, useRouter, useRouterState, Navigate } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { useEffect } from "react";

export const Route = createRootRoute({
  component: RootWrapper,
});

function RootWrapper() {
  return (
    <AuthProvider>
      <RootComponent />
    </AuthProvider>
  );
}

function RootComponent() {
  const { user, loading, roles } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    // PWA disabled for stability
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isAuthPage = path === "/login" || path === "/reset-password";

  if (!user && !isAuthPage) {
    return <Navigate to="/login" />;
  }

  // Trava para Visualizadores (não podem ver produção, equipe ou alertas)
  const isViewer = !user?.email?.includes("@admin") && roles.includes("viewer") && !roles.includes("admin") && !roles.includes("supervisor");
  const restrictedPaths = ["/producao", "/operadores", "/catalogo", "/configuracoes"];
  
  if (isViewer && restrictedPaths.some(p => path.startsWith(p))) {
    return <Navigate to="/" />;
  }

  if (user && !isAuthPage) {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    );
  }

  return <Outlet />;
}

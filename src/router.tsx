import { createRouter, useRouter, Link } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <div className="max-w-md text-center border border-destructive/40 p-6">
        <div className="text-[10px] tracking-[0.25em] text-destructive uppercase mb-2">// SYSTEM_FAULT</div>
        <h1 className="text-xl font-bold uppercase tracking-tight">Erro inesperado</h1>
        <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
        <div className="mt-5 flex gap-2 justify-center">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="bg-laser text-primary-foreground px-4 py-2 text-xs uppercase tracking-widest font-bold"
          >Tentar novamente</button>
          <Link to="/" className="border border-steel-light px-4 py-2 text-xs uppercase tracking-widest">Início</Link>
        </div>
      </div>
    </div>
  );
}

export const getRouter = () => createRouter({
  routeTree,
  context: {},
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: DefaultErrorComponent,
});

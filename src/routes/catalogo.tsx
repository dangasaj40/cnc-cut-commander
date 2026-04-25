import { createFileRoute } from "@tanstack/react-router";
import CatalogoPage from "@/features/Catalogo";

export const Route = createFileRoute("/catalogo")({
  component: () => <CatalogoPage />,
});

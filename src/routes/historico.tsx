import { createFileRoute } from "@tanstack/react-router";
import HistoricoPage from "@/features/Historico";

export const Route = createFileRoute("/historico")({ 
  component: HistoricoPage 
});

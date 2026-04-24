import { createFileRoute } from "@tanstack/react-router";
import ProducaoPage from "@/features/Producao";

export const Route = createFileRoute("/producao")({ 
  component: ProducaoPage 
});

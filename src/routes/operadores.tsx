import { createFileRoute } from "@tanstack/react-router";
import RankingOperadores from "@/features/RankingOperadores";

export const Route = createFileRoute("/operadores")({ 
  component: RankingOperadores 
});

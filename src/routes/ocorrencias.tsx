import { createFileRoute } from "@tanstack/react-router";
import OcorrenciasPage from "@/features/Ocorrencias";

export const Route = createFileRoute("/ocorrencias")({ 
  component: OcorrenciasPage 
});

import { createFileRoute } from "@tanstack/react-router";
import OperadoresPage from "@/features/Operadores";

export const Route = createFileRoute("/operadores")({ 
  component: OperadoresPage 
});

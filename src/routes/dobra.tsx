import { createFileRoute } from "@tanstack/react-router";
import DobraPage from "@/features/Dobra";

export const Route = createFileRoute("/dobra")({
  component: DobraPage,
});

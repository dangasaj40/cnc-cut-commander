import { createFileRoute } from "@tanstack/react-router";
import DobraPublic from "@/features/DobraPublic";

export const Route = createFileRoute("/shared/dobra")({
  component: DobraPublic,
});

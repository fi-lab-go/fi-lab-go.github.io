import { createFileRoute } from "@tanstack/react-router";
import SchedulePage from "@/components/lab/SchedulePage";

export const Route = createFileRoute("/estudiante/")({
  component: SchedulePage,
});
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(dashboard)/dashboard/sync-profiles")({
  component: CalendarsLayout,
});

function CalendarsLayout() {
  return <Outlet />;
}

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(dashboard)/dashboard/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}

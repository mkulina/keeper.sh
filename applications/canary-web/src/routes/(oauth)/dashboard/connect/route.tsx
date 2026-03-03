import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(oauth)/dashboard/connect")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}

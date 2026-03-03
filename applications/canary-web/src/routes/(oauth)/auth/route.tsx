import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(oauth)/auth")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}

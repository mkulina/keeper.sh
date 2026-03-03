import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(dashboard)")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col items-center min-h-dvh px-2 pb-12 pt-[min(6rem,25vh)]">
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}

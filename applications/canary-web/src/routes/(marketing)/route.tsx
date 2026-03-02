import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/(marketing)')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="ha">
    <Outlet />
  </div>
}

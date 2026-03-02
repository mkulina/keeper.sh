import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/(marketing)/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <h1>Run up!</h1>
  </div>
}

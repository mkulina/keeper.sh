import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <body className="min-h-screen">
      {children}
    </body>
  )
}

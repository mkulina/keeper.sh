import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <html>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}

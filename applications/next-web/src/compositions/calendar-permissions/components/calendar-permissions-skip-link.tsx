import type { FC, PropsWithChildren } from "react"
import Link from "next/link"
import { Copy } from "@/components/copy"

type CalendarPermissionsSkipLinkProps = {
  href: string
}

export const CalendarPermissionsSkipLink: FC<PropsWithChildren<CalendarPermissionsSkipLinkProps>> = ({ href, children }) => {
  return (
    <Link href={href} className="text-center underline pt-2 opacity-80 hover:opacity-100 active:brightness-80">
      <Copy>{children}</Copy>
    </Link>
  )
}

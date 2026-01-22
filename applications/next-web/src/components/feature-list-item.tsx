import type { FC, PropsWithChildren } from "react"
import { Check } from "lucide-react"
import { Copy } from "./copy"

export const FeatureListItem: FC<PropsWithChildren> = ({ children }) => {
  return (
    <li className="flex flex-row-reverse justify-between items-center gap-2">
      <Check className="shrink-0 text-foreground-subtle" size={16} />
      <Copy>{children}</Copy>
    </li>
  )
}

import type { FC, PropsWithChildren } from "react"

export const FeatureList: FC<PropsWithChildren> = ({ children }) => {
  return <ul className="flex flex-col gap-1">{children}</ul>
}

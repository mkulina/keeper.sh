import type { FC, ReactNode } from "react";
import { cn } from "../utils/cn";
import { Heading2 } from "./heading";
import { Copy } from "./copy";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const SectionHeader: FC<SectionHeaderProps> = ({
  title,
  description,
  action,
  className,
}) => (
  <div className={cn("flex flex-col gap-2", className)}>
    {action ? (
      <div className="flex justify-between items-center">
        <Heading2>{title}</Heading2>
        {action}
      </div>
    ) : (
      <Heading2>{title}</Heading2>
    )}
    {description && <Copy className="text-xs">{description}</Copy>}
  </div>
);

SectionHeader.displayName = "SectionHeader";

export { SectionHeader };
export type { SectionHeaderProps };

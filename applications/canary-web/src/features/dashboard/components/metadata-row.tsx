import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { Link } from "@tanstack/react-router";
import {
  NavigationMenuItem,
  NavigationMenuItemIcon,
} from "../../../components/ui/composites/navigation-menu/navigation-menu-items";
import { Text } from "../../../components/ui/primitives/text";

interface MetadataRowProps {
  label: string;
  value?: string;
  icon?: ReactNode;
  truncate?: boolean;
  to?: ComponentPropsWithoutRef<typeof Link>["to"];
}

export function MetadataRow({ label, value, icon, truncate = false, to }: MetadataRowProps) {
  return (
    <NavigationMenuItem to={to}>
      <Text size="sm" tone="muted" className="shrink-0">{label}</Text>
      {value && (
        <div className={truncate ? "ml-auto min-w-0 overflow-hidden" : "ml-auto overflow-hidden"}>
          <Text size="sm" tone="muted" className={truncate ? "truncate" : undefined}>{value}</Text>
        </div>
      )}
      {icon && <div className="ml-auto shrink-0"><NavigationMenuItemIcon>{icon}</NavigationMenuItemIcon></div>}
    </NavigationMenuItem>
  );
}

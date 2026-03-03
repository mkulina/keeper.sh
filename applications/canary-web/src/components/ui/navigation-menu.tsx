import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import { createContext, use } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "tailwind-variants/lite";
import { Text } from "./text";

const navigationMenu = tv({
  base: "flex flex-col rounded-2xl overflow-hidden p-0.5",
  variants: {
    variant: {
      default: "bg-background-elevated border border-border-elevated shadow-xs",
      highlight: "bg-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type MenuVariant = VariantProps<typeof navigationMenu>["variant"];

const MenuVariantContext = createContext<MenuVariant>("default");
const ItemIsLinkContext = createContext(false);

const navigationMenuItem = tv({
  base: "rounded-xl flex items-center justify-between p-3 w-full hover:cursor-pointer",
  variants: {
    variant: {
      default: "hover:bg-background-hover",
      highlight: "bg-foreground hover:bg-background-inverse-hover",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const navigationMenuItemIcon = tv({
  base: "shrink-0",
  variants: {
    variant: {
      default: "text-foreground-muted",
      highlight: "text-foreground-inverse",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const navigationMenuCheckbox = tv({
  base: "size-4 rounded shrink-0 flex items-center justify-center border",
  variants: {
    variant: {
      default: "border-interactive-border",
      highlight: "border-foreground-inverse-muted",
    },
    checked: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    { variant: "default", checked: true, className: "bg-foreground border-foreground" },
    { variant: "highlight", checked: true, className: "bg-foreground-inverse border-foreground-inverse" },
  ],
  defaultVariants: {
    variant: "default",
    checked: false,
  },
});

const navigationMenuCheckboxIcon = tv({
  base: "shrink-0",
  variants: {
    variant: {
      default: "text-foreground-inverse",
      highlight: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const navigationMenuToggleTrack = tv({
  base: "w-8 h-5 rounded-full shrink-0 flex items-center p-0.5",
  variants: {
    variant: {
      default: "",
      highlight: "",
    },
    checked: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    { variant: "default", checked: false, className: "bg-interactive-border" },
    { variant: "default", checked: true, className: "bg-foreground" },
    { variant: "highlight", checked: false, className: "bg-foreground-inverse-muted" },
    { variant: "highlight", checked: true, className: "bg-foreground-inverse" },
  ],
  defaultVariants: {
    variant: "default",
    checked: false,
  },
});

const navigationMenuToggleThumb = tv({
  base: "size-4 rounded-full",
  variants: {
    variant: {
      default: "bg-background-elevated",
      highlight: "bg-foreground",
    },
    checked: {
      true: "ml-auto",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    checked: false,
  },
});

const LABEL_TONE: Record<NonNullable<MenuVariant>, "muted" | "inverse"> = {
  default: "muted",
  highlight: "inverse",
};

type NavigationMenuProps = PropsWithChildren<
  VariantProps<typeof navigationMenu> & { className?: string }
>;

export function NavigationMenu({ children, variant, className }: NavigationMenuProps) {
  return (
    <MenuVariantContext value={variant ?? "default"}>
      <ul className={navigationMenu({ variant, className })}>
        {children}
      </ul>
    </MenuVariantContext>
  );
}

type NavigationMenuItemProps = PropsWithChildren<{
  to?: ComponentPropsWithoutRef<typeof Link>["to"];
  onClick?: () => void;
  className?: string;
}>;

export function NavigationMenuItem({ to, onClick, className, children }: NavigationMenuItemProps) {
  const variant = use(MenuVariantContext);
  const itemClass = navigationMenuItem({ variant, className });

  const content = (
    <ItemIsLinkContext value={!!to}>
      {children}
    </ItemIsLinkContext>
  );

  if (to) {
    return (
      <li>
        <Link to={to} className={itemClass}>
          {content}
        </Link>
      </li>
    );
  }

  if (onClick) {
    return (
      <li>
        <button onClick={onClick} className={itemClass}>
          {content}
        </button>
      </li>
    );
  }

  return (
    <li>
      <div className={itemClass}>
        {content}
      </div>
    </li>
  );
}

export function NavigationMenuItemIcon({ children }: PropsWithChildren) {
  const variant = use(MenuVariantContext);

  return (
    <div className={cn("flex items-center gap-2", navigationMenuItemIcon({ variant }))()}>
      {children}
    </div>
  );
}

export function NavigationMenuItemLabel({ children }: PropsWithChildren) {
  const variant = use(MenuVariantContext);

  return <Text size="sm" tone={LABEL_TONE[variant ?? "default"]} align="left">{children}</Text>;
}

export function NavigationMenuItemTrailing({ children }: PropsWithChildren) {
  const isLink = use(ItemIsLinkContext);
  const variant = use(MenuVariantContext);

  return (
    <div className="flex items-center gap-2">
      {children}
      {isLink && <ArrowRight className={cn("shrink-0", navigationMenuItemIcon({ variant }))()} size={15} />}
    </div>
  );
}

type NavigationMenuToggleableItemProps = PropsWithChildren<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}>;

export function NavigationMenuCheckboxItem({
  checked,
  onCheckedChange,
  className,
  children,
}: NavigationMenuToggleableItemProps) {
  const variant = use(MenuVariantContext);

  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={navigationMenuItem({ variant, className })}
      >
        {children}
        <div className={navigationMenuCheckbox({ variant, checked })}>
          {checked && <Check size={12} className={navigationMenuCheckboxIcon({ variant })} />}
        </div>
      </button>
    </li>
  );
}

export function NavigationMenuToggleItem({
  checked,
  onCheckedChange,
  className,
  children,
}: NavigationMenuToggleableItemProps) {
  const variant = use(MenuVariantContext);

  return (
    <li>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={navigationMenuItem({ variant, className })}
      >
        {children}
        <div className={navigationMenuToggleTrack({ variant, checked })}>
          <div className={navigationMenuToggleThumb({ variant, checked })} />
        </div>
      </button>
    </li>
  );
}

"use client";

import type { ComponentPropsWithoutRef, FC, PropsWithChildren } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../utils/cn";
import { BUTTON_SIZES } from "../utils/sizes";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

type DropdownMenuSize = "default" | "small";

const DropdownMenu = DropdownMenuPrimitive.Root;

interface DropdownMenuTriggerProps extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> {
  size?: DropdownMenuSize;
}

const triggerSizeStyles: Record<DropdownMenuSize, string> = {
  default: BUTTON_SIZES.default,
  small: BUTTON_SIZES.small,
};

const getChevronSize = (size: DropdownMenuSize): number => {
  if (size === "small") {
    return 12;
  }
  return 14;
};

const DropdownMenuTrigger: FC<PropsWithChildren<DropdownMenuTriggerProps>> = ({
  children,
  className,
  size = "default",
  ...props
}) => (
  <DropdownMenuPrimitive.Trigger
    className={cn(
      "bg-surface border border-input text-foreground",
      "font-medium rounded-xl w-fit cursor-pointer",
      "flex items-center gap-1 hover:bg-surface-muted transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border",
      triggerSizeStyles[size],
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDown size={getChevronSize(size)} />
  </DropdownMenuPrimitive.Trigger>
);

const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuContent: FC<
  PropsWithChildren<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>>
> = ({ children, className, sideOffset = 4, align = "start", ...props }) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      sideOffset={sideOffset}
      align={align}
      className={cn(
        "min-w-48 overflow-hidden rounded-xl bg-surface p-1 shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPrimitive.Portal>
);

const DropdownMenuItem: FC<
  PropsWithChildren<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>>
> = ({ children, className, ...props }) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-xl outline-none transition-colors",
      "text-foreground-secondary text-sm p-2",
      "focus:bg-surface-muted",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.Item>
);

const DropdownMenuCheckboxItem: FC<
  PropsWithChildren<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>>
> = ({ children, className, checked, ...props }) => (
  <DropdownMenuPrimitive.CheckboxItem
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-xl outline-none transition-colors",
      "text-foreground-secondary text-sm py-1.5 pl-7 pr-2",
      "focus:bg-surface-muted",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check size={14} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
);

const DropdownMenuRadioItem: FC<
  PropsWithChildren<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>>
> = ({ children, className, ...props }) => (
  <DropdownMenuPrimitive.RadioItem
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-xl outline-none transition-colors",
      "text-foreground-secondary text-sm py-1.5 pl-7 pr-2",
      "focus:bg-surface-muted",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <span className="size-1.5 rounded-xl bg-primary" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
);

const DropdownMenuLabel: FC<
  PropsWithChildren<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>>
> = ({ children, className, ...props }) => (
  <DropdownMenuPrimitive.Label
    className={cn("px-2 py-1.5 text-xs text-foreground-subtle font-medium", className)}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.Label>
);

const DropdownMenuSeparator: FC<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>> = ({
  className,
  ...props
}) => (
  <DropdownMenuPrimitive.Separator
    className={cn(
      "mx-1 my-1 h-px bg-[repeating-linear-gradient(to_right,var(--color-neutral-300),var(--color-neutral-300)_0.25rem,transparent_0.25rem,transparent_0.5rem)]",
      className,
    )}
    {...props}
  />
);

const DropdownMenuSubTrigger: FC<
  PropsWithChildren<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>>
> = ({ children, className, ...props }) => (
  <DropdownMenuPrimitive.SubTrigger
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-xl outline-none transition-colors",
      "text-foreground-secondary text-sm py-1.5 px-2",
      "focus:bg-surface-muted data-[state=open]:bg-surface-muted",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight size={14} className="ml-auto text-foreground-subtle" />
  </DropdownMenuPrimitive.SubTrigger>
);

const DropdownMenuSubContent: FC<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>> = ({
  className,
  ...props
}) => (
  <DropdownMenuPrimitive.SubContent
    className={cn(
      "min-w-48 overflow-hidden rounded-xl bg-surface p-1 shadow-lg",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
);

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";
DropdownMenuContent.displayName = "DropdownMenuContent";
DropdownMenuItem.displayName = "DropdownMenuItem";
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";
DropdownMenuLabel.displayName = "DropdownMenuLabel";
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
export type { DropdownMenuSize };

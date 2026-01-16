"use client";

import type { FC, PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useId, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { tv } from "tailwind-variants";
import { cn } from "../utils/cn";

const checkboxIndicatorVariants = tv({
  base: "size-4 rounded-md border flex items-center justify-center",
  variants: {
    checked: {
      true: "bg-primary border-primary",
      false: "bg-surface border-input",
    },
  },
  defaultVariants: {
    checked: false,
  },
});

interface ListContextValue {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  indicatorLayoutId: string;
}

const ListContext = createContext<ListContextValue | null>(null);

const useListContext = (): ListContextValue => {
  const context = useContext(ListContext);
  if (!context) {
    throw new Error("List components must be used within a List");
  }
  return context;
};

interface ListProps {
  className?: string;
}

const List: FC<PropsWithChildren<ListProps>> = ({ children, className }) => {
  const indicatorLayoutId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <ListContext.Provider value={{ activeId, setActiveId, selectedId, setSelectedId, indicatorLayoutId }}>
      <ul className={cn("flex flex-col", className)}>{children}</ul>
    </ListContext.Provider>
  );
};

// Shared hook for hover state management
const useListItemHover = (id: string) => {
  const { activeId, setActiveId, indicatorLayoutId } = useListContext();
  const isActive = activeId === id;

  return {
    isActive,
    hoverProps: {
      onMouseEnter: () => setActiveId(id),
      onMouseLeave: () => setActiveId(null),
    },
    indicatorLayoutId,
  };
};

// Shared hover indicator component
const HoverIndicator: FC<{ isActive: boolean; layoutId: string }> = ({ isActive, layoutId }) => (
  <>
    {isActive && (
      <motion.div
        layoutId={layoutId}
        className="absolute inset-0 bg-surface-muted rounded-lg"
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      />
    )}
  </>
);

// Base ListItem - static, no interactivity
interface ListItemProps {
  id: string;
  className?: string;
}

const ListItem: FC<PropsWithChildren<ListItemProps>> = ({ id, children, className }) => {
  const { isActive, hoverProps, indicatorLayoutId } = useListItemHover(id);

  return (
    <li className={cn("relative -mx-4 cursor-default", className)} {...hoverProps}>
      <HoverIndicator isActive={isActive} layoutId={indicatorLayoutId} />
      <div className="relative z-10">
        {children}
      </div>
    </li>
  );
};

const ListItemLabel: FC<PropsWithChildren> = ({ children }) => (
  <span className="text-xs text-foreground">{children}</span>
);

const ListItemValue: FC<PropsWithChildren> = ({ children }) => (
  <span className="text-xs text-foreground-subtle">{children}</span>
);

// ListItemLink - navigation
interface ListItemLinkProps {
  id: string;
  href: string;
  className?: string;
}

const ListItemLink: FC<PropsWithChildren<ListItemLinkProps>> = ({ id, href, children, className }) => {
  const { isActive, hoverProps, indicatorLayoutId } = useListItemHover(id);

  return (
    <li className={cn("relative -mx-4", className)} {...hoverProps}>
      <HoverIndicator isActive={isActive} layoutId={indicatorLayoutId} />
      <Link href={href} className="relative z-10 flex items-center justify-between px-4 py-2 cursor-pointer">
        {children}
      </Link>
    </li>
  );
};

// ListItemCheckbox - toggle state
interface ListItemCheckboxProps {
  id: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

const ListItemCheckbox: FC<PropsWithChildren<ListItemCheckboxProps>> = ({
  id,
  checked,
  defaultChecked,
  onChange,
  children,
  className,
}) => {
  const { isActive, hoverProps, indicatorLayoutId } = useListItemHover(id);
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isChecked = checked ?? internalChecked;

  const handleClick = () => {
    const newValue = !isChecked;
    setInternalChecked(newValue);
    onChange?.(newValue);
  };

  return (
    <li className={cn("relative -mx-4", className)} {...hoverProps}>
      <HoverIndicator isActive={isActive} layoutId={indicatorLayoutId} />
      <button
        type="button"
        onClick={handleClick}
        className="relative z-10 flex items-center justify-between px-4 py-2 w-full text-left cursor-pointer"
      >
        {children}
        <div className={checkboxIndicatorVariants({ checked: isChecked })}>
          {isChecked && <Check size={10} strokeWidth={2.5} className="text-primary-foreground" />}
        </div>
      </button>
    </li>
  );
};

// ListItemButton - clickable with selection
interface ListItemButtonProps {
  id: string;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

const ListItemButton: FC<PropsWithChildren<ListItemButtonProps>> = ({ id, children, onClick, selected, className }) => {
  const { activeId, setActiveId, selectedId, setSelectedId, indicatorLayoutId } = useListContext();
  const isActive = activeId === id;
  const isSelected = selectedId === id;
  const showIndicator = isActive || (isSelected && activeId === null);

  useEffect(() => {
    if (selected) {
      setSelectedId(id);
    }
  }, [selected, id, setSelectedId]);

  const handleClick = () => {
    setSelectedId(id);
    onClick?.();
  };

  return (
    <li
      className={cn("relative -mx-4", className)}
      onMouseEnter={() => setActiveId(id)}
      onMouseLeave={() => setActiveId(null)}
    >
      {showIndicator && (
        <motion.div
          layoutId={indicatorLayoutId}
          className="absolute inset-0 bg-surface-muted rounded-lg"
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
      <button
        type="button"
        onClick={handleClick}
        className="relative z-10 flex items-center gap-2 w-full px-4 py-2 cursor-pointer"
      >
        <div className="flex items-center justify-between flex-1">{children}</div>
        <ArrowRight size={14} className="text-foreground-subtle" />
      </button>
    </li>
  );
};

// ListItemAdd - special add button
interface ListItemAddProps {
  children: string;
  onClick?: () => void;
}

const ListItemAdd: FC<ListItemAddProps> = ({ children, onClick }) => {
  const { activeId, setActiveId, indicatorLayoutId } = useListContext();
  const isActive = activeId === "add";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setActiveId("add")}
      onMouseLeave={() => setActiveId(null)}
      className="relative -mx-4 px-4 py-2 flex items-center gap-2 text-foreground-subtle hover:text-foreground-muted cursor-pointer"
    >
      {isActive && (
        <motion.div
          layoutId={indicatorLayoutId}
          className="absolute inset-0 bg-surface-muted rounded-lg"
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
      <Plus size={14} className="relative z-10" />
      <span className="relative z-10 text-xs">{children}</span>
    </button>
  );
};

// Display names
List.displayName = "List";
ListItem.displayName = "ListItem";
ListItemLink.displayName = "ListItemLink";
ListItemCheckbox.displayName = "ListItemCheckbox";
ListItemButton.displayName = "ListItemButton";
ListItemLabel.displayName = "ListItemLabel";
ListItemValue.displayName = "ListItemValue";
ListItemAdd.displayName = "ListItemAdd";

export { List, ListItem, ListItemLink, ListItemCheckbox, ListItemButton, ListItemLabel, ListItemValue, ListItemAdd };

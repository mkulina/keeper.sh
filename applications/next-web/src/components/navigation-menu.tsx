"use client";

import type { FC, PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Copy } from "@/components/copy";

interface NavigationMenuProps extends PropsWithChildren {
  className?: string;
}

const NavigationMenu: FC<NavigationMenuProps> = ({ children, className }) => {
  return (
    <div className={className}>
      <ul>{children}</ul>
    </div>
  );
};

const NavigationItemBase: FC<PropsWithChildren> = ({ children }) => (
  <div className="rounded-[0.875rem] flex items-center justify-between p-3 hover:backdrop-brightness-95">
    {children}
  </div>
);

interface NavigationItemProps {
  href: string;
  children: ReactNode;
}

const NavigationItem: FC<NavigationItemProps> = ({ href, children }) => {
  return (
    <li>
      <Link href={href} className="rounded-[0.875rem] flex items-center justify-between p-3 hover:backdrop-brightness-95">
        {children}
      </Link>
    </li>
  );
};

const NavigationItemIcon: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex items-center gap-2">
    {children}
  </div>
);

const NavigationItemLabel: FC<PropsWithChildren> = ({ children }) => (
  <Copy className="text-foreground-muted">{children}</Copy>
);

const NavigationItemRightContent: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex items-center gap-2">
    {children}
    <ArrowRight className="text-foreground-muted" size={15} />
  </div>
);

interface NavigationDropdownItemProps {
  header: ReactNode;
  rightContent?: ReactNode;
  children: ReactNode;
}

const NavigationDropdownItem: FC<NavigationDropdownItemProps> = ({ header, rightContent, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-[0.875rem] flex items-center justify-between p-3 hover:backdrop-brightness-95 cursor-pointer"
      >
        {header}
        <div className="flex items-center gap-2">
          {rightContent}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="text-foreground-muted" size={15} />
          </motion.div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

const NavigationDropdownHeader: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex items-center gap-2">
    {children}
  </div>
);

export { NavigationMenu, NavigationItem, NavigationItemBase, NavigationItemIcon, NavigationItemLabel, NavigationItemRightContent, NavigationDropdownItem, NavigationDropdownHeader };

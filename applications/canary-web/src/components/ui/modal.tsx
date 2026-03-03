import type { PropsWithChildren } from "react";
import { createContext, use, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heading3 } from "./heading";
import { Text } from "./text";

interface ModalContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextValue>({
  open: false,
  setOpen: () => {},
});

interface ModalProps extends PropsWithChildren {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Modal({ children, open: controlledOpen, onOpenChange }: ModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      onOpenChange?.(value);
      if (controlledOpen === undefined) setUncontrolledOpen(value);
    },
    [controlledOpen, onOpenChange],
  );

  return (
    <ModalContext value={{ open, setOpen }}>
      {children}
    </ModalContext>
  );
}

export function ModalTrigger({ children, ...props }: PropsWithChildren<{ className?: string }>) {
  const { setOpen } = use(ModalContext);

  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
}

export function ModalContent({ children }: PropsWithChildren) {
  const { open, setOpen } = use(ModalContext);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-6"
      onClick={(e) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }}
    >
      <div
        ref={contentRef}
        className="flex flex-col gap-3 bg-background-elevated border border-border-elevated rounded-2xl shadow-xs p-4 max-w-sm w-full"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalTitle({ children }: PropsWithChildren) {
  return <Heading3>{children}</Heading3>;
}

export function ModalDescription({ children }: PropsWithChildren) {
  return <Text size="sm" tone="muted" align="left">{children}</Text>;
}

export function ModalFooter({ children }: PropsWithChildren) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}

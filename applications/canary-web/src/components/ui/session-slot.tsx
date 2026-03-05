import type { ReactNode } from "react";

interface SessionSlotProps {
  authenticated: ReactNode;
  unauthenticated: ReactNode;
}

const hasSessionCookie = (): boolean =>
  document.cookie.split("; ").some((cookie) => cookie.startsWith("keeper.has_session=1"));

export function SessionSlot({ authenticated, unauthenticated }: SessionSlotProps) {
  return hasSessionCookie() ? authenticated : unauthenticated;
}

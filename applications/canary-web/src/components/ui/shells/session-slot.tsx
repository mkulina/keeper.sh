import type { ReactNode } from "react";
import { hasSessionCookie } from "../../../lib/session-cookie";

interface SessionSlotProps {
  authenticated: ReactNode;
  unauthenticated: ReactNode;
}

export function SessionSlot({ authenticated, unauthenticated }: SessionSlotProps) {
  return hasSessionCookie() ? authenticated : unauthenticated;
}

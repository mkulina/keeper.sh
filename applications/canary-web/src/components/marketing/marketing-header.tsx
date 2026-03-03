import type { PropsWithChildren } from "react";
import { LayoutRow } from "../ui/layout";
import { StaggeredBackdropBlur } from "../ui/staggered-backdrop-blur";

export function MarketingHeader({ children }: PropsWithChildren) {
  return (
    <div className="w-full sticky top-0 z-50">
      <StaggeredBackdropBlur />
      <LayoutRow className="relative z-10">
        <header className="flex justify-between items-center gap-2 py-3">
          {children}
        </header>
      </LayoutRow>
    </div>
  );
}

export function MarketingHeaderBranding({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function MarketingHeaderActions({ children }: PropsWithChildren) {
  return (
    <div className="flex items-center gap-2">
      {children}
    </div>
  );
}

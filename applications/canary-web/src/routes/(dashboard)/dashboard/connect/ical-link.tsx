import { createFileRoute } from "@tanstack/react-router";
import { Link } from "lucide-react";
import { Heading2 } from "../../../../components/ui/heading";
import { Text } from "../../../../components/ui/text";
import { ProviderIconPair } from "../../../../components/auth/oauth-preamble";
import { ICSFeedForm } from "../../../../components/auth/ics-connect-form";

export const Route = createFileRoute(
  "/(dashboard)/dashboard/connect/ical-link",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs self-center">
      <ProviderIconPair>
        <Link size={28} className="text-foreground-muted" />
      </ProviderIconPair>
      <Heading2 as="h1">Subscribe to ICS Feed</Heading2>
      <Text size="sm" tone="muted" align="left">
        Subscribe to a read-only calendar feed from any ICS-compatible source, supported by most calendar providers.
      </Text>
      <ICSFeedForm backHref="/dashboard/connect" />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { Heading2 } from "../../../../components/ui/heading";
import { Text } from "../../../../components/ui/text";
import { ProviderIconPair } from "../../../../components/auth/oauth-preamble";
import { ICSFileForm } from "../../../../components/auth/ics-connect-form";

export const Route = createFileRoute(
  "/(oauth)/dashboard/connect/ics-file",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs self-center">
      <ProviderIconPair>
        <Calendar size={28} className="text-foreground-muted" />
      </ProviderIconPair>
      <Heading2 as="h1">Upload ICS File</Heading2>
      <Text size="sm" tone="muted" align="left">
        Upload a one-time snapshot of your calendar. Future changes to the original calendar won&apos;t be reflected.
      </Text>
      <ICSFileForm backHref="/dashboard/connect" />
    </div>
  );
}

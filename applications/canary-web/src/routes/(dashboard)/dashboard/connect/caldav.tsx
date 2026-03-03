import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { Heading2 } from "../../../../components/ui/heading";
import { Text } from "../../../../components/ui/text";
import { ProviderIconPair } from "../../../../components/auth/oauth-preamble";
import { CalDAVConnectForm } from "../../../../components/auth/caldav-connect-form";

export const Route = createFileRoute("/(dashboard)/dashboard/connect/caldav")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs self-center">
      <ProviderIconPair>
        <Calendar size={28} className="text-foreground-muted" />
      </ProviderIconPair>
      <Heading2 as="h1">Connect CalDAV Server</Heading2>
      <Text size="sm" tone="muted" align="left">
        Connect to any CalDAV-compatible server.
      </Text>
      <ol className="flex flex-col gap-1 list-decimal list-inside">
        <li className="text-sm tracking-tight text-foreground-muted">Enter your CalDAV server URL</li>
        <li className="text-sm tracking-tight text-foreground-muted">Provide a username</li>
        <li className="text-sm tracking-tight text-foreground-muted">Enter a password, or app-specific password</li>
        <li className="text-sm tracking-tight text-foreground-muted">Click &ldquo;Connect&rdquo;</li>
      </ol>
      <Text size="sm" tone="muted" align="left">
        Your CalDAV server URL can typically be found in your calendar provider&apos;s settings or documentation.
      </Text>
      <CalDAVConnectForm provider="caldav" backHref="/dashboard/connect" />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Heading2 } from "../../../../components/ui/heading";
import { Text } from "../../../../components/ui/text";
import { ProviderIconPair } from "../../../../components/auth/oauth-preamble";
import { CalDAVConnectForm } from "../../../../components/auth/caldav-connect-form";

export const Route = createFileRoute("/(oauth)/dashboard/connect/apple")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs self-center">
      <ProviderIconPair>
        <img src="/integrations/icon-icloud.svg" alt="iCloud" width={40} height={40} className="size-full rounded-lg p-3" />
      </ProviderIconPair>
      <Heading2 as="h1">Connect Apple Calendar</Heading2>
      <Text size="sm" tone="muted" align="left">
        iCloud uses an app-specific password to authenticate Keeper to interact with your calendar.
      </Text>
      <ol className="flex flex-col gap-1 list-decimal list-inside">
        <li className="text-sm tracking-tight text-foreground-muted">
          Navigate to{" "}
          <a href="https://appleid.apple.com" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">
            iCloud Apple ID
          </a>
        </li>
        <li className="text-sm tracking-tight text-foreground-muted">Sign in with your Apple ID</li>
        <li className="text-sm tracking-tight text-foreground-muted">Select &ldquo;App-Specific Passwords&rdquo;</li>
        <li className="text-sm tracking-tight text-foreground-muted">Click the &ldquo;+&rdquo; next to &ldquo;Passwords&rdquo;</li>
        <li className="text-sm tracking-tight text-foreground-muted">Label and generate the password, then copy it</li>
        <li className="text-sm tracking-tight text-foreground-muted">Paste the app-specific password below</li>
      </ol>
      <CalDAVConnectForm provider="icloud" backHref="/dashboard/connect" />
    </div>
  );
}

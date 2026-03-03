import { createFileRoute } from "@tanstack/react-router";
import { Heading2 } from "../../../../components/ui/heading";
import { Text } from "../../../../components/ui/text";
import { ProviderIconPair } from "../../../../components/auth/oauth-preamble";
import { CalDAVConnectForm } from "../../../../components/auth/caldav-connect-form";

export const Route = createFileRoute(
  "/(dashboard)/dashboard/connect/fastmail",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs self-center">
      <ProviderIconPair>
        <img src="/integrations/icon-fastmail.svg" alt="Fastmail" width={40} height={40} className="size-full rounded-lg p-3" />
      </ProviderIconPair>
      <Heading2 as="h1">Connect Fastmail</Heading2>
      <Text size="sm" tone="muted" align="left">
        Fastmail uses an app-specific password to authenticate Keeper to interact with your calendar.
      </Text>
      <ol className="flex flex-col gap-1 list-decimal list-inside">
        <li className="text-sm tracking-tight text-foreground-muted">
          Navigate to{" "}
          <a href="https://www.fastmail.com/settings/security/devicekeys" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">
            Fastmail Settings
          </a>
        </li>
        <li className="text-sm tracking-tight text-foreground-muted">Click &ldquo;Manage app password and access&rdquo;</li>
        <li className="text-sm tracking-tight text-foreground-muted">Click &ldquo;New app password&rdquo;</li>
        <li className="text-sm tracking-tight text-foreground-muted">Under &ldquo;Access&rdquo;, select &ldquo;Calendars (CalDAV)&rdquo;</li>
        <li className="text-sm tracking-tight text-foreground-muted">Click &ldquo;Generate password&rdquo;</li>
        <li className="text-sm tracking-tight text-foreground-muted">Copy the password, and paste it below</li>
      </ol>
      <CalDAVConnectForm provider="fastmail" backHref="/dashboard/connect" />
    </div>
  );
}

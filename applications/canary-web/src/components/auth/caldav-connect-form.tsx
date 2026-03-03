import type { SubmitEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button, ButtonText, LinkButton, ButtonIcon } from "../ui/button";
import { Divider } from "../ui/divider";
import { Input } from "../ui/input";

type CalDAVProvider = "fastmail" | "icloud" | "caldav";

const EMAIL_PLACEHOLDERS: Record<CalDAVProvider, string> = {
  fastmail: "Fastmail Email Address",
  icloud: "Apple ID",
  caldav: "CalDAV Server Username",
};

interface CalDAVConnectFormProps {
  provider: CalDAVProvider;
  backHref: string;
}

export function CalDAVConnectForm({ provider, backHref }: CalDAVConnectFormProps) {
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {provider === "caldav" && (
          <Input
            id="server-url"
            name="server-url"
            type="url"
            placeholder="CalDAV Server URL"
          />
        )}
        <Input
          id={provider === "caldav" ? "username" : "email"}
          name={provider === "caldav" ? "username" : "email"}
          type={provider === "caldav" ? "text" : "email"}
          placeholder={EMAIL_PLACEHOLDERS[provider]}
        />
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={provider === "caldav" ? "CalDAV Server Password" : "App-Specific Password"}
        />
      </div>
      <Divider />
      <div className="flex items-stretch gap-2">
        <LinkButton to={backHref} variant="border" className="self-stretch justify-center px-3.5">
          <ButtonIcon>
            <ArrowLeft size={16} />
          </ButtonIcon>
        </LinkButton>
        <Button type="submit" className="grow justify-center">
          <ButtonText>Connect</ButtonText>
        </Button>
      </div>
    </form>
  );
}

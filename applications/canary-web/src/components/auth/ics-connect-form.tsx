import { useState, useTransition, type ChangeEvent, type SubmitEvent } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useSWRConfig } from "swr";
import { apiFetch } from "../../lib/fetcher";
import { invalidateAccountsAndSources } from "../../lib/swr";
import { BackButton } from "../ui/back-button";
import { Button, ButtonText } from "../ui/button";
import { Divider } from "../ui/divider";
import { Input } from "../ui/input";
import { Text } from "../ui/text";

function resolveSubmitLabel(pending: boolean): string {
  if (pending) return "Subscribing...";
  return "Subscribe";
}

export function ICSFeedForm() {
  const navigate = useNavigate();
  const { mutate: globalMutate } = useSWRConfig();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const url = formData.get("feed-url");

    if (!url || typeof url !== "string") return;

    setError(null);

    startTransition(async () => {
      try {
        await apiFetch("/api/ics", {
          body: JSON.stringify({ name: "iCal Feed", url }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } catch {
        setError("Failed to subscribe to feed");
        return;
      }

      await invalidateAccountsAndSources(globalMutate);
      navigate({ to: "/dashboard/sync-profiles" });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        id="feed-url"
        name="feed-url"
        type="url"
        placeholder="Calendar Feed URL"
        disabled={isPending}
      />
      <Divider />
      <div className="flex items-stretch gap-2">
        <BackButton variant="border" size="standard" className="self-stretch justify-center px-3.5" />
        <Button type="submit" className="grow justify-center" disabled={isPending}>
          {isPending && <LoaderCircle size={16} className="animate-spin" />}
          <ButtonText>{resolveSubmitLabel(isPending)}</ButtonText>
        </Button>
      </div>
      {error && <Text size="sm" tone="danger" align="center">{error}</Text>}
    </form>
  );
}

// TODO: Implement file upload submission
export function ICSFileForm() {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label
        htmlFor="ics-file"
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-interactive-border p-8 hover:cursor-pointer hover:bg-background-hover"
      >
        <Upload size={20} className="text-foreground-muted" />
        <p className="text-sm tracking-tight text-foreground-muted">
          {fileName ?? "Upload an ICS File"}
        </p>
        <input
          id="ics-file"
          name="ics-file"
          type="file"
          accept=".ics,.ical"
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>
      <Divider />
      <div className="flex items-stretch gap-2">
        <BackButton variant="border" size="standard" className="self-stretch justify-center px-3.5" />
        <Button type="submit" className="grow justify-center">
          <ButtonText>Upload</ButtonText>
        </Button>
      </div>
    </form>
  );
}

import { useState, type SubmitEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, ButtonText } from "../../../../components/ui/button";
import { BackButton } from "../../../../components/ui/back-button";
import { Text } from "../../../../components/ui/text";
import { Divider } from "../../../../components/ui/divider";
import { Input } from "../../../../components/ui/input";
import { changePassword } from "../../../../lib/auth";
import { resolveErrorMessage } from "../../../../utils/errors";

export const Route = createFileRoute(
  "/(dashboard)/dashboard/settings/change-password",
)({
  component: ChangePasswordPage,
});

function resolveInputTone(error: string | null): "error" | "neutral" {
  if (error) return "error";
  return "neutral";
}

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const current = formData.get("current");
    const newPassword = formData.get("new");
    const confirm = formData.get("confirm");

    if (typeof current !== "string" || typeof newPassword !== "string" || typeof confirm !== "string") return;

    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await changePassword(current, newPassword);
      navigate({ to: "/dashboard/settings" });
    } catch (err) {
      setError(resolveErrorMessage(err, "Failed to change password."));
    }
  };

  const inputTone = resolveInputTone(error);

  return (
    <div className="flex flex-col gap-1.5">
      <BackButton fallback="/dashboard/settings" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Input name="current" type="password" placeholder="Current password" tone={inputTone} />
          <Input name="new" type="password" placeholder="New password" tone={inputTone} />
          <Input name="confirm" type="password" placeholder="Confirm new password" tone={inputTone} />
        </div>
        {error && <Text size="sm" tone="danger">{error}</Text>}
        <Divider />
        <Button type="submit" variant="highlight" className="w-full justify-center">
          <ButtonText>Save</ButtonText>
        </Button>
      </form>
    </div>
  );
}

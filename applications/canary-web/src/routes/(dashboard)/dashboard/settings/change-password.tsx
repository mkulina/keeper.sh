import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LinkButton, Button, ButtonIcon, ButtonText } from "../../../../components/ui/button";
import { Divider } from "../../../../components/ui/divider";
import { Input } from "../../../../components/ui/input";

export const Route = createFileRoute(
  "/(dashboard)/dashboard/settings/change-password",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-1.5">
      <LinkButton to="/dashboard/settings" variant="elevated" size="compact" className="aspect-square">
        <ButtonIcon>
          <ArrowLeft size={16} />
        </ButtonIcon>
      </LinkButton>
      <form className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Input type="password" placeholder="Current password" />
          <Input type="password" placeholder="New password" />
          <Input type="password" placeholder="Confirm new password" />
        </div>
        <Divider />
        <Button type="submit" variant="highlight" className="w-full justify-center">
          <ButtonText>Save</ButtonText>
        </Button>
      </form>
    </div>
  );
}

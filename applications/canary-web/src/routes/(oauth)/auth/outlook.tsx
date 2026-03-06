import { createFileRoute } from "@tanstack/react-router";
import { AuthOAuthPreamble } from "../../../features/auth/components/oauth-preamble";

export const Route = createFileRoute("/(oauth)/auth/outlook")({
  component: OutlookAuthPage,
});

function OutlookAuthPage() {
  return <AuthOAuthPreamble provider="outlook" />;
}

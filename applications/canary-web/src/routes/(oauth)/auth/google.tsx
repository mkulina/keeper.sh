import { createFileRoute } from "@tanstack/react-router";
import { AuthOAuthPreamble } from "../../../features/auth/components/oauth-preamble";

export const Route = createFileRoute("/(oauth)/auth/google")({
  component: GoogleAuthPage,
});

function GoogleAuthPage() {
  return <AuthOAuthPreamble provider="google" />;
}

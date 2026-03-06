import { createFileRoute } from "@tanstack/react-router";
import { AuthForm, type AuthScreenCopy } from "../../features/auth/components/auth-form";

export const Route = createFileRoute("/(auth)/login")({
  component: LoginPage,
});

const copy: AuthScreenCopy = {
  heading: "Welcome back",
  subtitle: "Sign in to your Keeper account",
  oauthActionLabel: "Sign in",
  submitLabel: "Sign in",
  switchPrompt: "Don't have an account yet?",
  switchCta: "Register",
  switchTo: "/register",
  action: "signIn",
};

function LoginPage() {

  return <AuthForm copy={copy} />;
}

import { createFileRoute } from "@tanstack/react-router";
import { AuthForm, type AuthScreenCopy } from "../../features/auth/components/auth-form";

export const Route = createFileRoute("/(auth)/register")({
  component: RegisterPage,
});

const copy: AuthScreenCopy = {
  heading: "Create your account",
  subtitle: "Get started with Keeper for free",
  oauthActionLabel: "Sign up",
  submitLabel: "Sign up",
  switchPrompt: "Already have an account?",
  switchCta: "Sign in",
  switchTo: "/login",
  action: "signUp",
};

function RegisterPage() {
  return <AuthForm copy={copy} />;
}

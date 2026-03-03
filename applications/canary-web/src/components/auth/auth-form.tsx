import type { SubmitEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useAtomValue, useSetAtom } from "jotai";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { authFormStatusAtom, authFormErrorAtom, type AuthFormStatus } from "../../state/auth-form";
import { Button, LinkButton, ButtonText, ButtonIcon } from "../ui/button";
import { Divider } from "../ui/divider";
import { Heading2 } from "../ui/heading";
import { Input } from "../ui/input";
import { Text } from "../ui/text";

export type AuthScreenCopy = {
  heading: string;
  subtitle: string;
  oauthActionLabel: string;
  submitLabel: string;
  switchPrompt: string;
  switchCta: string;
  switchTo: "/login" | "/register";
};

type SocialAuthProvider = {
  id: string;
  label: string;
  to: "/auth/google" | "/auth/outlook";
  iconSrc: string;
};

const AUTH_ERROR_MESSAGE = "Invalid email or password. Please try again.";

const SOCIAL_AUTH_PROVIDERS: readonly SocialAuthProvider[] = [
  { id: "google", label: "Google", to: "/auth/google", iconSrc: "/integrations/icon-google.svg" },
  { id: "outlook", label: "Outlook", to: "/auth/outlook", iconSrc: "/integrations/icon-outlook.svg" },
];

const submitTextVariants: Record<AuthFormStatus, Variants[string]> = {
  idle: { opacity: 1, filter: "none", y: 0, scale: 1 },
  loading: { opacity: 0, filter: "blur(2px)", y: -2, scale: 0.75 },
};

const backButtonVariants: Variants = {
  hidden: { width: 0, opacity: 0, filter: "blur(2px)" },
  visible: { width: "auto", opacity: 1, filter: "blur(0px)" },
};

export function AuthForm({ copy }: { copy: AuthScreenCopy }) {
  return (
    <>
      <div className="flex flex-col py-2">
        <Heading2 as="span" className="text-center">{copy.heading}</Heading2>
        <Text size="sm" tone="muted" align="center">{copy.subtitle}</Text>
      </div>
      <SocialAuthButtons oauthActionLabel={copy.oauthActionLabel} />
      <Divider>or</Divider>
      <EmailForm submitLabel={copy.submitLabel} />
      <div className="flex flex-col gap-1.5">
        <AuthError />
        <Text size="sm" tone="muted" align="center">
          {copy.switchPrompt}{" "}
          <Link to={copy.switchTo} className="text-foreground underline underline-offset-2 hover:text-foreground-muted transition-colors">
            {copy.switchCta}
          </Link>
        </Text>
      </div>
    </>
  );
}

function SocialAuthButtons({ oauthActionLabel }: { oauthActionLabel: string }) {
  return (
    <>
      {SOCIAL_AUTH_PROVIDERS.map((provider) => (
        <LinkButton key={provider.id} to={provider.to} className="w-full justify-center" variant="border">
          <ButtonIcon>
            <img src={provider.iconSrc} alt="" width={16} height={16} />
          </ButtonIcon>
          <ButtonText>{`${oauthActionLabel} with ${provider.label}`}</ButtonText>
        </LinkButton>
      ))}
    </>
  );
}

function EmailForm({ submitLabel }: { submitLabel: string }) {
  const setStatus = useSetAtom(authFormStatusAtom);
  const setError = useSetAtom(authFormErrorAtom);
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");

    setTimeout(() => {
      setStatus("idle");
      setError({ message: AUTH_ERROR_MESSAGE, active: true });
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="contents">
      <EmailInput />
      <div className="flex items-stretch">
        <BackButton />
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

function AuthError() {
  const error = useAtomValue(authFormErrorAtom);
  const active = error?.active;

  return (
    <motion.div
      className="overflow-hidden"
      initial={false}
      animate={{
        height: active ? "auto" : 0,
        opacity: active ? 1 : 0,
        filter: active ? "blur(0px)" : "blur(4px)",
      }}
      transition={{ duration: 0.2 }}
    >
      <p className="text-sm tracking-tight text-destructive text-center">
        {error?.message}
      </p>
    </motion.div>
  );
}

function EmailInput() {
  const status = useAtomValue(authFormStatusAtom);
  const error = useAtomValue(authFormErrorAtom);
  const setError = useSetAtom(authFormErrorAtom);

  const handleChange = () => {
    if (error?.active) {
      setError({ ...error, active: false });
    }
  };

  return (
    <Input
      id="email"
      name="email"
      disabled={status === "loading"}
      type="email"
      placeholder="johndoe+keeper@example.com"
      tone={error?.active ? "error" : "neutral"}
      onChange={handleChange}
    />
  );
}

function BackButton() {
  const status = useAtomValue(authFormStatusAtom);

  return (
    <AnimatePresence initial={false}>
      {status !== "loading" && (
        <motion.div
          className="flex items-stretch"
          variants={backButtonVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ width: { duration: 0.24 }, opacity: { duration: 0.12 } }}
        >
          <LinkButton to="/" variant="border" className="self-stretch justify-center mr-2">
            <ButtonIcon>
              <ArrowLeft size={16} />
            </ButtonIcon>
          </LinkButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SubmitButton({ children }: { children: string }) {
  const status = useAtomValue(authFormStatusAtom);

  return (
    <motion.div className="grow" layout>
      <Button disabled={status === "loading"} type="submit" className="relative w-full justify-center">
        <motion.span
          className="origin-top font-medium"
          variants={submitTextVariants}
          animate={status}
          transition={{ duration: 0.16 }}
        >
          {children}
        </motion.span>
        <AnimatePresence>
          {status === "loading" && (
            <motion.span
              className="absolute inset-0 m-auto size-fit origin-bottom"
              initial={{ opacity: 0, filter: "blur(2px)", y: 2, scale: 0.25 }}
              animate={{ opacity: 1, filter: "none", y: 0, scale: 1 }}
              exit={{ opacity: 0, filter: "blur(2px)", y: 2, scale: 0.25 }}
              transition={{ duration: 0.16 }}
            >
              <LoaderCircle className="animate-spin" size={16} />
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}

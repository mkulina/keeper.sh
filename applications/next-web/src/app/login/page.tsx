"use client"

import { LayoutGroup, motion } from "motion/react";
import { useState, type FormEvent } from "react"
import { ArrowLeft, LoaderCircle } from "lucide-react"
import Image from "next/image"
import { AnimatePresence } from "motion/react"
import { Button, LinkButton } from "@/components/button"
import { Input } from "@/components/input"
import { FlexRowGroup } from "@/components/flex-row-group"
import { FlexColumnGroup } from "@/components/flex-column-group"
import { Divider } from "@/components/divider"
import { Heading1 } from "@/components/heading"
import { Copy } from "@/components/copy"
import { MicroCopy } from "@/components/micro-copy"
import { InlineLink } from "@/components/inline-link"

function LoginPage() {
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
  }

  return (
    <main className="flex size-full items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-xs">
        <FlexColumnGroup className="gap-2">
          <FlexColumnGroup className="py-2 items-center text-center">
            <Heading1>Welcome back</Heading1>
            <Copy>Sign in to your Keeper account to continue</Copy>
          </FlexColumnGroup>
          <LinkButton href="/auth/google" className="w-full" variant="border">
            <Image alt="Google icon" width={17} height={17} src="/integrations/icon-google.svg" />
            Sign in with Google
          </LinkButton>
          <LinkButton href="/auth/outlook" className="w-full" variant="border">
            <Image alt="Outlook icon" width={17} height={17} src="/integrations/icon-outlook.svg" />
            Sign in with Outlook
          </LinkButton>
          <FlexRowGroup>
            <Divider />
            <span className="text-xs px-2 text-foreground-subtle">or</span>
            <Divider />
          </FlexRowGroup>
          <form onSubmit={handleSubmit} className="contents">
            <Input type="email" placeholder="johndoe+keeper@example.com" />
            <FlexRowGroup className="items-stretch">
              <LayoutGroup>
                <AnimatePresence>
                  {!loading && (
                    <motion.div transition={{ width: { duration: 0.24 }, opacity: { duration: 0.12 } }} exit={{ width: 0, opacity: 0, filter: 'blur(0.125rem)' }}>
                      <LinkButton href="/playground" className="h-full px-3.5 mr-2" variant="border">
                        <ArrowLeft size={17} />
                      </LinkButton>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div className="grow">
                  <Button disabled={loading} type="submit" className="relative w-full" variant="primary" size="normal">
                    <motion.span className="origin-top" transition={{ duration: 0.16 }} animate={{ opacity: loading ? 0 : 1, filter: loading ? 'blur(0.125rem)' : 'none', y: loading ? -2 : 0, scale: loading ? 0.75 : 1 }}>
                      Sign in
                    </motion.span>
                    <motion.span transition={{ delay: 0.08, duration: 0.16 }} className="absolute inset-0 m-auto size-fit origin-bottom" initial={{ opacity: 0 }} animate={{ opacity: loading ? 1 : 0, filter: loading ? 'none' : 'blur(0.125rem)', y: loading ? 0 : 2, scale: loading ? 1 : 0.75 }}>
                      <LoaderCircle className="animate-spin" size={17} />
                    </motion.span>
                  </Button>
                </motion.div>
              </LayoutGroup>
            </FlexRowGroup>
          </form>
          <MicroCopy className="text-center">
            <span>No account yet? </span>
            <InlineLink href="/blayground/register">Register</InlineLink>
          </MicroCopy>
        </FlexColumnGroup>
      </div>
    </main>
  )
}

export default LoginPage;

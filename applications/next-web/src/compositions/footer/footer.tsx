import Link from "next/link"
import { Copy } from "@/components/copy"
import { FlexRowGroup } from "@/components/flex-row-group"
import { FlexColumnGroup } from "@/components/flex-column-group"
import { Heart } from "lucide-react"
import type { FC } from "react"

const FooterLink: FC<{ href: string; children: string }> = ({ href, children }) => (
  <Link href={href}>
    <Copy className="hover:text-foreground transition-colors">{children}</Copy>
  </Link>
)

export const Footer: FC = () => {
  return (
    <footer className="w-full px-4 md:px-8 py-8 pb-12">
      <FlexRowGroup className="max-w-3xl mx-auto justify-between items-start">
        <Link href="https://rida.dev/" className="flex items-center gap-1">
          <Copy className="hover:text-foreground transition-colors">Made with</Copy>
          <Heart size={14} className="fill-red-500 text-red-500" />
          <Copy className="hover:text-foreground transition-colors">by Rida F'kih</Copy>
        </Link>

        <FlexRowGroup className="gap-12 items-start">
          <FlexColumnGroup className="gap-2">
            <Copy className="font-medium mb-1">Product</Copy>
            <FooterLink href="/register">Get Started</FooterLink>
            <FooterLink href="/#features">Features</FooterLink>
            <FooterLink href="/#pricing">Pricing</FooterLink>
          </FlexColumnGroup>

          <FlexColumnGroup className="gap-2">
            <Copy className="font-medium mb-1">Resources</Copy>
            <FooterLink href="/docs">Documentation</FooterLink>
            <FooterLink href="/changelog">Changelog</FooterLink>
            <FooterLink href="https://github.com">GitHub</FooterLink>
          </FlexColumnGroup>

          <FlexColumnGroup className="gap-2">
            <Copy className="font-medium mb-1">Legal</Copy>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/terms">Terms of Service</FooterLink>
          </FlexColumnGroup>
        </FlexRowGroup>
      </FlexRowGroup>
    </footer>
  )
}

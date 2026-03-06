import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Layout, LayoutItem } from '../../components/ui/shells/layout'
import { MarketingHeader, MarketingHeaderActions, MarketingHeaderBranding } from '../../features/marketing/components/marketing-header'
import { MarketingFooter, MarketingFooterTagline, MarketingFooterNav, MarketingFooterNavGroup, MarketingFooterNavGroupLabel, MarketingFooterNavItem } from '../../features/marketing/components/marketing-footer'
import KeeperLogo from "../../assets/keeper.svg?react";
import { ButtonText, LinkButton } from '../../components/ui/primitives/button';
import { GithubStarButton } from '../../components/ui/primitives/github-star-button';
import { SessionSlot } from '../../components/ui/shells/session-slot';
import { HeartIcon } from 'lucide-react';

export const Route = createFileRoute('/(marketing)')({
  component: MarketingLayout,
})

function MarketingLayout() {
  return (
    <>
      <MarketingHeader>
        <MarketingHeaderBranding>
          <KeeperLogo className="max-w-6" />
        </MarketingHeaderBranding>
        <SessionSlot
          authenticated={
            <MarketingHeaderActions>
              <GithubStarButton />
              <LinkButton size="compact" variant="highlight" to="/dashboard">
                <ButtonText>Dashboard</ButtonText>
              </LinkButton>
            </MarketingHeaderActions>
          }
          unauthenticated={
            <MarketingHeaderActions>
              <GithubStarButton />
              <LinkButton size="compact" variant="border" to="/login">
                <ButtonText>Login</ButtonText>
              </LinkButton>
              <LinkButton size="compact" variant="highlight" to="/register">
                <ButtonText>Register</ButtonText>
              </LinkButton>
            </MarketingHeaderActions>
          }
        />
      </MarketingHeader>
      <Layout>
      <LayoutItem>
        <main>
          <Outlet />
        </main>
      </LayoutItem>
      <LayoutItem>
        <MarketingFooter>
          <MarketingFooterTagline>
            Made with <HeartIcon size={12} className="inline text-red-500 fill-red-500 relative -top-px" /> by Rida F'kih
          </MarketingFooterTagline>
          <MarketingFooterNav>
            <MarketingFooterNavGroup>
              <MarketingFooterNavGroupLabel>Product</MarketingFooterNavGroupLabel>
              <MarketingFooterNavItem>Get Started</MarketingFooterNavItem>
              <MarketingFooterNavItem>Features</MarketingFooterNavItem>
              <MarketingFooterNavItem>Pricing</MarketingFooterNavItem>
            </MarketingFooterNavGroup>
            <MarketingFooterNavGroup>
              <MarketingFooterNavGroupLabel>Resources</MarketingFooterNavGroupLabel>
              <MarketingFooterNavItem>Documentation</MarketingFooterNavItem>
              <MarketingFooterNavItem>Changelog</MarketingFooterNavItem>
              <MarketingFooterNavItem>GitHub</MarketingFooterNavItem>
            </MarketingFooterNavGroup>
            <MarketingFooterNavGroup>
              <MarketingFooterNavGroupLabel>Legal</MarketingFooterNavGroupLabel>
              <MarketingFooterNavItem>Privacy Policy</MarketingFooterNavItem>
              <MarketingFooterNavItem>Terms of Service</MarketingFooterNavItem>
            </MarketingFooterNavGroup>
          </MarketingFooterNav>
        </MarketingFooter>
      </LayoutItem>
    </Layout>
    </>
  )
}

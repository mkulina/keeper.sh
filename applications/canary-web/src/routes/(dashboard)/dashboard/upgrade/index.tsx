import { useState, useTransition } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BackButton } from "../../../../components/ui/primitives/back-button";
import { DashboardHeading1, DashboardHeading3 } from "../../../../components/ui/primitives/dashboard-heading";
import { Text } from "../../../../components/ui/primitives/text";
import { Button, ButtonText } from "../../../../components/ui/primitives/button";
import {
  UpgradeCard,
  UpgradeCardSection,
  UpgradeCardToggle,
  UpgradeCardFeature,
  UpgradeCardFeatureIcon,
  UpgradeCardActions,
} from "../../../../features/dashboard/components/upgrade-card";
import Check from "lucide-react/dist/esm/icons/check";
import { useSubscription } from "../../../../hooks/use-subscription";
import { openCheckout, openCustomerPortal } from "../../../../utils/checkout";
import { plans } from "../../../../config/plans";

export const Route = createFileRoute("/(dashboard)/dashboard/upgrade/")({
  component: UpgradePage,
});

const proPlan = plans.find((plan) => plan.id === "pro")!;

function UpgradePage() {
  const navigate = useNavigate();
  const { data: subscription, isLoading, mutate } = useSubscription();
  const [yearly, setYearly] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentPlan = subscription?.plan ?? "free";
  const currentInterval = subscription?.interval;
  const isCurrent = currentPlan === "pro";

  if (isCurrent && !isLoading) {
    navigate({ to: "/dashboard" });
    return null;
  }
  const isCurrentInterval =
    (currentInterval === "year" && yearly) ||
    (currentInterval === "month" && !yearly);

  const price = yearly ? (proPlan.yearlyPrice / 12).toFixed(2) : proPlan.monthlyPrice.toFixed(2);
  const period = yearly ? "per month, billed annually" : "per month";
  const productId = yearly ? proPlan.yearlyProductId : proPlan.monthlyProductId;

  const handleUpgrade = () => {
    if (!productId) return;
    startTransition(async () => {
      await openCheckout(productId, { onSuccess: () => mutate() });
    });
  };

  const handleManage = () => {
    startTransition(async () => {
      await openCustomerPortal();
    });
  };

  const busy = isLoading || isPending;
  const mode = !isCurrent ? "upgrade" : isCurrentInterval ? "manage" : "switch-interval";

  return (
    <div className="flex flex-col gap-1.5">
      <BackButton />

      <UpgradeCard className="mt-4">
        <UpgradeCardSection gap="sm">
          <DashboardHeading3 as="h1" className="text-white">Upgrade to Pro</DashboardHeading3>
          <div className="flex items-baseline gap-1">
            <DashboardHeading1 as="span" className="text-white tabular-nums">${price}</DashboardHeading1>
            <Text size="sm" align="left" className="text-neutral-400">
              {period}
            </Text>
          </div>
          <UpgradeCardToggle checked={yearly} onCheckedChange={setYearly}>
            <Text size="sm" tone="highlight">Annual billing</Text>
          </UpgradeCardToggle>
          <Text size="sm" align="left" className="text-neutral-400 pt-1">
            For power users who need minutely syncs and unlimited calendars. Thank you for supporting this project.
          </Text>
        </UpgradeCardSection>

        <UpgradeCardSection>
          {proPlan.features.map((feature) => (
            <UpgradeCardFeature key={feature}>
              <UpgradeCardFeatureIcon>
                <Check size={14} />
              </UpgradeCardFeatureIcon>
              <Text size="sm" className="text-neutral-300">{feature}</Text>
            </UpgradeCardFeature>
          ))}
        </UpgradeCardSection>

        <UpgradeCardActions>
          <UpgradeAction mode={mode} isLoading={busy} onUpgrade={handleUpgrade} onManage={handleManage} />
        </UpgradeCardActions>
      </UpgradeCard>
    </div>
  );
}

type UpgradeActionProps = {
  isLoading: boolean;
  onUpgrade: () => void;
  onManage: () => void;
  mode: "upgrade" | "manage" | "switch-interval";
};

function UpgradeAction({ mode, isLoading, onUpgrade, onManage }: UpgradeActionProps) {
  const base = "w-full justify-center border-transparent bg-white text-neutral-900 hover:bg-neutral-100";

  const label =
    mode === "manage" ? "Manage Subscription" :
    mode === "switch-interval" ? "Switch Billing Period" :
    isLoading ? "Loading..." : "Upgrade to Pro";

  const handler = mode === "upgrade" ? onUpgrade : onManage;

  return (
    <Button variant="border" className={base} onClick={handler} disabled={isLoading}>
      <ButtonText>{label}</ButtonText>
    </Button>
  );
}

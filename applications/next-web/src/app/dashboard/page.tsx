import { User, CalendarDays, Calendar, Filter, Settings, LogOut, Check, RefreshCw, AlertTriangle } from "lucide-react";
import { FC, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import KeeperLogoDark from "@/assets/keeper-dark-mode.svg";
import { MicroCopy } from "@/components/micro-copy";
import { Copy } from "@/components/copy";
import {
  NavigationMenu,
  NavigationItem,
  NavigationItemBase,
  NavigationItemIcon,
  NavigationItemLabel,
  NavigationItemRightContent,
  NavigationDropdownItem,
  NavigationDropdownHeader,
} from "@/components/navigation-menu";
import { DashboardCalendar } from "@/compositions/dashboard-calendar/dashboard-calendar";

const AccountsPreview: FC = () => {
  return (
    <div className="flex items-center *:not-last:-mr-3">
      <Image className="p-1 bg-surface-elevated border border-border rounded-full aspect-square" width={24} height={24} src="/integrations/icon-fastmail.svg" alt="" />
      <Image className="p-1 bg-surface-elevated border border-border rounded-full aspect-square" width={24} height={24} src="/integrations/icon-google.svg" alt="" />
      <Image className="p-1 bg-surface-elevated border border-border rounded-full aspect-square" width={24} height={24} src="/integrations/icon-google.svg" alt="" />
      <Image className="p-1 bg-surface-elevated border border-border rounded-full aspect-square" width={24} height={24} src="/integrations/icon-icloud.svg" alt="" />
      <div className="size-6 bg-surface-elevated border border-border rounded-full aspect-square flex items-center justify-center">
        <MicroCopy className="tabular-nums -translate-x-px text-center text-[0.625rem] text-foreground-muted">+2</MicroCopy>
      </div>
    </div>
  );
};

interface AccountItemProps {
  href: string;
  icon: string;
  name: string;
  email: string;
  eventCount: number;
  status?: 'synced' | 'syncing' | 'error';
}

const AccountItem: FC<AccountItemProps> = ({ href, icon, name, email, eventCount, status = 'synced' }) => {
  return (
    <Link href={href} className="rounded-[0.875rem] flex items-center justify-between p-3 hover:backdrop-brightness-95">
      <div className="flex items-center gap-2">
        <Image width={12} height={12} src={icon} alt="" />
        <div className="flex items-center gap-2">
          <Copy className="text-foreground">{name}</Copy>
          <Copy className="text-foreground-muted">{email}</Copy>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Copy className="text-foreground-muted">{eventCount} events</Copy>
        {status === 'synced' && <Check className="text-foreground-muted" size={12} />}
        {status === 'syncing' && <RefreshCw className="text-foreground-muted animate-spin" size={12} />}
        {status === 'error' && <AlertTriangle className="text-foreground-muted" size={12} />}
      </div>
    </Link>
  );
};

const DashboardPage: FC = () => {
  return (
    <div className="flex flex-col gap-12 items-stretch">
      <div className="flex flex-col gap-3 items-stretch">
        <Suspense fallback={null}>
          <DashboardCalendar />
        </Suspense>

        <NavigationMenu className="bg-surface-elevated rounded-2xl shadow-xs border border-border overflow-hidden p-0.5">
          <NavigationDropdownItem
            header={
              <NavigationDropdownHeader>
                <User className="text-foreground-muted" size={15} />
                <NavigationItemLabel>Connected Accounts</NavigationItemLabel>
              </NavigationDropdownHeader>
            }
            rightContent={<AccountsPreview />}
          >
            <div className="flex flex-col">
              <AccountItem href="/dashboard/accounts/1" icon="/integrations/icon-google.svg" name="Personal" email="ridafkih@gmail.com" eventCount={142} status="synced" />
              <AccountItem href="/dashboard/accounts/2" icon="/integrations/icon-google.svg" name="Work" email="rida@ridafkih.dev" eventCount={89} status="error" />
              <AccountItem href="/dashboard/accounts/3" icon="/integrations/icon-icloud.svg" name="Family" email="rida@icloud.com" eventCount={23} status="syncing" />
              <AccountItem href="/dashboard/accounts/4" icon="/integrations/icon-fastmail.svg" name="Personal" email="rida@keeper.sh" eventCount={56} status="synced" />
            </div>
          </NavigationDropdownItem>

          <NavigationItem href="/dashboard/events">
            <NavigationItemIcon>
              <CalendarDays className="text-foreground-muted" size={15} />
              <NavigationItemLabel>Events</NavigationItemLabel>
            </NavigationItemIcon>
            <NavigationItemRightContent />
          </NavigationItem>

          <NavigationItem href="/dashboard/calendars">
            <NavigationItemIcon>
              <Calendar className="text-foreground-muted" size={15} />
              <NavigationItemLabel>Calendars</NavigationItemLabel>
            </NavigationItemIcon>
            <NavigationItemRightContent />
          </NavigationItem>

          <NavigationItem href="/dashboard/filters">
            <NavigationItemIcon>
              <Filter className="text-foreground-muted" size={15} />
              <NavigationItemLabel>Global Event Filters</NavigationItemLabel>
            </NavigationItemIcon>
            <NavigationItemRightContent />
          </NavigationItem>

          <NavigationItem href="/dashboard/settings">
            <NavigationItemIcon>
              <Settings className="text-foreground-muted" size={15} />
              <NavigationItemLabel>Account Settings</NavigationItemLabel>
            </NavigationItemIcon>
            <NavigationItemRightContent />
          </NavigationItem>
        </NavigationMenu>

        <NavigationMenu className="bg-surface-elevated rounded-2xl shadow-xs border border-border overflow-hidden p-0.5">
          <NavigationItem href="/dashboard/logout">
            <NavigationItemIcon>
              <LogOut className="text-foreground-muted" size={15} />
              <NavigationItemLabel>Logout</NavigationItemLabel>
            </NavigationItemIcon>
            <NavigationItemRightContent />
          </NavigationItem>
        </NavigationMenu>
      </div>

      <KeeperLogoDark className="size-8 text-border self-center" />
    </div>
  );
};

export default DashboardPage;

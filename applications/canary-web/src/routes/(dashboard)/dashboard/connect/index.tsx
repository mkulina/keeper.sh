import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Link, Upload } from "lucide-react";
import { LinkButton, ButtonIcon } from "../../../../components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuItemIcon,
  NavigationMenuItemLabel,
  NavigationMenuItemTrailing,
} from "../../../../components/ui/navigation-menu";

export const Route = createFileRoute("/(dashboard)/dashboard/connect/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-1.5">
      <LinkButton to="/dashboard" variant="elevated" size="compact" className="aspect-square">
        <ButtonIcon>
          <ArrowLeft size={16} />
        </ButtonIcon>
      </LinkButton>
      <NavigationMenu>
        <NavigationMenuItem to="/dashboard/connect/google">
          <NavigationMenuItemIcon>
            <img src="/integrations/icon-google.svg" alt="" width={15} height={15} />
            <NavigationMenuItemLabel>Connect Google Calendar</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
          <NavigationMenuItemTrailing />
        </NavigationMenuItem>
        <NavigationMenuItem to="/dashboard/connect/outlook">
          <NavigationMenuItemIcon>
            <img src="/integrations/icon-outlook.svg" alt="" width={15} height={15} />
            <NavigationMenuItemLabel>Connect Outlook</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
          <NavigationMenuItemTrailing />
        </NavigationMenuItem>
        <NavigationMenuItem to="/dashboard/connect/apple">
          <NavigationMenuItemIcon>
            <img src="/integrations/icon-icloud.svg" alt="" width={15} height={15} />
            <NavigationMenuItemLabel>Connect iCloud</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
          <NavigationMenuItemTrailing />
        </NavigationMenuItem>
        <NavigationMenuItem to="/dashboard/connect/microsoft">
          <NavigationMenuItemIcon>
            <img src="/integrations/icon-microsoft-365.svg" alt="" width={15} height={15} />
            <NavigationMenuItemLabel>Connect Microsoft 365</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
          <NavigationMenuItemTrailing />
        </NavigationMenuItem>
        <NavigationMenuItem to="/dashboard/connect/fastmail">
          <NavigationMenuItemIcon>
            <img src="/integrations/icon-fastmail.svg" alt="" width={15} height={15} />
            <NavigationMenuItemLabel>Connect Fastmail</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
          <NavigationMenuItemTrailing />
        </NavigationMenuItem>
      </NavigationMenu>
      <NavigationMenu>
        <NavigationMenuItem to="/dashboard/connect/caldav">
          <NavigationMenuItemIcon>
            <Calendar size={15} />
            <NavigationMenuItemLabel>Connect CalDAV Server</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
          <NavigationMenuItemTrailing />
        </NavigationMenuItem>
      </NavigationMenu>
      <NavigationMenu>
        <NavigationMenuItem to="/dashboard/connect/ical-link">
          <NavigationMenuItemIcon>
            <Link size={15} />
            <NavigationMenuItemLabel>Subscribe to ICS Calendar Feed</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
          <NavigationMenuItemTrailing />
        </NavigationMenuItem>
        <NavigationMenuItem to="/dashboard/connect/ics-file">
          <NavigationMenuItemIcon>
            <Upload size={15} />
            <NavigationMenuItemLabel>Upload ICS Snapshot File</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
          <NavigationMenuItemTrailing />
        </NavigationMenuItem>
      </NavigationMenu>
    </div>
  );
}

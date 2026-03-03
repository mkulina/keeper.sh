import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Lock, Mail, Trash2 } from "lucide-react";
import { LinkButton, Button, ButtonIcon, ButtonText } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
} from "../../../../components/ui/modal";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuItemIcon,
  NavigationMenuItemLabel,
  NavigationMenuItemTrailing,
} from "../../../../components/ui/navigation-menu";
import { Text } from "../../../../components/ui/text";

export const Route = createFileRoute("/(dashboard)/dashboard/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  const email = "user@example.com";
  const passkeyCount = 1;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDeleteAccount = () => {
    setDeleteOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <LinkButton to="/dashboard" variant="elevated" size="compact" className="aspect-square">
        <ButtonIcon>
          <ArrowLeft size={16} />
        </ButtonIcon>
      </LinkButton>
      <NavigationMenu>
        <NavigationMenuItem>
          <NavigationMenuItemIcon>
            <Mail size={15} />
            <NavigationMenuItemLabel>Email</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
          <NavigationMenuItemTrailing>
            <Text size="sm" tone="muted">{email}</Text>
          </NavigationMenuItemTrailing>
        </NavigationMenuItem>
      </NavigationMenu>
      <NavigationMenu>
        <NavigationMenuItem to="/dashboard/settings/change-password">
          <NavigationMenuItemIcon>
            <Lock size={15} />
            <NavigationMenuItemLabel>Change Password</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
          <NavigationMenuItemTrailing />
        </NavigationMenuItem>
        <NavigationMenuItem to="/dashboard/settings/passkeys">
          <NavigationMenuItemIcon>
            <KeyRound size={15} />
            <NavigationMenuItemLabel>Passkeys</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
          <NavigationMenuItemTrailing>
            <Text size="sm" tone="muted">
              {passkeyCount} {passkeyCount === 1 ? "passkey" : "passkeys"}
            </Text>
          </NavigationMenuItemTrailing>
        </NavigationMenuItem>
      </NavigationMenu>
      <NavigationMenu>
        <NavigationMenuItem onClick={() => setDeleteOpen(true)}>
          <NavigationMenuItemIcon>
            <Trash2 size={15} className="text-destructive" />
            <Text size="sm" tone="danger">Delete Account</Text>
          </NavigationMenuItemIcon>
        </NavigationMenuItem>
      </NavigationMenu>
      <Modal open={deleteOpen} onOpenChange={setDeleteOpen}>
        <ModalContent>
          <ModalTitle>Delete account?</ModalTitle>
          <ModalDescription>
            This action is permanent and cannot be undone. All of your data, calendars, and connected accounts will be permanently deleted.
          </ModalDescription>
          <Input type="password" placeholder="Confirm your password" />
          <ModalFooter>
            <Button variant="destructive" className="w-full justify-center" onClick={handleDeleteAccount}>
              <ButtonText>Delete my account</ButtonText>
            </Button>
            <Button variant="elevated" className="w-full justify-center" onClick={() => setDeleteOpen(false)}>
              <ButtonText>Cancel</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

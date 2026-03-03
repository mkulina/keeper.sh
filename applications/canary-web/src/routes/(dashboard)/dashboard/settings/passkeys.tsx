import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Plus } from "lucide-react";
import { LinkButton, Button, ButtonIcon, ButtonText } from "../../../../components/ui/button";
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

export const Route = createFileRoute(
  "/(dashboard)/dashboard/settings/passkeys",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const passkeys = [
    { id: "1", name: "MacBook Pro", createdAt: "Jan 15, 2026" },
  ];

  const [deleteTarget, setDeleteTarget] = useState<typeof passkeys[number] | null>(null);

  const handleDelete = () => {
    setDeleteTarget(null);
  };

  const handleAdd = () => {};

  return (
    <div className="flex flex-col gap-1.5">
      <LinkButton to="/dashboard/settings" variant="elevated" size="compact" className="aspect-square">
        <ButtonIcon>
          <ArrowLeft size={16} />
        </ButtonIcon>
      </LinkButton>
      <NavigationMenu>
        {passkeys.map((passkey) => (
          <NavigationMenuItem key={passkey.id} onClick={() => setDeleteTarget(passkey)}>
            <NavigationMenuItemIcon>
              <KeyRound size={15} />
              <NavigationMenuItemLabel>{passkey.name}</NavigationMenuItemLabel>
            </NavigationMenuItemIcon>
            <NavigationMenuItemTrailing>
              <Text size="sm" tone="muted">{passkey.createdAt}</Text>
            </NavigationMenuItemTrailing>
          </NavigationMenuItem>
        ))}
        <NavigationMenuItem onClick={handleAdd}>
          <NavigationMenuItemIcon>
            <Plus size={15} />
            <NavigationMenuItemLabel>Add Passkey</NavigationMenuItemLabel>
          </NavigationMenuItemIcon>
        </NavigationMenuItem>
      </NavigationMenu>
      <Modal open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <ModalContent>
          <ModalTitle>Delete passkey?</ModalTitle>
          <ModalDescription>
            This will remove "{deleteTarget?.name}" from your account. You won't be able to use it to sign in anymore.
          </ModalDescription>
          <ModalFooter>
            <Button variant="destructive" className="w-full justify-center" onClick={handleDelete}>
              <ButtonText>Delete</ButtonText>
            </Button>
            <Button variant="elevated" className="w-full justify-center" onClick={() => setDeleteTarget(null)}>
              <ButtonText>Cancel</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

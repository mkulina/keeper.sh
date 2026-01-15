"use client";

import type { FC } from "react";
import { SOURCE_PROVIDERS } from "../../data/providers";
import { ProviderSelectionModal } from "../provider-modal/provider-modal";

interface AddSourceModalProps {
  open: boolean;
  onClose: () => void;
}

const AddSourceModal: FC<AddSourceModalProps> = ({ open, onClose }) => {
  const handleConnect = (providerId: string) => {
    console.log("Connecting source:", providerId);
  };

  return (
    <ProviderSelectionModal
      type="source"
      open={open}
      onClose={onClose}
      providers={SOURCE_PROVIDERS}
      title="Add source"
      onConnect={handleConnect}
    />
  );
};

AddSourceModal.displayName = "AddSourceModal";

export { AddSourceModal };
export type { AddSourceModalProps };

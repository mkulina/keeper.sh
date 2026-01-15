"use client";

import type { FC } from "react";
import { DESTINATION_PROVIDERS } from "../../data/providers";
import { ProviderSelectionModal } from "../provider-modal/provider-modal";

interface AddDestinationModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (providerId: string) => void;
}

const AddDestinationModal: FC<AddDestinationModalProps> = ({ open, onClose, onConnect }) => {
  return (
    <ProviderSelectionModal
      type="destination"
      open={open}
      onClose={onClose}
      providers={DESTINATION_PROVIDERS}
      title="Add destination"
      onConnect={onConnect}
    />
  );
};

AddDestinationModal.displayName = "AddDestinationModal";

export { AddDestinationModal };
export type { AddDestinationModalProps };

import type { FC } from "react";
import { AlertTriangle, Check, RefreshCw } from "lucide-react";

interface StatusIconProps {
  status: "synced" | "syncing" | "error" | "reauthenticate";
}

const SyncingIcon = (
  <div className="animate-spin">
    <RefreshCw size={14} className="text-foreground-subtle" />
  </div>
);

const SyncedIcon = <Check size={14} className="text-foreground-subtle" />;

const ReauthIcon = <AlertTriangle size={14} className="text-warning" />;

const ErrorIcon = <div className="size-1 rounded-xl bg-red-500" />;

export const StatusIcon: FC<StatusIconProps> = ({ status }) => {
  if (status === "syncing") {
    return SyncingIcon;
  }
  if (status === "synced") {
    return SyncedIcon;
  }
  if (status === "reauthenticate") {
    return ReauthIcon;
  }
  return ErrorIcon;
};

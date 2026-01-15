import type { FC } from "react";
import Image from "next/image";
import { ListItemCheckbox, ListItemLabel, ListItemValue } from "../../../../components/list";

interface CalendarCheckboxItemProps {
  id: string;
  name: string;
  email: string;
  providerIcon: string;
  providerName: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export const CalendarCheckboxItem: FC<CalendarCheckboxItemProps> = ({
  id,
  name,
  email,
  providerIcon,
  providerName,
  checked,
  defaultChecked,
  onChange,
}) => (
  <ListItemCheckbox id={id} checked={checked} defaultChecked={defaultChecked} onChange={onChange}>
    <div className="flex items-center gap-2">
      <Image src={providerIcon} alt={providerName} width={14} height={14} />
      <ListItemLabel>{name}</ListItemLabel>
      <ListItemValue>{email}</ListItemValue>
    </div>
  </ListItemCheckbox>
);

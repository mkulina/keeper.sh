import type { FC } from "react";
import { ListItemRadio, ListItemLabel } from "@keeper.sh/ui";

interface CalendarRadioItemProps {
  id: string;
  name: string;
  color: string;
  radioName: string;
  value: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (value: string) => void;
}

export const CalendarRadioItem: FC<CalendarRadioItemProps> = ({
  id,
  name,
  color,
  radioName,
  value,
  checked,
  defaultChecked,
  onChange,
}) => (
  <ListItemRadio
    id={id}
    name={radioName}
    value={value}
    checked={checked}
    defaultChecked={defaultChecked}
    onChange={onChange}
  >
    <div className="flex items-center gap-2">
      <div className="size-1 rounded-xl" style={{ backgroundColor: color }} />
      <ListItemLabel>{name}</ListItemLabel>
    </div>
  </ListItemRadio>
);

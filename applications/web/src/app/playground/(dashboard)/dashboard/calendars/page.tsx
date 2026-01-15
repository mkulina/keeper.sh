"use client";

import type { FC } from "react";
import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowDown, Check, RefreshCw, X, Plus } from "lucide-react";
import { Heading2 } from "../../../components/heading";
import { List, ListItemLink, ListItemLabel, ListItemValue, ListItemAdd, ListItem } from "../../../components/list";
import { Copy } from "@/app/playground/components/copy";
import { AddSourceModal } from "../../../compositions/add-source-modal/add-source-modal";
import { Select } from "../../../components/select";
import { Input } from "../../../components/input";
import { cn } from "../../../utils/cn";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../../../components/dropdown-menu";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "../../../compositions/modal/modal";
import { FormField } from "../../../components/form-field";

interface Source {
  id: string;
  name: string;
  email: string;
  provider: {
    id: string;
    name: string;
    icon: string;
  };
  eventCount: number;
  status: "synced" | "syncing" | "error" | "reauthenticate";
}

interface Destination {
  id: string;
  name: string;
  email: string;
  provider: {
    id: string;
    name: string;
    icon: string;
  };
  eventsSynced: number;
  eventsTotal: number;
  status: "synced" | "syncing" | "error" | "reauthenticate";
}

type FilterType = "contains" | "does_not_contain" | "starts_before" | "ends_before" | "starts_after" | "ends_after" | "is_on_weekends" | "is_on_weekdays";

interface Filter {
  id: string;
  type: FilterType;
  value: string;
}

interface Group {
  id: string;
  name: string;
}

const MOCK_GROUPS: Group[] = [
  { id: "group-1", name: "Work" },
  { id: "group-2", name: "Personal" },
  { id: "group-3", name: "Family" },
];

const MOCK_SOURCES: Source[] = [
  {
    id: "source-1",
    name: "Personal",
    email: "john@gmail.com",
    provider: {
      id: "google",
      name: "Google",
      icon: "/integrations/icon-google.svg",
    },
    eventCount: 142,
    status: "synced",
  },
  {
    id: "source-2",
    name: "Work",
    email: "john@company.com",
    provider: {
      id: "google",
      name: "Google",
      icon: "/integrations/icon-google.svg",
    },
    eventCount: 89,
    status: "reauthenticate",
  },
  {
    id: "source-3",
    name: "Family",
    email: "john@icloud.com",
    provider: {
      id: "icloud",
      name: "iCloud",
      icon: "/integrations/icon-icloud.svg",
    },
    eventCount: 23,
    status: "syncing",
  },
];

const MOCK_DESTINATIONS: Destination[] = [
  {
    id: "dest-1",
    name: "Calendar",
    email: "john@outlook.com",
    provider: {
      id: "outlook",
      name: "Outlook",
      icon: "/integrations/icon-outlook.svg",
    },
    eventsSynced: 198,
    eventsTotal: 254,
    status: "syncing",
  },
  {
    id: "dest-2",
    name: "Keeper",
    email: "john@fastmail.com",
    provider: {
      id: "fastmail",
      name: "Fastmail",
      icon: "/integrations/icon-fastmail.svg",
    },
    eventsSynced: 254,
    eventsTotal: 254,
    status: "synced",
  },
];

const INITIAL_FILTERS: Filter[] = [
  {
    id: "filter-1",
    type: "contains",
    value: "meeting",
  },
  {
    id: "filter-2",
    type: "does_not_contain",
    value: "cancelled",
  },
  {
    id: "filter-3",
    type: "starts_after",
    value: "9:00 AM EST",
  },
  {
    id: "filter-4",
    type: "ends_before",
    value: "5:00 PM EST",
  },
  {
    id: "filter-5",
    type: "is_on_weekdays",
    value: "",
  },
];

const formatEventCount = (count: number): string => {
  if (count === 1) {
    return "1 event";
  }
  return `${count} events`;
};

const formatSyncProgress = (synced: number, total: number): string => {
  const percent = Math.round((synced / total) * 100);
  return `${percent}%`;
};

interface StatusIconProps {
  status: "synced" | "syncing" | "error" | "reauthenticate";
}

const StatusIcon: FC<StatusIconProps> = ({ status }) => {
  if (status === "syncing") {
    return <RefreshCw size={14} className="text-neutral-400 animate-spin" />;
  }
  if (status === "synced") {
    return <Check size={14} className="text-neutral-400" />;
  }
  if (status === "reauthenticate") {
    return <AlertTriangle size={14} className="text-amber-400" />;
  }
  return <div className="size-1 rounded-xl bg-red-500" />;
};

interface SourceItemProps {
  source: Source;
}

const SourceItem: FC<SourceItemProps> = ({ source }) => (
  <ListItemLink id={source.id} href={`/playground/dashboard/calendars/sources/${source.id}`}>
    <div className="flex items-center gap-2">
      <Image
        src={source.provider.icon}
        alt={source.provider.name}
        width={14}
        height={14}
      />
      <ListItemLabel>{source.name}</ListItemLabel>
      <ListItemValue>{source.email}</ListItemValue>
    </div>
    <div className="flex items-center gap-3">
      <ListItemValue>{formatEventCount(source.eventCount)}</ListItemValue>
      <StatusIcon status={source.status} />
    </div>
  </ListItemLink>
);

interface DestinationItemProps {
  destination: Destination;
}

const DestinationItem: FC<DestinationItemProps> = ({ destination }) => (
  <ListItemLink id={destination.id} href={`/playground/dashboard/calendars/destinations/${destination.id}`}>
    <div className="flex items-center gap-2">
      <Image
        src={destination.provider.icon}
        alt={destination.provider.name}
        width={14}
        height={14}
      />
      <ListItemLabel>{destination.name}</ListItemLabel>
      <ListItemValue>{destination.email}</ListItemValue>
    </div>
    <div className="flex items-center gap-3">
      <ListItemValue>{formatSyncProgress(destination.eventsSynced, destination.eventsTotal)}</ListItemValue>
      <StatusIcon status={destination.status} />
    </div>
  </ListItemLink>
);

interface FilterItemProps {
  filter: Filter;
  onRemove: (id: string) => void;
}

const getFilterCondition = (type: FilterType): string => {
  switch (type) {
    case "contains":
      return "event summary contains";
    case "does_not_contain":
      return "event summary does not contain";
    case "starts_before":
      return "event starts before";
    case "starts_after":
      return "event starts after";
    case "ends_before":
      return "event ends before";
    case "ends_after":
      return "event ends after";
    case "is_on_weekends":
      return "event is on weekends";
    case "is_on_weekdays":
      return "event is on weekdays";
  }
};

interface FilterItemProps {
  filter: Filter;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

const FilterItem: FC<FilterItemProps> = ({ filter, onEdit, onRemove }) => {
  const renderFilterText = () => {
    switch (filter.type) {
      case "is_on_weekends":
        return (
          <>
            <span className="text-neutral-400">event is </span>
            <span className="text-neutral-900">on weekends</span>
          </>
        );
      case "is_on_weekdays":
        return (
          <>
            <span className="text-neutral-400">event is </span>
            <span className="text-neutral-900">on weekdays</span>
          </>
        );
      case "contains":
        return (
          <>
            <span className="text-neutral-400">event summary </span>
            <span className="text-neutral-900">contains</span>
            <span className="text-neutral-400"> </span>
            <span className="text-neutral-900">"{filter.value}"</span>
          </>
        );
      case "does_not_contain":
        return (
          <>
            <span className="text-neutral-400">event summary </span>
            <span className="text-neutral-900">does not contain</span>
            <span className="text-neutral-400"> </span>
            <span className="text-neutral-900">"{filter.value}"</span>
          </>
        );
      case "starts_before":
        return (
          <>
            <span className="text-neutral-400">event starts </span>
            <span className="text-neutral-900">before</span>
            <span className="text-neutral-400"> </span>
            <span className="text-neutral-900">{filter.value}</span>
          </>
        );
      case "starts_after":
        return (
          <>
            <span className="text-neutral-400">event starts </span>
            <span className="text-neutral-900">after</span>
            <span className="text-neutral-400"> </span>
            <span className="text-neutral-900">{filter.value}</span>
          </>
        );
      case "ends_before":
        return (
          <>
            <span className="text-neutral-400">event ends </span>
            <span className="text-neutral-900">before</span>
            <span className="text-neutral-400"> </span>
            <span className="text-neutral-900">{filter.value}</span>
          </>
        );
      case "ends_after":
        return (
          <>
            <span className="text-neutral-400">event ends </span>
            <span className="text-neutral-900">after</span>
            <span className="text-neutral-400"> </span>
            <span className="text-neutral-900">{filter.value}</span>
          </>
        );
    }
  };

  return (
    <ListItem id={filter.id}>
      <button
        type="button"
        onClick={() => onEdit(filter.id)}
        className="flex-1 text-left"
      >
        <div className="text-xs">
          {renderFilterText()}
        </div>
      </button>
      <button
        type="button"
        onClick={() => onRemove(filter.id)}
        className="text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        <X size={14} />
      </button>
    </ListItem>
  );
};

const CalendarsPage = () => {
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [filters, setFilters] = useState<Filter[]>(INITIAL_FILTERS);
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(MOCK_GROUPS[0]?.id ?? "");
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("contains");
  const [filterValue, setFilterValue] = useState("");
  const [timeValue, setTimeValue] = useState("09:00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");
  const [timezone, setTimezone] = useState("EST");

  const handleRemoveFilter = (id: string) => {
    setFilters((prev) => prev.filter((filter) => filter.id !== id));
  };

  const handleEditFilter = (id: string) => {
    const filter = filters.find((f) => f.id === id);
    if (filter) {
      setEditingFilterId(id);
      setFilterType(filter.type);

      const isTimeFilter = ["starts_before", "starts_after", "ends_before", "ends_after"].includes(filter.type);
      if (isTimeFilter && filter.value) {
        const match = filter.value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*([A-Z]{3})/);
        if (match && match[1] && match[2] && match[3] && match[4]) {
          setTimeValue(`${match[1].padStart(2, "0")}:${match[2]}`);
          setTimePeriod(match[3] as "AM" | "PM");
          setTimezone(match[4]);
        }
      } else {
        setFilterValue(filter.value);
      }

      setFilterModalOpen(true);
    }
  };

  const handleAddFilter = () => {
    setEditingFilterId(null);
    setFilterType("contains");
    setFilterValue("");
    setTimeValue("09:00");
    setTimePeriod("AM");
    setTimezone("EST");
    setFilterModalOpen(true);
  };

  const handleSaveFilter = () => {
    const isTimeFilter = ["starts_before", "starts_after", "ends_before", "ends_after"].includes(filterType);
    const finalValue = isTimeFilter
      ? `${timeValue.replace(/^0/, "")} ${timePeriod} ${timezone}`
      : filterValue;

    if (editingFilterId) {
      setFilters((prev) =>
        prev.map((filter) =>
          filter.id === editingFilterId ? { ...filter, type: filterType, value: finalValue } : filter
        )
      );
    } else {
      const newFilter: Filter = {
        id: `filter-${Date.now()}`,
        type: filterType,
        value: finalValue,
      };
      setFilters((prev) => [...prev, newFilter]);
    }
    setFilterModalOpen(false);
  };

  const handleAddGroup = () => {
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: `Group ${groups.length + 1}`,
    };
    setGroups((prev) => [...prev, newGroup]);
    setSelectedGroupId(newGroup.id);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Heading2>Sources</Heading2>
        <Copy className="text-xs">Calendars for which events may be sourced, these events are pooled and can be used to push events to destinations.</Copy>
        <List>
          {MOCK_SOURCES.map((source) => (
            <SourceItem key={source.id} source={source} />
          ))}
          <ListItemAdd onClick={() => setAddSourceOpen(true)}>Add source</ListItemAdd>
        </List>
      </div>

      <ArrowDown size={20} className="text-neutral-300 mx-auto" />

      <div className="flex flex-col gap-2">
        <Heading2>Filters</Heading2>
        <Copy className="text-xs">Define rules to filter events from your sources. Only events matching these criteria will be synced to your destinations.</Copy>
        <List>
          {filters.map((filter) => (
            <FilterItem
              key={filter.id}
              filter={filter}
              onEdit={handleEditFilter}
              onRemove={handleRemoveFilter}
            />
          ))}
          <ListItemAdd onClick={handleAddFilter}>Add filter</ListItemAdd>
        </List>
      </div>

      <ArrowDown size={20} className="text-neutral-300 mx-auto" />

      <div className="flex flex-col gap-2">
        <Heading2>Destinations</Heading2>
        <Copy className="text-xs">When events are pulled from sources, they can be pushed to destinations. Destinations require special permissions to write events to.</Copy>
        <List>
          {MOCK_DESTINATIONS.map((destination) => (
            <DestinationItem key={destination.id} destination={destination} />
          ))}
          <ListItemAdd>Add destination</ListItemAdd>
        </List>
      </div>

      <AddSourceModal open={addSourceOpen} onClose={() => setAddSourceOpen(false)} />

      <Modal open={filterModalOpen} onClose={() => setFilterModalOpen(false)}>
        <ModalHeader
          title={editingFilterId ? "Edit Filter" : "Add Filter"}
          description="Configure the filter criteria for your events"
          onClose={() => setFilterModalOpen(false)}
        />
        <ModalContent>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">Filter Type</label>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
            >
              <option value="contains">Event summary contains</option>
              <option value="does_not_contain">Event summary does not contain</option>
              <option value="starts_before">Event starts before</option>
              <option value="starts_after">Event starts after</option>
              <option value="ends_before">Event ends before</option>
              <option value="ends_after">Event ends after</option>
              <option value="is_on_weekends">Event is on weekends</option>
              <option value="is_on_weekdays">Event is on weekdays</option>
            </Select>
          </div>

          {filterType !== "is_on_weekends" && filterType !== "is_on_weekdays" && (
            <>
              {(filterType === "contains" || filterType === "does_not_contain") ? (
                <FormField
                  label="Value"
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder="Enter text..."
                />
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-neutral-700">Time</label>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={timeValue}
                        onChange={(e) => setTimeValue(e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={timePeriod}
                        onChange={(e) => setTimePeriod(e.target.value as "AM" | "PM")}
                        className="w-24"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-neutral-700">Timezone</label>
                    <Select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="EST">EST</option>
                      <option value="CST">CST</option>
                      <option value="MST">MST</option>
                      <option value="PST">PST</option>
                      <option value="UTC">UTC</option>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}
        </ModalContent>
        <ModalFooter
          onCancel={() => setFilterModalOpen(false)}
          onConfirm={handleSaveFilter}
          cancelText="Cancel"
          confirmText={editingFilterId ? "Save" : "Add"}
        />
      </Modal>
    </div>
  );
};

export default CalendarsPage;

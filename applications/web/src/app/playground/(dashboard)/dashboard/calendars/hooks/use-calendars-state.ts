import { useReducer } from "react";
import type { Filter, FilterType, Group } from "../types";
import { MOCK_GROUPS, INITIAL_FILTERS } from "../utils/mock-data";

const TIME_FILTER_TYPES = new Set<FilterType>([
  "starts_before",
  "starts_after",
  "ends_before",
  "ends_after"
]);

interface CalendarsState {
  addSourceOpen: boolean;
  filters: Filter[];
  groups: Group[];
  selectedGroupId: string;
  editingFilterId: string | null;
  filterModalOpen: boolean;
  filterType: FilterType;
  filterValue: string;
  timeValue: string;
  timePeriod: "AM" | "PM";
  timezone: string;
}

type CalendarsAction =
  | { type: "OPEN_ADD_SOURCE" }
  | { type: "CLOSE_ADD_SOURCE" }
  | { type: "ADD_FILTER" }
  | { type: "EDIT_FILTER"; filterId: string; filter: Filter }
  | { type: "SAVE_FILTER" }
  | { type: "REMOVE_FILTER"; filterId: string }
  | { type: "CLOSE_FILTER_MODAL" }
  | { type: "SET_FILTER_TYPE"; filterType: FilterType }
  | { type: "SET_FILTER_VALUE"; value: string }
  | { type: "SET_TIME_VALUE"; value: string }
  | { type: "SET_TIME_PERIOD"; period: "AM" | "PM" }
  | { type: "SET_TIMEZONE"; timezone: string }
  | { type: "ADD_GROUP" }
  | { type: "SET_SELECTED_GROUP"; groupId: string };

const initialState: CalendarsState = {
  addSourceOpen: false,
  filters: INITIAL_FILTERS,
  groups: MOCK_GROUPS,
  selectedGroupId: MOCK_GROUPS[0]?.id ?? "",
  editingFilterId: null,
  filterModalOpen: false,
  filterType: "contains",
  filterValue: "",
  timeValue: "09:00",
  timePeriod: "AM",
  timezone: "EST",
};

const parseTimeFilter = (value: string) => {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*([A-Z]{3})/);
  if (match && match[1] && match[2] && match[3] && match[4]) {
    return {
      timeValue: `${match[1].padStart(2, "0")}:${match[2]}`,
      timePeriod: match[3] as "AM" | "PM",
      timezone: match[4],
    };
  }
  return null;
};

function calendarsReducer(state: CalendarsState, action: CalendarsAction): CalendarsState {
  switch (action.type) {
    case "OPEN_ADD_SOURCE":
      return { ...state, addSourceOpen: true };

    case "CLOSE_ADD_SOURCE":
      return { ...state, addSourceOpen: false };

    case "ADD_FILTER":
      return {
        ...state,
        editingFilterId: null,
        filterModalOpen: true,
        filterType: "contains",
        filterValue: "",
        timeValue: "09:00",
        timePeriod: "AM",
        timezone: "EST",
      };

    case "EDIT_FILTER": {
      const isTimeFilter = TIME_FILTER_TYPES.has(action.filter.type);

      if (isTimeFilter && action.filter.value) {
        const parsed = parseTimeFilter(action.filter.value);
        if (parsed) {
          return {
            ...state,
            editingFilterId: action.filterId,
            filterModalOpen: true,
            filterType: action.filter.type,
            filterValue: "",
            ...parsed,
          };
        }
      }

      return {
        ...state,
        editingFilterId: action.filterId,
        filterModalOpen: true,
        filterType: action.filter.type,
        filterValue: action.filter.value,
        timeValue: "09:00",
        timePeriod: "AM",
        timezone: "EST",
      };
    }

    case "SAVE_FILTER": {
      const isTimeFilter = TIME_FILTER_TYPES.has(state.filterType);
      const finalValue = isTimeFilter
        ? `${state.timeValue.replace(/^0/, "")} ${state.timePeriod} ${state.timezone}`
        : state.filterValue;

      if (state.editingFilterId) {
        return {
          ...state,
          filters: state.filters.map((filter) =>
            filter.id === state.editingFilterId
              ? { ...filter, type: state.filterType, value: finalValue }
              : filter
          ),
          filterModalOpen: false,
        };
      }

      const newFilter: Filter = {
        id: `filter-${Date.now()}`,
        type: state.filterType,
        value: finalValue,
      };

      return {
        ...state,
        filters: [...state.filters, newFilter],
        filterModalOpen: false,
      };
    }

    case "REMOVE_FILTER":
      return {
        ...state,
        filters: state.filters.filter((filter) => filter.id !== action.filterId),
      };

    case "CLOSE_FILTER_MODAL":
      return { ...state, filterModalOpen: false };

    case "SET_FILTER_TYPE":
      return { ...state, filterType: action.filterType };

    case "SET_FILTER_VALUE":
      return { ...state, filterValue: action.value };

    case "SET_TIME_VALUE":
      return { ...state, timeValue: action.value };

    case "SET_TIME_PERIOD":
      return { ...state, timePeriod: action.period };

    case "SET_TIMEZONE":
      return { ...state, timezone: action.timezone };

    case "ADD_GROUP": {
      const newGroup: Group = {
        id: `group-${Date.now()}`,
        name: `Group ${state.groups.length + 1}`,
      };
      return {
        ...state,
        groups: [...state.groups, newGroup],
        selectedGroupId: newGroup.id,
      };
    }

    case "SET_SELECTED_GROUP":
      return { ...state, selectedGroupId: action.groupId };

    default:
      return state;
  }
}

export function useCalendarsState() {
  const [state, dispatch] = useReducer(calendarsReducer, initialState);

  return {
    state,
    actions: {
      openAddSource: () => dispatch({ type: "OPEN_ADD_SOURCE" }),
      closeAddSource: () => dispatch({ type: "CLOSE_ADD_SOURCE" }),
      addFilter: () => dispatch({ type: "ADD_FILTER" }),
      editFilter: (filterId: string, filter: Filter) =>
        dispatch({ type: "EDIT_FILTER", filterId, filter }),
      saveFilter: () => dispatch({ type: "SAVE_FILTER" }),
      removeFilter: (filterId: string) => dispatch({ type: "REMOVE_FILTER", filterId }),
      closeFilterModal: () => dispatch({ type: "CLOSE_FILTER_MODAL" }),
      setFilterType: (filterType: FilterType) => dispatch({ type: "SET_FILTER_TYPE", filterType }),
      setFilterValue: (value: string) => dispatch({ type: "SET_FILTER_VALUE", value }),
      setTimeValue: (value: string) => dispatch({ type: "SET_TIME_VALUE", value }),
      setTimePeriod: (period: "AM" | "PM") => dispatch({ type: "SET_TIME_PERIOD", period }),
      setTimezone: (timezone: string) => dispatch({ type: "SET_TIMEZONE", timezone }),
      addGroup: () => dispatch({ type: "ADD_GROUP" }),
      setSelectedGroup: (groupId: string) => dispatch({ type: "SET_SELECTED_GROUP", groupId }),
    },
  };
}

"use client";

import {
  createContext,
  use,
  useRef,
  useState,
  useEffect,
  useMemo,
  type FC,
  type PropsWithChildren,
  type RefObject,
} from "react";
import { useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import {
  groupDatesByMonth,
  generateWeeks,
  getVirtualListStartDate,
  type MonthSpan,
} from "../utils/date-utils";
import { TOTAL_WEEKS, CURRENT_WEEK_INDEX } from "../utils/constants";

interface DashboardCalendarState {
  isReady: boolean;
  firstVisibleRowIndex: number;
  scrollDirection: "up" | "down";
  weeks: Date[][];
  virtualListStartDate: Date;
  monthSpans: MonthSpan[];
  monthCompositionKey: string;
}

interface DashboardCalendarMeta {
  containerRef: RefObject<HTMLDivElement | null>;
  calendarRef: RefObject<HTMLDivElement | null>;
  weekColumnRef: RefObject<HTMLDivElement | null>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
}

interface DashboardCalendarContextValue {
  state: DashboardCalendarState;
  meta: DashboardCalendarMeta;
}

const DashboardCalendarContext =
  createContext<DashboardCalendarContextValue | null>(null);

const DashboardCalendarProvider: FC<PropsWithChildren> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const weekColumnRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [firstVisibleRowIndex, setFirstVisibleRowIndex] = useState(
    CURRENT_WEEK_INDEX - 1
  );
  const scrollDirectionRef = useRef<"up" | "down">("down");
  const prevScrollTop = useRef(0);

  const { weeks, virtualListStartDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    return {
      weeks: generateWeeks(TOTAL_WEEKS, startOfWeek, CURRENT_WEEK_INDEX),
      virtualListStartDate: getVirtualListStartDate(
        startOfWeek,
        CURRENT_WEEK_INDEX
      ),
    };
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: weeks.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => {
      if (!containerRef.current) return 100;
      const containerHeight = containerRef.current.clientHeight;
      return containerHeight / 4 + 1;
    },
    overscan: 3,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      rowVirtualizer.measure();
      rowVirtualizer.scrollToIndex(CURRENT_WEEK_INDEX - 1, { align: "start" });
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const weekColumn = weekColumnRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;

      if (weekColumn) {
        weekColumn.style.transform = `translateY(${-currentScrollTop}px)`;
      }

      const rowHeight = container.clientHeight / 4 + 1;
      const actualFirstVisibleIndex = Math.floor(currentScrollTop / rowHeight);
      setFirstVisibleRowIndex(actualFirstVisibleIndex);

      if (currentScrollTop > prevScrollTop.current) {
        scrollDirectionRef.current = "down";
      } else if (currentScrollTop < prevScrollTop.current) {
        scrollDirectionRef.current = "up";
      }
      prevScrollTop.current = currentScrollTop;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const rowDates = weeks[firstVisibleRowIndex] || [];
  const monthSpans = groupDatesByMonth(rowDates);
  const monthCompositionKey = monthSpans
    .map((span) => `${span.month}-${span.year}`)
    .join("_");

  // scrollDirection is read here (snapshot at the time monthSpans change),
  // not subscribed to as state — avoids re-renders on every scroll tick.
  const scrollDirection = scrollDirectionRef.current;

  const value: DashboardCalendarContextValue = useMemo(
    () => ({
      state: {
        isReady,
        firstVisibleRowIndex,
        scrollDirection,
        weeks,
        virtualListStartDate,
        monthSpans,
        monthCompositionKey,
      },
      meta: {
        containerRef,
        calendarRef,
        weekColumnRef,
        rowVirtualizer,
      },
    }),
    [
      isReady,
      firstVisibleRowIndex,
      scrollDirection,
      weeks,
      virtualListStartDate,
      monthCompositionKey,
      rowVirtualizer,
    ]
  );

  return (
    <DashboardCalendarContext value={value}>{children}</DashboardCalendarContext>
  );
};

const useDashboardCalendar = (): DashboardCalendarContextValue => {
  const context = use(DashboardCalendarContext);
  if (!context) {
    throw new Error(
      "useDashboardCalendar must be used within a DashboardCalendarProvider"
    );
  }
  return context;
};

export { DashboardCalendarProvider, useDashboardCalendar };

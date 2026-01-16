import type { Metadata } from "next";
import { Heading1, Copy } from "@keeper.sh/ui";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard - Keeper",
  description: "View your calendar overview and upcoming events",
};

const DashboardPage = () => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-2">
      <Heading1>Welcome, Rida</Heading1>
      <Copy>It&apos;s Friday the 9th and you&apos;ve got 5 events today across 2 calendars.</Copy>
    </div>
    <DashboardContent />
  </div>
);

export default DashboardPage;

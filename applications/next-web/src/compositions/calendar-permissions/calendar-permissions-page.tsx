import type { FC } from "react"
import { FlexColumnGroup } from "@/components/flex-column-group"
import { Heading1 } from "@/components/heading"
import { Copy } from "@/components/copy"
import { Divider } from "@/components/divider"
import { CalendarPermissionsList } from "./calendar-permissions-list"
import { CalendarPermissionsForm } from "./calendar-permissions-form"
import { CalendarPermissionsSkipLink } from "./components/calendar-permissions-skip-link"
import { CalendarPermissionsIconPair } from "./components/calendar-permissions-icon-pair"

type CalendarPermissionsPageProps = {
  provider: "google" | "outlook"
  providerName: string
  permissions: string[]
  backHref?: string
}

export const CalendarPermissionsPage: FC<CalendarPermissionsPageProps> = ({ provider, providerName, permissions, backHref = "/login" }) => {
  return (
    <main className="flex size-full items-center justify-center min-h-screen">
      <div className="w-full max-w-sm px-1.5">
        <FlexColumnGroup className="gap-2">
          <div className="p-2 border border-border rounded-3xl shadow-xs">
            <FlexColumnGroup className="border border-border rounded-2xl p-3 pt-8 shadow-xs gap-2">
              <FlexColumnGroup className="gap-2 px-2 text-center">
                <CalendarPermissionsIconPair provider={provider} />
                <FlexColumnGroup className="gap-2 items-center">
                  <Heading1>Connect {providerName}</Heading1>
                  <Copy className="max-w-[32ch]">Start importing your calendars, events, and syncing them across each other.</Copy>
                </FlexColumnGroup>
              </FlexColumnGroup>
              <div className="flex flex-col">
                <div className="px-2 py-4">
                  <CalendarPermissionsList items={permissions} />
                </div>
                <Divider className="my-4 mt-0" />
                <CalendarPermissionsForm provider={provider} backHref={backHref} />
              </div>
            </FlexColumnGroup>
          </div>
          <CalendarPermissionsSkipLink href="/login">
            Don&apos;t import my calendars yet, just log me in.
          </CalendarPermissionsSkipLink>
        </FlexColumnGroup>
      </div>
    </main>
  )
}

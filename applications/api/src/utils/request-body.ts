import { type } from "arktype";

const calendarIdsBodySchema = type({
  calendarIds: "string[]",
  "+": "reject",
});
type CalendarIdsBody = typeof calendarIdsBodySchema.infer;

const sourcePatchBodySchema = type({
  "name?": "string",
  "customEventName?": "string",
  "excludeAllDayEvents?": "boolean",
  "excludeEventDescription?": "boolean",
  "excludeEventLocation?": "boolean",
  "excludeEventName?": "boolean",
  "excludeFocusTime?": "boolean",
  "excludeOutOfOffice?": "boolean",
  "excludeWorkingLocation?": "boolean",
  "includeInIcalFeed?": "boolean",
  "+": "reject",
});
type SourcePatchBody = typeof sourcePatchBodySchema.infer;

const icalSettingsPatchBodySchema = type({
  "includeEventName?": "boolean",
  "includeEventDescription?": "boolean",
  "includeEventLocation?": "boolean",
  "excludeAllDayEvents?": "boolean",
  "customEventName?": "string",
  "+": "reject",
});
type IcalSettingsPatchBody = typeof icalSettingsPatchBodySchema.infer;

export { calendarIdsBodySchema, sourcePatchBodySchema, icalSettingsPatchBodySchema };
export type { CalendarIdsBody, SourcePatchBody, IcalSettingsPatchBody };

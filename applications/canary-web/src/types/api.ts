export interface CalendarAccount {
  id: string;
  provider: string;
  displayName: string | null;
  email: string | null;
  authType: string;
  needsReauthentication: boolean;
  calendarCount: number;
  createdAt: string;
}

export interface CalendarSource {
  id: string;
  name: string;
  calendarType: string;
  capabilities: string[];
  accountId: string;
  provider: string;
  displayName: string | null;
  email: string | null;
  needsReauthentication: boolean;
}

export interface CalendarDetail {
  id: string;
  name: string;
  calendarType: string;
  capabilities: string[];
  provider: string;
  url: string | null;
  calendarUrl: string | null;
  excludeAllDayEvents: boolean;
  excludeEventDescription: boolean;
  excludeEventLocation: boolean;
  excludeEventName: boolean;
  excludeFocusTime: boolean;
  excludeOutOfOffice: boolean;
  excludeWorkingLocation: boolean;
  destinationIds: string[];
  sourceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEntry {
  id: string;
  name: string;
  calendarType: string;
  capabilities: string[];
  provider?: string;
}

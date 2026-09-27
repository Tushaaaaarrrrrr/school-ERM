// ============================================================================
// School Operational Status Utility (Live OPEN / CLOSED / HOLIDAY Engine)
// ============================================================================

import { School, SchoolHoliday, SchoolDayKey, SchoolHours } from '@/lib/types';

export interface SchoolOperationalStatus {
  status: 'open' | 'closed' | 'holiday';
  title: string;
  subtitle: string;
  badgeLabel: string;
  colorTheme: 'emerald' | 'rose' | 'amber' | 'slate';
  dayLabel: string;
  dayKey: SchoolDayKey;
  currentTimeStr: string;
  formattedTodayHours: string;
  isTodayConfiguredOpen: boolean;
  startTimeFormatted?: string;
  endTimeFormatted?: string;
  nextOpeningText: string;
  holidayName?: string;
  holidayDetails?: string;
  timeRemainingText?: string;
}

export const DEFAULT_WEEKLY_HOURS: SchoolHours = {
  monday: { is_open: true, start_time: '08:00', end_time: '14:00' },
  tuesday: { is_open: true, start_time: '08:00', end_time: '14:00' },
  wednesday: { is_open: true, start_time: '08:00', end_time: '14:00' },
  thursday: { is_open: true, start_time: '08:00', end_time: '14:00' },
  friday: { is_open: true, start_time: '08:00', end_time: '14:00' },
  saturday: { is_open: true, start_time: '08:00', end_time: '14:00' },
  sunday: { is_open: false, start_time: '08:00', end_time: '14:00' },
};

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1].padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`;
}

export function calculateSchoolStatus(
  school: School | null | undefined,
  holidays: SchoolHoliday[] = [],
  now: Date = new Date()
): SchoolOperationalStatus {
  const timezone = school?.timezone || 'Asia/Kolkata';

  // 1. Get current date parts in school's timezone
  const formatterWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: timezone });
  const formatterDate = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone });
  const formatterTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone });
  const formatterHour24 = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone });

  const dayLabel = formatterWeekday.format(now);
  const dayKey = dayLabel.toLowerCase() as SchoolDayKey;
  const todayDateStr = formatterDate.format(now); // YYYY-MM-DD
  const currentTimeStr = formatterTime.format(now); // e.g. "8:52 PM"
  const time24Str = formatterHour24.format(now); // e.g. "20:52"

  const [currH, currM] = time24Str.split(':').map(Number);
  const currentMinutes = (currH || 0) * 60 + (currM || 0);

  // 2. Check Calendar Holidays
  const matchingHoliday = holidays.find((h) => {
    const start = h.start_date;
    const end = h.end_date || h.start_date;
    return todayDateStr >= start && todayDateStr <= end;
  });

  if (matchingHoliday) {
    return {
      status: 'holiday',
      title: `Official Holiday: ${matchingHoliday.name}`,
      subtitle: matchingHoliday.reason
        ? `${matchingHoliday.reason} (${matchingHoliday.start_date} to ${matchingHoliday.end_date || matchingHoliday.start_date})`
        : `School is closed for ${matchingHoliday.name} today.`,
      badgeLabel: 'HOLIDAY',
      colorTheme: 'amber',
      dayLabel,
      dayKey,
      currentTimeStr,
      formattedTodayHours: 'School Closed for Holiday',
      isTodayConfiguredOpen: false,
      nextOpeningText: 'Classes will resume after official holiday schedule',
      holidayName: matchingHoliday.name,
      holidayDetails: matchingHoliday.description || matchingHoliday.reason,
    };
  }

  // 3. Weekly timings configuration
  const hoursConfig: SchoolHours = school?.school_hours || school?.weekly_timings || DEFAULT_WEEKLY_HOURS;
  const todayHours = hoursConfig[dayKey] || DEFAULT_WEEKLY_HOURS[dayKey];

  if (!todayHours || !todayHours.is_open) {
    // Scheduled off (e.g. Sunday)
    return {
      status: 'closed',
      title: `School Closed (${dayLabel} Off)`,
      subtitle: `Scheduled weekly off day. No academic sessions or classes scheduled today.`,
      badgeLabel: 'CLOSED (WEEKLY OFF)',
      colorTheme: 'rose',
      dayLabel,
      dayKey,
      currentTimeStr,
      formattedTodayHours: 'Scheduled Weekly Off',
      isTodayConfiguredOpen: false,
      nextOpeningText: 'School reopens on the next scheduled working day at 08:00 AM',
    };
  }

  const startTimeStr = todayHours.start_time || '08:00';
  const endTimeStr = todayHours.end_time || '14:00';

  const [startH, startM] = startTimeStr.split(':').map(Number);
  const startMinutes = (startH || 0) * 60 + (startM || 0);

  const [endH, endM] = endTimeStr.split(':').map(Number);
  const endMinutes = (endH || 0) * 60 + (endM || 0);

  const formattedStart = formatTime12h(startTimeStr);
  const formattedEnd = formatTime12h(endTimeStr);
  const formattedTodayHours = `${formattedStart} – ${formattedEnd}`;

  // Case A: Before opening hours
  if (currentMinutes < startMinutes) {
    const diffMins = startMinutes - currentMinutes;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    const opensIn = hrs > 0 ? `in ${hrs} hr ${mins} min` : `in ${mins} min`;

    return {
      status: 'closed',
      title: `School Closed • Opens at ${formattedStart}`,
      subtitle: `Today's session starts ${opensIn}. Today's scheduled timing: ${formattedTodayHours}.`,
      badgeLabel: 'CLOSED (OPENS SOON)',
      colorTheme: 'slate',
      dayLabel,
      dayKey,
      currentTimeStr,
      formattedTodayHours,
      isTodayConfiguredOpen: true,
      startTimeFormatted: formattedStart,
      endTimeFormatted: formattedEnd,
      nextOpeningText: `Classes begin today at ${formattedStart}`,
      timeRemainingText: `Opens in ${hrs > 0 ? `${hrs}h ` : ''}${mins}m`,
    };
  }

  // Case B: Currently Open (In Session)
  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    const remainingMins = endMinutes - currentMinutes;
    const hrs = Math.floor(remainingMins / 60);
    const mins = remainingMins % 60;
    const closesIn = hrs > 0 ? `${hrs}h ${mins}m remaining` : `${mins}m remaining`;

    return {
      status: 'open',
      title: 'School is OPEN & In Session',
      subtitle: `Classes are actively in progress. School hours today: ${formattedTodayHours}.`,
      badgeLabel: 'OPEN NOW',
      colorTheme: 'emerald',
      dayLabel,
      dayKey,
      currentTimeStr,
      formattedTodayHours,
      isTodayConfiguredOpen: true,
      startTimeFormatted: formattedStart,
      endTimeFormatted: formattedEnd,
      nextOpeningText: `Closes today at ${formattedEnd}`,
      timeRemainingText: closesIn,
    };
  }

  // Case C: After Closing Time (e.g. after 2:00 PM)
  return {
    status: 'closed',
    title: 'School Closed for the Day',
    subtitle: `School hours ended at ${formattedEnd} today (Session was ${formattedTodayHours}).`,
    badgeLabel: 'CLOSED FOR TODAY',
    colorTheme: 'rose',
    dayLabel,
    dayKey,
    currentTimeStr,
    formattedTodayHours,
    isTodayConfiguredOpen: true,
    startTimeFormatted: formattedStart,
    endTimeFormatted: formattedEnd,
    nextOpeningText: `Next working session starts tomorrow at 08:00 AM`,
    timeRemainingText: 'Session concluded',
  };
}

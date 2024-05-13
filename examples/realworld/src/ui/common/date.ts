import { format } from "date-fns"

export function formatMonthAndDay(date: Date) {
  return format(date, "MMM do")
}

export function formatMonthDayYear(date: Date) {
  return format(date, "MMM do yyyy")
}

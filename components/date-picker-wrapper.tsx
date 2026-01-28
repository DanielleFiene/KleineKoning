/**
 * components/date-picker-wrapper.tsx
 * 
 * Wrapper component voor MUI DatePicker die dynamisch wordt geladen om bundle size te verkleinen.
 * Dit voorkomt dat de grote @mui/x-date-pickers library in de initial bundle komt.
 */
"use client";

import dynamic from "next/dynamic";
import { DatePickerProps } from "@mui/x-date-pickers/DatePicker";

// Dynamically load DatePicker to reduce initial bundle size
const DatePicker = dynamic(
  () => import("@mui/x-date-pickers/DatePicker").then((mod) => ({ default: mod.DatePicker })),
  { 
    ssr: false,
    loading: () => <div style={{ minHeight: 56 }} /> // Placeholder height
  }
);

interface DatePickerWrapperProps extends Omit<DatePickerProps<any>, "value" | "onChange"> {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export function DatePickerWrapper(props: DatePickerWrapperProps) {
  return <DatePicker {...props} />;
}

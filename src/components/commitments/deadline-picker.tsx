"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DEADLINE_PRESETS } from "@/lib/constants";

interface DeadlinePickerProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
}

export function DeadlinePicker({ value, onChange }: DeadlinePickerProps) {
  const [timeStr, setTimeStr] = useState(
    value ? format(value, "HH:mm") : "23:59",
  );

  function applyTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const result = new Date(date);
    result.setHours(hours ?? 23, minutes ?? 59, 0, 0);
    return result;
  }

  function handlePreset(getValue: () => Date) {
    const preset = getValue();
    onChange(applyTime(preset, timeStr));
  }

  function handleCalendarSelect(date: Date | undefined) {
    if (!date) return;
    onChange(applyTime(date, timeStr));
  }

  function handleTimeChange(newTime: string) {
    setTimeStr(newTime);
    if (value) {
      onChange(applyTime(value, newTime));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {DEADLINE_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handlePreset(preset.getValue)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="flex-1 justify-start text-left font-normal"
              />
            }
          >
            <CalendarIcon className="size-4 text-zinc-400" />
            {value ? format(value, "MMM d, yyyy") : "Pick a date"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleCalendarSelect}
              disabled={(date) => startOfDay(date) < startOfDay(new Date())}
            />
          </PopoverContent>
        </Popover>

        <div className="flex flex-col gap-1">
          <Input
            type="time"
            value={timeStr}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-28"
          />
        </div>
      </div>

      {value && (
        <p className="text-xs text-zinc-400">
          {format(value, "EEEE, MMMM d, yyyy 'at' h:mm a")}
        </p>
      )}
    </div>
  );
}

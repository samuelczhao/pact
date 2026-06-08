"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Notification } from "@/lib/types/database";

async function fetchNotifications(
  setNotifications: (n: Notification[]) => void,
) {
  const res = await fetch("/api/notifications");
  if (res.ok) setNotifications(await res.json());
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const markedRef = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    const wrappedSet = (n: Notification[]) => {
      if (!cancelled) setNotifications(n);
    };

    fetchNotifications(wrappedSet);

    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => {
          fetchNotifications(wrappedSet);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((n) => !n.read && !markedRef.current.has(n.id))
      .map((n) => n.id);
    if (unreadIds.length === 0) return;

    unreadIds.forEach((id) => markedRef.current.add(id));

    setNotifications((prev) =>
      prev.map((n) =>
        unreadIds.includes(n.id) ? { ...n, read: true } : n,
      ),
    );

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unreadIds }),
    });
  }, [notifications]);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      markAllRead();
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleClick(n: Notification) {
    if (n.commitment_id) {
      router.push(`/commitments/${n.commitment_id}`);
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" />}
      >
        <div className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))]">
        <p className="mb-2 text-sm font-medium text-zinc-100">
          Notifications
        </p>
        {notifications.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">
            No notifications
          </p>
        ) : (
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={`flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-zinc-800 ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <p className="text-sm text-zinc-100">{n.message}</p>
                <p className="text-xs text-zinc-500">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronsUpDown, Check, User, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const DEBOUNCE_MS = 300;

interface UserResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface PartnerEntry {
  partner_id?: string;
  partner_name?: string;
  partner_email?: string;
  display: string;
}

interface PartnerPickerProps {
  value: PartnerEntry[];
  onChange: (val: PartnerEntry[]) => void;
}

export function PartnerPicker({ value, onChange }: PartnerPickerProps) {
  const [open, setOpen] = useState(false);
  const [addingManual, setAddingManual] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const url = query.trim()
        ? `/api/users?q=${encodeURIComponent(query)}`
        : "/api/users";
      const res = await fetch(url);
      if (res.ok && !cancelled) {
        setResults(await res.json());
      }
    }, query ? DEBOUNCE_MS : 0);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const selectedIds = new Set(value.map((p) => p.partner_id).filter(Boolean));

  function addUser(user: UserResult) {
    if (selectedIds.has(user.id)) return;
    onChange([
      ...value,
      { partner_id: user.id, display: user.display_name },
    ]);
    setOpen(false);
    setQuery("");
  }

  function addManual() {
    if (!manualName.trim()) return;
    onChange([
      ...value,
      {
        partner_name: manualName.trim(),
        partner_email: manualEmail.trim() || undefined,
        display: manualName.trim(),
      },
    ]);
    setManualName("");
    setManualEmail("");
    setAddingManual(false);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((p, i) => (
            <span
              key={p.partner_id ?? p.partner_name ?? i}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200"
            >
              <User className="size-3 text-zinc-400" />
              {p.display}
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-700"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
              />
            }
          >
            <Plus className="size-3" />
            Add partner
            <ChevronsUpDown className="size-3 text-zinc-400" />
          </PopoverTrigger>
          <PopoverContent className="w-[min(18rem,calc(100vw-2rem))] p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search users..."
                value={query}
                onValueChange={setQuery}
              />
              <CommandList>
                <CommandEmpty>No users found</CommandEmpty>
                <CommandGroup>
                  {results.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => addUser(user)}
                    >
                      <Avatar>
                        {user.avatar_url && (
                          <AvatarImage
                            src={user.avatar_url}
                            alt={user.display_name}
                          />
                        )}
                        <AvatarFallback>
                          {user.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.display_name}
                      {selectedIds.has(user.id) && (
                        <Check className="ml-auto size-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setAddingManual(!addingManual)}
        >
          {addingManual ? "Cancel" : "Manual"}
        </Button>
      </div>

      {addingManual && (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 p-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-name">Name</Label>
            <Input
              id="manual-name"
              placeholder="Name"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-email">Email (optional)</Label>
            <Input
              id="manual-email"
              type="email"
              placeholder="email@example.com"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
            />
          </div>
          <Button type="button" size="sm" onClick={addManual}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

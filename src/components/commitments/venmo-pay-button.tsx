"use client";

import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateVenmoLink, formatCurrency } from "@/lib/utils";

interface VenmoPayButtonProps {
  venmoUsername: string | null;
  amount: number;
  pactTitle: string;
  partnerName?: string;
}

export function VenmoPayButton({
  venmoUsername,
  amount,
  pactTitle,
  partnerName,
}: VenmoPayButtonProps) {
  if (!venmoUsername) {
    return (
      <p className="text-sm text-zinc-400">
        {partnerName ? `${partnerName} hasn't` : "Partner hasn't"} set up Venmo
      </p>
    );
  }

  const link = generateVenmoLink(venmoUsername, amount, pactTitle);
  const label = partnerName
    ? `Pay ${formatCurrency(amount)} to ${partnerName}`
    : `Pay ${formatCurrency(amount)} via Venmo`;

  return (
    <a href={link} target="_blank" rel="noopener noreferrer">
      <Button
        variant="destructive"
        size="lg"
        className="w-full text-base font-bold"
      >
        <DollarSign className="size-5" />
        {label}
      </Button>
    </a>
  );
}

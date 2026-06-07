"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { PactDetailContent } from "@/components/commitments/pact-detail-content";

interface PactDetailDialogProps {
  commitmentId: string | null;
  onClose: () => void;
}

export function PactDetailDialog({ commitmentId, onClose }: PactDetailDialogProps) {
  return (
    <Dialog
      open={commitmentId !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        {commitmentId && (
          <PactDetailContent commitmentId={commitmentId} hideBackButton />
        )}
      </DialogContent>
    </Dialog>
  );
}

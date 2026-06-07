"use client";

import { LeftPanel } from "@/components/dashboard/left-panel";
import { RightPanel } from "@/components/dashboard/right-panel";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <LeftPanel />
        <RightPanel />
      </div>
    </div>
  );
}

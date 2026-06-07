import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Target, Users, CheckCircle, DollarSign } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", user.id)
      .single();

    if (profile?.onboarded) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-bold tracking-tight">Pact</h1>
          <p className="text-lg text-zinc-400">
            Accountability with real stakes.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          <Step icon={<Target className="size-4" />} text="Make a commitment" />
          <Step icon={<Users className="size-4" />} text="Pick a partner" />
          <Step icon={<CheckCircle className="size-4" />} text="Submit proof" />
          <Step icon={<DollarSign className="size-4" />} text="Pay if you fail" />
        </div>

        <Link
          href="/auth/login"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Sign in with Google
        </Link>
      </div>
    </div>
  );
}

function Step({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-left">
      <span className="text-zinc-400">{icon}</span>
      <span className="text-sm text-zinc-300">{text}</span>
    </div>
  );
}

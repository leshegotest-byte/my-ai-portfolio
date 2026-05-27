import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  instrumentId: string;
  className?: string;
}

export function WatchlistButton({ instrumentId, className }: Props) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("watchlist")
        .select("id")
        .eq("user_id", u.user.id)
        .eq("instrument_id", instrumentId)
        .maybeSingle();
      if (!cancelled) {
        setActive(!!data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [instrumentId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (active) {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", u.user.id)
        .eq("instrument_id", instrumentId);
      if (error) return toast.error(error.message);
      setActive(false);
      toast.success("Removed from watchlist");
    } else {
      const { error } = await supabase
        .from("watchlist")
        .insert({ user_id: u.user.id, instrument_id: instrumentId });
      if (error) return toast.error(error.message);
      setActive(true);
      toast.success("Added to watchlist");
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={active ? "Remove from watchlist" : "Add to watchlist"}
      className={cn(
        "size-8 grid place-items-center rounded-full transition hover:bg-background/50",
        className
      )}
    >
      <Star className={cn("size-4 transition", active ? "fill-primary text-primary" : "text-muted-foreground")} />
    </button>
  );
}

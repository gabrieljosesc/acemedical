"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Thin cosmetic progress bar that sweeps across the top on route changes. */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Sync with the router (external system): flash the bar on each pathname change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 450);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[70] h-[2px] overflow-hidden pointer-events-none">
      <div className="h-full bg-teal animate-[navprogress_450ms_ease-out_forwards]" />
      <style>{`@keyframes navprogress { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}

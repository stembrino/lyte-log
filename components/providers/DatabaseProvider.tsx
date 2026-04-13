import { expoDb } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { runDataPatches } from "@/db/patchManager";
import { type PropsWithChildren, useEffect, useState } from "react";

/**
 * Runs DDL migrations (sync) then executes data patches (async) before
 * rendering any children. Keeps the splash screen up until ready.
 */
export function DatabaseProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Synchronous — creates tables before first query lands.
    runMigrations(expoDb);

    // Asynchronous — executes each data patch exactly once.
    runDataPatches()
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch((e) => {
        console.error("[db] patch error:", e);
        if (mounted) setReady(true); // still open the app on seed failure
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}

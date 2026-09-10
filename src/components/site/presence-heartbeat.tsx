"use client";

import * as React from "react";

const HEARTBEAT_INTERVAL_MS = 60_000;

// Pings /api/presence/heartbeat on mount and every minute after, for as
// long as a signed-in user has a tab open — see getAdminStats for how the
// admin dashboard turns this into an "online now" count. Renders nothing;
// only mounted (in the root layout) when a user is signed in.
export function PresenceHeartbeat() {
  React.useEffect(() => {
    function ping() {
      fetch("/api/presence/heartbeat", { method: "POST" }).catch(() => {});
    }
    ping();
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}

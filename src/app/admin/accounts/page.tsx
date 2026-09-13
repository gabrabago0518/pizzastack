import type { Metadata } from "next";

import { AccountsList } from "@/components/site/accounts-list";
import { getAllAccounts, getAdminStats } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Accounts",
  robots: { index: false, follow: false },
};

export default async function AdminAccountsPage() {
  const [accounts, stats] = await Promise.all([getAllAccounts(), getAdminStats()]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every registered player, newest first.
          </p>
        </div>
        {stats.totalAccounts > accounts.length ? (
          <span className="text-xs text-muted-foreground">
            Showing the {accounts.length.toLocaleString()} most recent of{" "}
            {stats.totalAccounts.toLocaleString()}
          </span>
        ) : null}
      </div>
      <AccountsList accounts={accounts} />
    </div>
  );
}

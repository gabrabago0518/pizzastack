import Link from "next/link";

import { AvatarDisplay } from "@/components/site/avatar-display";
import { PrimeBadge } from "@/components/site/prime-badge";
import { CoachBadge } from "@/components/site/coach-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import type { AdminAccountRow } from "@/lib/queries";

export function AccountsList({ accounts }: { accounts: AdminAccountRow[] }) {
  if (accounts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No accounts yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {accounts.map((account) => (
        <Card key={account.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AvatarDisplay
                url={account.avatarUrl}
                label={account.displayName || account.username}
                className="size-9"
                textClassName="text-sm"
              />
              <div className="flex flex-col">
                <Link
                  href={`/players/${account.username}`}
                  className="font-medium hover:text-primary"
                >
                  @{account.username}
                </Link>
                <span className="text-xs text-muted-foreground">
                  Joined {formatRelativeTime(account.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {account.isAdmin ? <Badge variant="accent">Admin</Badge> : null}
              {account.accountTier === "prime" ? <PrimeBadge /> : null}
              {account.isCoach ? <CoachBadge /> : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

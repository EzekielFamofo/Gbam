/**
 * Shared with lib/dashboard.ts's "creditsUsedThisMonth" calculation -
 * both need to agree on what "today" and "this month" mean, or the
 * dashboard could show a different total than what the spend-limit
 * middleware enforces against.
 *
 * Uses the server process's local time (same as dashboard.ts's existing
 * `monthStart` calculation), not explicit UTC. On Railway this is UTC by
 * default, but if that ever changes, both call sites move together since
 * they share this file.
 */
export function startOfToday(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

export function startOfThisMonth(): Date {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
}
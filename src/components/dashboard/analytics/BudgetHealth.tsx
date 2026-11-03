import { Card, CardContent } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";

const score = 84;

const reasons = [
    "Monthly spending is still below your expected pace",
    "2 categories are approaching their limits faster than planned",
    "Savings rate improved vs last month",
    "No overdue recurring payments this period",
    "Discretionary spending down 8% overall",
];

// semicerc gauge — 0..100 mapat pe 180°
function Gauge({ value }: { value: number }) {
    const segments = 40;
    const filled = Math.round((value / 100) * segments);
    return (
        <div className="relative flex flex-col items-center">
            <svg viewBox="0 0 200 110" className="w-55">
                {Array.from({ length: segments }).map((_, i) => {
                    const angle = 180 - (i / (segments - 1)) * 180;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 100 + 78 * Math.cos(rad);
                    const y1 = 100 - 78 * Math.sin(rad);
                    const x2 = 100 + 92 * Math.cos(rad);
                    const y2 = 100 - 92 * Math.sin(rad);
                    const active = i < filled;
                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            strokeWidth={4}
                            strokeLinecap="round"
                            stroke={active ? "var(--finance-success)" : "var(--muted)"}
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-x-0 top-10.5 flex flex-col items-center">
                <span className="text-xs font-medium text-finance-success">
                    Great
                </span>
                <span className="text-4xl font-bold tabular-nums">{value}</span>
            </div>
        </div>
    );
}

export default function BudgetHealth() {
    return (
        <Card className="flex-1">
            <CardContent className="p-5">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Budget health</h3>
                </div>

                <Gauge value={score} />

                <p className="mt-1 text-center text-sm">
                    You're managing this month well. Most categories are within a healthy
                    pace, though groceries and entertainment need a closer look.
                </p>

                <div className="mt-4 flex justify-center border-t pt-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <Info size={13} aria-hidden="true" />
                                Why this score
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="center" className="w-72">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Why this score
                            </p>
                            <ul className="space-y-1.5">
                                {reasons.map((r) => (
                                    <li
                                        key={r}
                                        className="flex gap-2 text-sm text-muted-foreground"
                                    >
                                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-finance-success" />
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </PopoverContent>
                    </Popover>
                </div>
            </CardContent>
        </Card>
    );
}
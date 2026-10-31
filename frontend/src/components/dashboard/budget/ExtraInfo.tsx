import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Pin } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

type Tab = "income" | "expenses" | "savings";

const DATA: Record<
  Tab,
  {
    title: string;
    badge: string;
    items: { label: string; amount: number; pct: number }[];
  }
> = {
  income: {
    title: "Surse de venit recurente",
    badge: "Recurente",
    items: [
      { label: "Salariu", amount: 5000, pct: 67 },
      { label: "Investiții", amount: 2500, pct: 33 },
      { label: "Internet", amount: 60, pct: 4 },
    ],
  },
  expenses: {
    title: "Cheltuieli fixe lunare",
    badge: "Recurente",
    items: [
      { label: "Chirie", amount: 1200, pct: 75 },
      { label: "Utilități", amount: 300, pct: 19 },
      { label: "Internet", amount: 60, pct: 4 },
    ],
  },
  savings: {
    title: "Obiective de economisire",
    badge: "Obiective",
    items: [
      { label: "Fond urgență", amount: 1000, pct: 57 },
      { label: "Vacanță", amount: 750, pct: 43 },
      { label: "Internet", amount: 60, pct: 4 },
    ],
  },
};

export default function ExtraInfo({ activeTab }: { activeTab: Tab }) {
  const { format } = useCurrency();
  const { title, badge, items } = DATA[activeTab];
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
            <Pin
              size={14}
              className="text-foreground"
              aria-hidden="true"
            />
          </span>
          <CardTitle className="text-sm">{title}</CardTitle>
          <span className="ml-auto rounded-full bg-accent px-2 py-1 text-xs font-medium text-foreground">
            {badge}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2.5">
          {items.map(({ label, amount, pct }) => (
            <li key={label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">
                  {format(amount)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-blue-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Total lunar:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {format(total)}
          </span>
        </p>
      </CardFooter>
    </Card>
  );
}

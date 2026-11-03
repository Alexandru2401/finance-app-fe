import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    type ChartConfig,
} from "@/components/ui/chart";
import type {
    BudgetItem,
    NewBudgetItem,
} from "@/store/dashboardStore/BudgetStoreContext";
import {
    AlertTriangle,
    Pin
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis } from "recharts";
import { useCurrency } from "@/hooks/useCurrency";

const savingsWithForecast = [
    { month: "Ian", savings: 106, forecast: null },
    { month: "Feb", savings: 105, forecast: null },
    { month: "Mar", savings: 117, forecast: null },
    { month: "Apr", savings: -117, forecast: null },
    { month: "Mai", savings: 79, forecast: null },
    { month: "Iun", savings: 74, forecast: null },
    { month: "Iul", savings: null, forecast: 60 },
    { month: "Aug", savings: null, forecast: 44 },
    { month: "Sep", savings: null, forecast: 32 },
];

const savingsConfig = {
    savings: { label: "Economii", color: "var(--finance-primary)" },
    forecast: { label: "Forecast", color: "var(--finance-primary)" },
} satisfies ChartConfig;


export interface Section {
    title: string;
    items: BudgetItem[];
    total: number;
    section: "income" | "expenses" | "savings";
    onDelete: (id: string) => void;
    onEdit: (id: string, payload: Partial<NewBudgetItem>) => void;
}

const fixedCosts = [
    { label: "Chirie", amount: 1200, pct: 75 },
    { label: "Utilități", amount: 300, pct: 19 },
    { label: "Internet", amount: 60, pct: 4 },
];

const variableCosts = [
    { label: "Restaurante", amount: 1200, pct: 75 },
    { label: "Shopping", amount: 300, pct: 19 },
    { label: "Concert", amount: 60, pct: 4 },
];

const ForecastTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload.find((p: any) => p.value !== null);
    if (!entry) return null;
    const isForecast = entry.dataKey === "forecast";
    return (
        <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-md text-xs">
            <p className="font-medium text-card-foreground mb-1">{label}</p>
            <p
                className={
                    isForecast ? "text-muted-foreground italic" : "text-card-foreground"
                }
            >
                {isForecast ? "Forecast: " : "Economii: "}
                <span className="font-semibold">${entry.value}</span>
            </p>
            {isForecast && (
                <p className="text-muted-foreground text-[10px] mt-0.5">Estimat</p>
            )}
        </div>
    );
};



export default function ExpensesInfo() {
    const { format } = useCurrency();
    return <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <Card className="flex-1">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                        <Pin
                            size={14}
                            className="text-muted-foreground"
                            aria-hidden="true"
                        />
                    </span>
                    <CardTitle className="text-sm">Cheltuieli fixe lunare</CardTitle>
                    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Recurente
                    </span>
                </div>
            </CardHeader>

            <CardContent>
                <ul className="space-y-2.5">
                    {fixedCosts.map(({ label, amount, pct }) => (
                        <li key={label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium tabular-nums">
                                    {format(amount)}
                                </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                                <div
                                    className="h-1.5 rounded-full bg-finance-primary"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter className="border-t pt-4">
                <p className="text-xs text-muted-foreground">
                    Total fix lunar:{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                        {format(1560)}
                    </span>
                </p>
            </CardFooter>

        </Card>

        <Card className="flex-1 border-finance-warning/30 bg-finance-warning-bg/60">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-finance-warning-bg">
                        <AlertTriangle
                            size={14}
                            className="text-finance-warning"
                            aria-hidden="true"
                        />
                    </span>
                    <CardTitle className="text-sm">
                        Cheltuieli variabile mari
                    </CardTitle>
                    <span className="ml-auto rounded-full bg-finance-warning-bg px-2 py-0.5 text-xs font-medium text-finance-warning">
                        Optimizabile
                    </span>
                </div>
            </CardHeader>

            <CardContent>
                <ul className="space-y-2.5">
                    {variableCosts.map(({ label, amount, pct }) => (
                        <li key={label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium tabular-nums">
                                    {format(amount)}
                                </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-finance-warning-bg">
                                <div
                                    className="h-1.5 rounded-full bg-finance-warning"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter className="border-t border-finance-warning/30 pt-4">
                <p className="text-xs text-muted-foreground">
                    Total variabil:{" "}
                    <span className="font-semibold tabular-nums text-finance-warning">
                        {format(1560)}
                    </span>{" "}
                    — potențial de reducere
                </p>
            </CardFooter>

        </Card>
        <Card className="flex-1">
            <CardHeader>
                <CardTitle className="text-sm">Economii + Forecast</CardTitle>
                <CardDescription>Istoric și predicție — Ian–Sep 2024</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={savingsConfig}>
                    <LineChart
                        data={savingsWithForecast}
                        margin={{ top: 8, left: 4, right: 4, bottom: 0 }}
                    >
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={8}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                        />
                        <ChartTooltip cursor={false} content={<ForecastTooltip />} />
                        <ReferenceLine
                            y={0}
                            stroke="var(--destructive)"
                            strokeDasharray="4 2"
                            strokeWidth={1}
                        />
                        <Line
                            dataKey="savings"
                            type="monotone"
                            stroke="var(--color-savings)"
                            strokeWidth={2}
                            dot={{ fill: "var(--color-savings)", r: 4 }}
                            activeDot={{ r: 6 }}
                            connectNulls={false}
                        />
                        <Line
                            dataKey="forecast"
                            type="monotone"
                            stroke="var(--color-savings)"
                            strokeWidth={2}
                            strokeDasharray="5 4"
                            dot={{ fill: "var(--color-savings)", r: 3, strokeDasharray: "0" }}
                            activeDot={{ r: 5 }}
                            connectNulls={false}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1 text-xs text-muted-foreground pt-0">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-4 h-0.5 rounded bg-finance-primary" />{" "}
                        Istoric
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-finance-primary" />{" "}
                        Forecast
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-4 h-0.5 border-t border-dashed border-destructive" />{" "}
                        Zero
                    </span>
                </div>
            </CardFooter>
        </Card>
    </div>
}
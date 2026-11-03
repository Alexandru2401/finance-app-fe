import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import type {
    BudgetItem,
    NewBudgetItem,
} from "@/store/dashboardStore/BudgetStoreContext";
import {
    TrendingUp
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";

export interface Section {
    title: string;
    items: BudgetItem[];
    total: number;
    section: "income" | "expenses" | "savings";
    onDelete: (id: string) => void;
    onEdit: (id: string, payload: Partial<NewBudgetItem>) => void;
}

const chartData = [
    { month: "January", income: 186, expenses: 80, savings: 106 },
    { month: "February", income: 305, expenses: 200, savings: 105 },
    { month: "March", income: 237, expenses: 120, savings: 117 },
    { month: "April", income: 73, expenses: 190, savings: -117 },
    { month: "May", income: 209, expenses: 130, savings: 79 },
    { month: "June", income: 214, expenses: 140, savings: 74 },
];

const barChartConfig = {
    income: { label: "Income", color: "var(--chart-1)" },
    expenses: { label: "Expenses", color: "var(--chart-2)" },
} satisfies ChartConfig;


type Metric = "income" | "expenses" | "savings";

const METRICS: { value: Metric; label: string }[] = [
    { value: "income", label: "Income" },
    { value: "expenses", label: "Expenses" },
    { value: "savings", label: "Savings" },
];

const metricConfig = {
    income: { label: "Income", color: "var(--chart-1)" },
    expenses: { label: "Expenses", color: "var(--chart-2)" },
    savings: { label: "Savings", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function AnalyticsChart() {
    const [metric, setMetric] = useState<Metric>("expenses");
    return <div className="flex gap-10 flex-col-reverse lg:flex-row">
        <Card className="flex-1">
            <CardHeader>
                <CardTitle className="text-base">Income vs Expenses</CardTitle>
                <CardDescription>January – June 2024</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={barChartConfig}
                    className="max-h-70 w-full"
                >
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dashed" />}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                        <Bar
                            dataKey="expenses"
                            fill="var(--color-expenses)"
                            radius={4}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1 text-sm">
                <p className="flex items-center gap-2 font-medium">
                    Trending up by 5.2% this month
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                </p>
                <p className="text-muted-foreground">
                    Showing totals for the last 6 months
                </p>
            </CardFooter>
        </Card>

        <Card className="flex-1">
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-base">Trend</CardTitle>
                        <CardDescription>January – June 2024</CardDescription>
                    </div>
                    <div className="flex rounded-lg border p-0.5">
                        {METRICS.map((m) => (
                            <button
                                key={m.value}
                                type="button"
                                onClick={() => setMetric(m.value)}
                                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${metric === m.value
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={metricConfig} className="max-h-70 w-full">
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{ top: 8, left: 8, right: 8, bottom: 0 }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Line
                            dataKey={metric}
                            type="monotone"
                            stroke={`var(--color-${metric})`}
                            strokeWidth={2}
                            dot={{ fill: `var(--color-${metric})`, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1 text-sm">
                <p className="text-muted-foreground">
                    Monthly {metric} over the last 6 months
                </p>
            </CardFooter>
        </Card>
    </div>
}
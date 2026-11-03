import {
    Info,
    Lightbulb
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";


const tips = [
    {
        icon: "🍽️",
        action: "Reduce restaurantele cu 30%",
        impact: "+$360/lună economisit",
        color: "text-finance-success",
        bg: "bg-finance-success-bg",
        border: "border-border",
    },
    {
        icon: "🛍️",
        action: "Limitează shoppingul la $200",
        impact: "+$100/lună economisit",
        color: "text-finance-primary",
        bg: "bg-finance-warning-bg",
        border: "border-border",
    },
    {
        icon: "📱",
        action: "Auditează subscripțiile inactive",
        impact: "~$40/lună economisit",
        color: "text-finance-purple",
        bg: "bg-finance-danger-bg",
        border: "border-border",
    },
];


export default function AnalyticsInsight() {
    return (
        <Card className="flex-1">
            <CardContent className="p-5">
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-finance-primary/10 p-4 text-finance-primary">
                    <Info
                        size={16}
                        className="mt-0.5 shrink-0 text-finance-primary"
                        aria-hidden="true"
                    />
                    <p className="text-sm leading-relaxed text-foreground">
                        Analizând cheltuielile din ultimele 6 luni, se pare că în următoarele
                        6 luni cheltuielile vor crește cu aproximativ{" "}
                        <span className="font-semibold">15% pe lună</span>.
                    </p>
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted">
                        <Lightbulb size={14} className="text-finance-warning" />
                    </span>
                    <h3 className="text-sm font-semibold text-card-foreground">
                        Ce poți face?
                    </h3>
                    <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-finance-warning-bg text-finance-warning">
                        Recomandări
                    </span>
                </div>
                <ul className="space-y-2.5">
                    {tips.map(({ icon, action, impact, color, bg, border }) => (
                        <li
                            key={action}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${bg} ${border}`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="text-base">{icon}</span>
                                <span className="text-sm text-card-foreground">{action}</span>
                            </div>
                            <span className={`text-xs font-semibold shrink-0 ml-3 ${color}`}>
                                {impact}
                            </span>
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                    Aplicând toate recomandările:{" "}
                    <span className="font-semibold text-finance-success">
                        +$500/lună
                    </span>
                </p>
            </CardContent>
        </Card>
    );
}
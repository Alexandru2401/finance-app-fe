import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TargetHistory from "@/components/dashboard/budget/TargetHistory";
import type { BudgetTargetValues } from "@/api/budget";
import { formatMonth } from "@/lib/periods";
import { History } from "lucide-react";
import { useState } from "react";

interface TargetsPanelProps {
    targets: BudgetTargetValues;
    // YYYY-MM-01, the month the targets apply to
    month: string;
    // Resolves to false if the save failed, so the panel stays open
    onSave: (t: BudgetTargetValues) => Promise<boolean>;
    onClose: () => void;
}

// An empty input is not sent, so it keeps the saved value
const toInput = (value: number | null) => (value === null ? "" : String(value));
const fromInput = (value: string) => (value.trim() === "" ? null : Number(value) || 0);

export default function TargetsPanel({ targets, month, onSave, onClose }: TargetsPanelProps) {
    const [values, setValues] = useState({
        income: toInput(targets.income),
        expense: toInput(targets.expense),
        savings: toInput(targets.savings),
    });
    const [saving, setSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const parsed = {
        income: fromInput(values.income),
        expense: fromInput(values.expense),
        savings: fromInput(values.savings),
    };
    // The backend needs at least one value
    const isEmpty = Object.values(parsed).every((value) => value === null);

    const handleSave = async () => {
        setSaving(true);
        const saved = await onSave(parsed);
        setSaving(false);
        if (saved) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-xl ${showHistory ? "max-w-3xl" : "max-w-lg"} border border-muted/30 bg-background p-6 shadow-2xl`}>
                <h2 className="mb-4 text-lg font-semibold">
                    Set your targets for {formatMonth(month)}
                </h2>

                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="t-income" className="text-xs text-muted-foreground">Income target</Label>
                        <Input
                            id="t-income"
                            type="number"
                            value={values.income}
                            onChange={(e) => setValues((v) => ({ ...v, income: e.target.value }))}
                            onKeyDown={(e) => (e.key === "e" || e.key === "E") && e.preventDefault()}
                            className="w-32"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="t-expenses" className="text-xs text-muted-foreground">Expenses limit</Label>
                        <Input
                            id="t-expenses"
                            type="number"
                            value={values.expense}
                            onChange={(e) => setValues((v) => ({ ...v, expense: e.target.value }))}
                            onKeyDown={(e) => (e.key === "e" || e.key === "E") && e.preventDefault()}
                            className="w-32"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="t-savings" className="text-xs text-muted-foreground">Savings goal</Label>
                        <Input
                            id="t-savings"
                            type="number"
                            value={values.savings}
                            onChange={(e) => setValues((v) => ({ ...v, savings: e.target.value }))}
                            onKeyDown={(e) => (e.key === "e" || e.key === "E") && e.preventDefault()}
                            className="w-32"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowHistory((prev) => !prev)}
                        className="cursor-pointer gap-1.5 px-0"
                    >
                        <History size={14} />
                        {showHistory ? "Hide target history" : "View target history"}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose} className="cursor-pointer">Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || isEmpty} className="cursor-pointer">
                            {saving ? "Saving..." : "Save targets"}
                        </Button>
                    </div>
                </div>

                {showHistory && (
                    <div className="mt-4 border-t pt-4">
                        <TargetHistory />
                    </div>
                )}
            </div>
        </div>
    );
}

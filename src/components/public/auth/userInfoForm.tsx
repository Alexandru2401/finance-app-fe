import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Next: import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, CheckCircle2, CircleUserRound } from "lucide-react";
import { addUserInfo } from "@/api/user";

import { useAuth } from "@/hooks/useAuth";

import type { Currency } from "@/lib/format";

const ACCENT = "#ffd649";

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "RON", label: "RON — Leu românesc" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "USD", label: "USD — Dolar american" },
];

const STEPS = ["Cont", "Nume", "Monedă", "Gata"];

function Stepper({ current }: { current: number }) {
  return (
    <div className="mb-6 flex items-center">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isDone = current > stepNum;
        const isActive = current === stepNum;
        const filled = isDone || isActive;

        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors"
                style={
                  filled
                    ? { backgroundColor: ACCENT, color: "#1a1a1a" }
                    : { backgroundColor: "transparent", color: "#9ca3af" }
                }
              >
                {isDone ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className="text-xs"
                style={{ color: filled ? ACCENT : "#9ca3af" }}
              >
                {label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded bg-muted">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: current > stepNum ? "100%" : "0%",
                    backgroundColor: ACCENT,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function UserInfoForm() {
  const navigate = useNavigate();

  const [step, setStep] = useState(2); // pasul 1 (Cont) e deja creat la register
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency | "">("");
  const [loading, setLoading] = useState(false);

  const { user, setUser } = useAuth();

  const handleFinish = async () => {
    if (!currency || !user) return;
    setLoading(true);
    try {
      const response = await addUserInfo({
        username: name.trim(),
        currency,
      });
      console.log("addUserInfo response:", response);

      if (!response.ok || !response.data?.user) return;
      // Raspunsul are doar user_id, username si currency
      setUser({ ...user, ...response.data.user });
      setStep(4);
    } catch (err) {
      console.log(err);
      // toast cu Sonner daca vrei
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center justify-center gap-2 mb-6">
            <CircleUserRound size={26} />
            Cateva informatii rapide si putem incepe!
          </CardTitle>
          <Stepper current={step} />
        </CardHeader>

        {step === 2 && (
          <>
            <CardContent className="space-y-4">
              <div>
                <CardTitle>Cum te numești?</CardTitle>
                <CardDescription>
                  Acesta va fii numele tău în aplicație.
                </CardDescription>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nume</Label>
                <Input
                  id="name"
                  placeholder="ex. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                style={{ backgroundColor: ACCENT, color: "#1a1a1a" }}
                disabled={!name.trim()}
                onClick={() => setStep(3)}
              >
                Continuă
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardContent className="space-y-4">
              <div>
                <CardTitle>Ce monedă folosești?</CardTitle>
                <CardDescription>
                  O poți schimba oricând din setări.
                </CardDescription>
              </div>
              <div className="space-y-2">
                <Label>Monedă</Label>
                <Select
                  value={currency}
                  onValueChange={(v) => setCurrency(v as Currency)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alege moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Înapoi
              </Button>
              <Button
                style={{ backgroundColor: ACCENT, color: "#1a1a1a" }}
                disabled={!currency || loading}
                onClick={handleFinish}
                className="flex-1"
              >
                {loading ? "Se salvează..." : "Finalizează"}
              </Button>
            </CardFooter>
          </>
        )}

        {step === 4 && (
          <>
            <CardContent className="flex flex-col items-center text-center">
              <CheckCircle2
                className="mb-2 h-12 w-12"
                style={{ color: ACCENT }}
              />
              <CardTitle>Cont creat cu succes</CardTitle>
              <CardDescription>Totul e gata, {name.trim()}.</CardDescription>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                style={{ backgroundColor: ACCENT, color: "#1a1a1a" }}
                onClick={() => navigate("/dashboard")}
              >
                Să începem
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}

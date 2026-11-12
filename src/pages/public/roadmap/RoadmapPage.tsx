import { useEffect, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowDown, Heart, Lightbulb, Send } from "lucide-react";
import { sendFeedback } from "@/api/feedback";
import {
  addRoadmapVote,
  getRoadmapVotes,
  removeRoadmapVote,
  type RoadmapVote,
} from "@/api/roadmap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import RoadmapItems, {
  ROADMAP_STATUSES,
  type RoadmapItem,
  type RoadmapItemId,
} from "@/components/public/data/RoadmapItems";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import FeedbackSchema, {
  FEEDBACK_MESSAGE_MAX,
  type FeedbackErrorKey,
} from "@/schemas/feedback.schema";

type VotesById = Partial<Record<RoadmapItemId, RoadmapVote>>;

export default function RoadmapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuth, loading } = useAuth();
  const userId = user?.user_id;

  const [votes, setVotes] = useState<VotesById>({});
  const [pendingIds, setPendingIds] = useState<RoadmapItemId[]>([]);

  // Se reîncarcă după autentificare: `voted` depinde de user
  useEffect(() => {
    if (loading) return;
    let ignore = false;

    getRoadmapVotes()
      .then((res) => {
        if (ignore || !res.ok) return;
        setVotes(
          Object.fromEntries(
            res.data.votes.map((vote) => [vote.item_id, vote]),
          ),
        );
      })
      .catch(() => {
        // Fără numere pe carduri, dar pagina rămâne utilizabilă
      });

    return () => {
      ignore = true;
    };
  }, [loading, userId]);

  async function handleVote(id: RoadmapItemId) {
    if (!isAuth) {
      toast(t("roadmap.vote.loginRequired"), {
        action: {
          label: t("nav.login"),
          onClick: () => navigate("/login"),
        },
      });
      return;
    }

    const voted = votes[id]?.voted ?? false;
    setPendingIds((prev) => [...prev, id]);

    try {
      const response = voted
        ? await removeRoadmapVote(id)
        : await addRoadmapVote(id);

      if (!response.ok) {
        toast.error(t("roadmap.vote.failed"));
        return;
      }

      setVotes((prev) => ({
        ...prev,
        [id]: { item_id: id, count: response.data.count, voted: !voted },
      }));
    } catch {
      toast.error(t("roadmap.vote.failed"));
    } finally {
      setPendingIds((prev) => prev.filter((pendingId) => pendingId !== id));
    }
  }

  return (
    <section className="py-4 px-4 md:px-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge
          variant="outline"
          className="mb-4 border-amber-400/60 text-amber-500"
        >
          {t("roadmap.badge")}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          {t("roadmap.title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("roadmap.subtitle")}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <a href="#feedback">
            {t("roadmap.cta")}
            <ArrowDown className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Coloane pe status */}
      <div className="grid gap-8 md:grid-cols-3">
        {ROADMAP_STATUSES.map((status) => (
          <div key={status}>
            <h2 className="text-xl font-bold">
              {t(`roadmap.statuses.${status}.title`)}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {t(`roadmap.statuses.${status}.description`)}
            </p>
            <ul className="space-y-4">
              {RoadmapItems.filter((item) => item.status === status).map(
                (item) => (
                  <RoadmapCard
                    key={item.id}
                    item={item}
                    vote={votes[item.id]}
                    disabled={loading || pendingIds.includes(item.id)}
                    onVote={() => handleVote(item.id)}
                  />
                ),
              )}
            </ul>
          </div>
        ))}
      </div>

      <FeedbackSection />
    </section>
  );
}

function RoadmapCard({
  item,
  vote,
  disabled,
  onVote,
}: {
  item: RoadmapItem;
  vote?: RoadmapVote;
  disabled: boolean;
  onVote: () => void;
}) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const title = t(`roadmap.items.${item.id}.title`);
  const voted = vote?.voted ?? false;

  return (
    <li className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Icon className="h-6 w-6 text-amber-500" aria-hidden />
        <button
          type="button"
          onClick={onVote}
          disabled={disabled}
          aria-pressed={voted}
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
            voted
              ? "border-red-500/40 bg-red-500/10 text-red-500"
              : "text-muted-foreground hover:border-red-500/40 hover:text-red-500",
          )}
        >
          <Heart
            className={cn("h-4 w-4", voted && "fill-current")}
            aria-hidden
          />
          <span className="sr-only">
            {t(voted ? "roadmap.vote.remove" : "roadmap.vote.add", { title })}
          </span>
          {vote && (
            <span className="tabular-nums">
              {t("roadmap.vote.count", { count: vote.count })}
            </span>
          )}
        </button>
      </div>
      <h3 className="mb-1 font-semibold leading-snug">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {t(`roadmap.items.${item.id}.description`)}
      </p>
    </li>
  );
}

function FeedbackSection() {
  const { t } = useTranslation();
  const { isAuth, loading } = useAuth();

  return (
    <div
      id="feedback"
      className="mt-20 mb-16 scroll-mt-32 rounded-2xl border bg-card p-6 md:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-3">
        <div>
          <Lightbulb className="mb-4 h-8 w-8 text-amber-500" aria-hidden />
          <h2 className="mb-2 text-2xl md:text-3xl font-bold">
            {t("roadmap.feedback.title")}
          </h2>
          <p className="text-muted-foreground">{t("roadmap.feedback.text")}</p>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : isAuth ? (
            <FeedbackForm />
          ) : (
            <div className="flex h-full flex-col items-start justify-center gap-4 rounded-xl bg-muted p-6">
              <p>{t("roadmap.feedback.loginRequired")}</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-amber-400 text-black hover:bg-amber-300"
                >
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/signin">{t("nav.createAccount")}</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedbackForm() {
  const { t } = useTranslation();

  const [message, setMessage] = useState("");
  const [error, setError] = useState<FeedbackErrorKey>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const result = FeedbackSchema.safeParse({ message });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setError(fieldErrors.message?.[0] as FeedbackErrorKey | undefined);
      return;
    }

    setError(undefined);
    setIsSubmitting(true);

    try {
      const response = await sendFeedback(result.data);

      // Textul rămâne în formular la eroare, ca userul să nu-l piardă
      if (!response.ok) {
        toast.error(t("roadmap.feedback.failed"));
        return;
      }

      toast.success(t("roadmap.feedback.success"));
      setMessage("");
    } catch {
      toast.error(t("roadmap.feedback.failed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="feedback-message">
            {t("roadmap.feedback.messageLabel")}
          </FieldLabel>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(undefined);
            }}
            placeholder={t("roadmap.feedback.messagePlaceholder")}
            maxLength={FEEDBACK_MESSAGE_MAX}
            aria-invalid={!!error}
            className={cn(
              "min-h-36 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              error && "border-red-500",
            )}
          />
          <div className="flex justify-between gap-4 text-sm">
            <p className="text-red-500">
              {error && t(`roadmap.feedback.errors.${error}`)}
            </p>
            <p className="text-muted-foreground tabular-nums">
              {message.length}/{FEEDBACK_MESSAGE_MAX}
            </p>
          </div>
        </Field>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-fit bg-amber-400 text-black hover:bg-amber-300 cursor-pointer"
        >
          {isSubmitting
            ? t("roadmap.feedback.submitting")
            : t("roadmap.feedback.submit")}
          <Send className="h-4 w-4" />
        </Button>
      </FieldGroup>
    </form>
  );
}

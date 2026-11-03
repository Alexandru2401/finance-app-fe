import { useMemo, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Clock, Mail, PenLine, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import BlogPosts, {
  BLOG_CATEGORIES,
  type BlogCategory,
  type BlogPost,
} from "@/components/public/data/BlogPosts";

type CategoryFilter = BlogCategory | "all";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

export default function BlogPage() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [openPost, setOpenPost] = useState<BlogPost | null>(null);

  const featured = BlogPosts.find((post) => post.featured);
  const isFiltering = category !== "all" || query.trim() !== "";

  const posts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return BlogPosts.filter((post) => {
      // Articolul recomandat apare separat, sus, cât timp nu se filtrează
      if (!isFiltering && post.featured) return false;
      if (category !== "all" && post.category !== category) return false;
      if (!search) return true;
      const text = `${t(`blog.posts.${post.id}.title`)} ${t(`blog.posts.${post.id}.excerpt`)}`;
      return text.toLowerCase().includes(search);
    });
  }, [category, query, isFiltering, t]);

  function resetFilters() {
    setCategory("all");
    setQuery("");
  }

  function handleSubscribe(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.success(t("blog.newsletter.success"));
    event.currentTarget.reset();
  }

  return (
    <section className="py-4 px-4 md:px-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge
          variant="outline"
          className="mb-4 border-amber-400/60 text-amber-500"
        >
          {t("blog.badge")}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          {t("blog.title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("blog.subtitle")}
        </p>

        <div className="relative mx-auto mt-8 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("blog.searchPlaceholder")}
            aria-label={t("blog.searchPlaceholder")}
            className="h-11 pl-9"
          />
        </div>
      </div>

      {/* Articol recomandat */}
      {featured && !isFiltering && (
        <button
          type="button"
          onClick={() => setOpenPost(featured)}
          className="group mb-16 grid w-full overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition hover:shadow-lg md:grid-cols-2 cursor-pointer"
        >
          <div className="relative aspect-video md:aspect-auto md:min-h-80 overflow-hidden">
            <img
              src={featured.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <Badge className="absolute left-4 top-4 bg-amber-400 text-black">
              {t("blog.featured")}
            </Badge>
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
            <CategoryLabel category={featured.category} />
            <h2 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-amber-500 transition-colors">
              {t(`blog.posts.${featured.id}.title`)}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t(`blog.posts.${featured.id}.excerpt`)}
            </p>
            <PostMeta post={featured} />
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              {t("blog.readArticle")}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </button>
      )}

      {/* Filtre pe categorii */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">{t("blog.latest")}</h2>
        <div className="flex flex-wrap gap-2">
          {(["all", ...BLOG_CATEGORIES] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition cursor-pointer",
                category === key
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {key === "all" ? t("blog.all") : t(`blog.categories.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Grila de articole */}
      {posts.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setOpenPost(post)}
              className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <CategoryLabel category={post.category} />
                <h3 className="text-lg font-semibold leading-snug group-hover:text-amber-500 transition-colors">
                  {t(`blog.posts.${post.id}.title`)}
                </h3>
                <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                  {t(`blog.posts.${post.id}.excerpt`)}
                </p>
                <div className="mt-auto pt-3">
                  <PostMeta post={post} />
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed py-16 text-center">
          <p className="mb-4 text-muted-foreground">{t("blog.noResults")}</p>
          <Button variant="outline" onClick={resetFilters}>
            {t("blog.clearFilters")}
          </Button>
        </div>
      )}

      {/* Newsletter + poveste */}
      <div className="mt-20 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-black p-8 text-white md:p-10 lg:col-span-2">
          <Mail className="mb-4 h-8 w-8 text-amber-400" />
          <h2 className="mb-2 text-2xl md:text-3xl font-bold">
            {t("blog.newsletter.title")}
          </h2>
          <p className="mb-6 max-w-xl text-slate-300">
            {t("blog.newsletter.text")}
          </p>
          <form
            onSubmit={handleSubscribe}
            className="flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              required
              placeholder={t("blog.newsletter.placeholder")}
              aria-label={t("blog.newsletter.placeholder")}
              className="h-11 border-slate-700 bg-slate-900 text-white placeholder:text-slate-500"
            />
            <Button
              type="submit"
              size="lg"
              className="h-11 bg-amber-400 text-black hover:bg-amber-300 cursor-pointer"
            >
              {t("blog.newsletter.button")}
            </Button>
          </form>
        </div>

        <div className="flex flex-col rounded-2xl border bg-card p-8 md:p-10">
          <PenLine className="mb-4 h-8 w-8 text-amber-500" />
          <h2 className="mb-2 text-2xl font-bold">{t("blog.share.title")}</h2>
          <p className="mb-6 text-muted-foreground">{t("blog.share.text")}</p>
          <Button asChild variant="outline" className="mt-auto w-fit">
            <a href="mailto:stories@financeapp.com">
              {t("blog.share.button")}
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* Articol deschis */}
      <Dialog
        open={openPost !== null}
        onOpenChange={(open) => !open && setOpenPost(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
          {openPost && (
            <article>
              <img
                src={openPost.image}
                alt=""
                className="aspect-video w-full object-cover"
              />
              <div className="space-y-5 p-6 md:p-8">
                <CategoryLabel category={openPost.category} />
                <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight">
                  {t(`blog.posts.${openPost.id}.title`)}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {t(`blog.posts.${openPost.id}.excerpt`)}
                </DialogDescription>
                <PostMeta post={openPost} />
                <div className="space-y-4 border-t pt-5 leading-relaxed text-foreground/90">
                  {t(`blog.posts.${openPost.id}.body`, {
                    returnObjects: true,
                  }).map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
                <div className="rounded-xl bg-muted p-5">
                  <h3 className="font-semibold">
                    {t("blog.articleCta.title")}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t("blog.articleCta.text")}
                  </p>
                  <Button
                    asChild
                    className="bg-amber-400 text-black hover:bg-amber-300"
                  >
                    <Link to="/signin">
                      {t("blog.articleCta.button")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function CategoryLabel({ category }: { category: BlogCategory }) {
  const { t } = useTranslation();
  return (
    <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
      {t(`blog.categories.${category}`)}
    </span>
  );
}

function PostMeta({ post }: { post: BlogPost }) {
  const { t, i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: "medium",
  }).format(new Date(post.date));

  return (
    <div className="flex items-center gap-3 text-sm">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="bg-amber-400/20 text-xs font-semibold text-amber-600">
          {initials(post.author)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="font-medium leading-tight">{post.author}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {date}
          <span aria-hidden>·</span>
          <Clock className="h-3 w-3" />
          {t("blog.readTime", { count: post.readMinutes })}
        </p>
      </div>
    </div>
  );
}

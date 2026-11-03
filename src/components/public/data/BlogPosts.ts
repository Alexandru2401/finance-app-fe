import type ro from "@/i18n/locales/ro.json";

// Textele sunt în i18n: "blog.posts.<id>" (titlu, rezumat, conținut) și "blog.categories.<categorie>"
export const BLOG_CATEGORIES = [
  "budgeting",
  "saving",
  "business",
  "stories",
  "product",
] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogPostId = keyof typeof ro.blog.posts;

export type BlogPost = {
  id: BlogPostId;
  category: BlogCategory;
  image: string;
  author: string;
  date: string;
  readMinutes: number;
  featured?: boolean;
};

function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;
}

const BlogPosts: BlogPost[] = [
  {
    id: "rule503020",
    category: "budgeting",
    image: unsplash("1554224155-6726b3ff858f"),
    author: "Andreea Popescu",
    date: "2026-09-18",
    readMinutes: 7,
    featured: true,
  },
  {
    id: "emergencyFund",
    category: "saving",
    image: unsplash("1579621970563-ebec7560ff3e"),
    author: "Mihai Ionescu",
    date: "2026-09-10",
    readMinutes: 6,
  },
  {
    id: "analytics",
    category: "product",
    image: unsplash("1460925895917-afdab827c52f"),
    author: "Ioana Marin",
    date: "2026-09-03",
    readMinutes: 4,
  },
  {
    id: "debtFree",
    category: "stories",
    image: unsplash("1553729459-efe14ef6055d"),
    author: "Elena Dumitru",
    date: "2026-08-27",
    readMinutes: 5,
  },
  {
    id: "impulseShopping",
    category: "budgeting",
    image: unsplash("1563013544-824ae1b704d3"),
    author: "Mihai Ionescu",
    date: "2026-08-20",
    readMinutes: 5,
  },
  {
    id: "freelancer",
    category: "business",
    image: unsplash("1450101499163-c8848c66ca85"),
    author: "Andreea Popescu",
    date: "2026-08-12",
    readMinutes: 8,
  },
  {
    id: "cashFlow",
    category: "business",
    image: unsplash("1556742049-0cfed4f6a45d"),
    author: "Radu Stan",
    date: "2026-08-05",
    readMinutes: 6,
  },
  {
    id: "inflation",
    category: "saving",
    image: unsplash("1611974789855-9c2a0a7236a3"),
    author: "Radu Stan",
    date: "2026-07-29",
    readMinutes: 7,
  },
  {
    id: "coupleBudget",
    category: "stories",
    image: unsplash("1434626881859-194d67b2b86f"),
    author: "Elena Dumitru",
    date: "2026-07-22",
    readMinutes: 5,
  },
];

export default BlogPosts;

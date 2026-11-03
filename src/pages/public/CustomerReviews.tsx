import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

const reviews = [
  { key: "alex", name: "Alex M." },
  { key: "maria", name: "Maria L." },
  { key: "john", name: "John D." },
  { key: "elena", name: "Elena P." },
  { key: "daniel", name: "Daniel R." },
] as const;

export default function CustomerReviews() {
  const { t } = useTranslation();

  return (
    <section className="px-3 sm:px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("home.reviews.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("home.reviews.subtitle")}
          </p>
        </div>

        {/* Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="relative"
        >
          <CarouselContent>
            {reviews.map(({ key, name }) => (
              <CarouselItem
                key={key}
                className="basis-5/5 sm:basis-1/2 lg:basis-1/3"
              >
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col gap-6 p-6 md:justify-between">
                    <p className="mb-6 text-muted-foreground">
                      “{t(`home.reviews.items.${key}.text`)}”
                    </p>

                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                      <p className="font-semibold">{name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`home.reviews.items.${key}.role`)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="hidden cursor-pointer sm:flex" />
          <CarouselNext className="hidden cursor-pointer sm:flex" />
        </Carousel>
      </div>
    </section>
  );
}

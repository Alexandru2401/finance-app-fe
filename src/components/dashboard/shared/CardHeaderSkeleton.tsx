import { CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  // Width of the title / description bars, roughly the length of the real text
  titleWidth?: string;
  descriptionWidth?: string;
  // Width of the "See all" / "See details" button, when the card has one
  actionWidth?: string;
}

/**
 * Loading header with the same line boxes as a real card header: title
 * (text-base, 24px tall), description (text-sm, 20px) and an optional small
 * button (h-8), so the card doesn't jump when the data arrives.
 */
export default function CardHeaderSkeleton({
  titleWidth = "w-32",
  descriptionWidth = "w-48",
  actionWidth,
}: Props) {
  return (
    <CardHeader>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex h-6 items-center">
            <Skeleton className={cn("h-4 max-w-full", titleWidth)} />
          </div>
          <div className="flex h-5 items-center">
            <Skeleton className={cn("h-3.5 max-w-full", descriptionWidth)} />
          </div>
        </div>
        {actionWidth && (
          <Skeleton className={cn("h-8 shrink-0 rounded-md", actionWidth)} />
        )}
      </div>
    </CardHeader>
  );
}

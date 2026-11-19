import type { ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PORTAL_ELEMENT_ID } from "react-joyride";
import { cn } from "@/lib/utils";

interface ResponsiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  // Width of the side panel on desktop, e.g. "sm:max-w-lg"
  className?: string;
  // Same height whatever the content (drawer: 85dvh, sheet: full height);
  // the children get a flex column and must scroll their own list
  fixedHeight?: boolean;
  children: ReactNode;
}

// A click or focus in the guided tour's tooltip (its own portal, outside the
// panel) must not close the panel: the tour can point at things inside it.
// Together with the #react-joyride-portal rule in index.css
function keepOpenForTour(event: Event) {
  const target = event.target;
  if (target instanceof Element && target.closest(`#${PORTAL_ELEMENT_ID}`)) {
    event.preventDefault();
  }
}

// Bottom drawer on mobile, side sheet from md up. Only one of them is mounted.
// Both are modal (focus trap, Escape, aria-modal); tour steps inside work.
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  className,
  fixedHeight = false,
  children,
}: ResponsiveSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          onPointerDownOutside={keepOpenForTour}
          onInteractOutside={keepOpenForTour}
          className={cn(
            "data-[vaul-drawer-direction=bottom]:max-h-[90dvh]",
            fixedHeight && "data-[vaul-drawer-direction=bottom]:h-[85dvh]",
          )}
        >
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div
            className={cn(
              "px-4 pb-6",
              fixedHeight ? "flex min-h-0 flex-1 flex-col" : "overflow-y-auto",
            )}
          >
            {children}
          </div>
          {footer && <DrawerFooter className="pt-0">{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        onInteractOutside={keepOpenForTour}
        className={cn(
          "w-full",
          fixedHeight ? "overflow-hidden" : "overflow-y-auto",
          className,
        )}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div
          className={cn(
            "px-4 pb-6",
            fixedHeight && "flex min-h-0 flex-1 flex-col",
          )}
        >
          {children}
        </div>
        {footer && <SheetFooter>{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}

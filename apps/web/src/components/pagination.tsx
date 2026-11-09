"use client";

import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { CustomSelect } from "@/components/custom-select";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

function visiblePages(page: number, totalPages: number): (number | "gap-start" | "gap-end")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const left = Math.max(2, page - 1);
  const right = Math.min(totalPages - 1, page + 1);
  const middle = Array.from({ length: right - left + 1 }, (_, index) => left + index);

  return [1, ...(left > 2 ? ["gap-start" as const] : []), ...middle, ...(right < totalPages - 1 ? ["gap-end" as const] : []), totalPages];
}

const STEP_BUTTON = "size-11 md:size-8";

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <nav aria-label="Paginación" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
        <span className="tabular">
          {start}-{end} de {totalItems}
        </span>
        <div className="flex items-center gap-1.5">
          <span>Mostrar</span>
          <CustomSelect
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
            label="Ítems por página"
            className="w-20"
          />
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={STEP_BUTTON}
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            aria-label="Primera página"
          >
            <ChevronsLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={STEP_BUTTON}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>

          {visiblePages(page, totalPages).map((entry) =>
            typeof entry === "string" ? (
              <span key={entry} aria-hidden="true" className="px-1 text-[13px] text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                aria-label={`Página ${entry}`}
                aria-current={page === entry ? "page" : undefined}
                className={cn(
                  "tabular h-11 min-w-11 rounded-md px-1.5 text-[13px] font-medium transition-colors duration-[120ms] md:h-8 md:min-w-8",
                  page === entry ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {entry}
              </button>
            ),
          )}

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={STEP_BUTTON}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={STEP_BUTTON}
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Última página"
          >
            <ChevronsRight aria-hidden="true" />
          </Button>
        </div>
      )}
    </nav>
  );
}

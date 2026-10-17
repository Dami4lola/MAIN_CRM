import { useState } from "react";
import Icon from "./Icon";

/** Slice a long list into pages. The page resets to 1 whenever resetKey changes (new filters, search...). */
export function usePaged<T>(items: T[], pageSize: number, resetKey: string) {
  const [page, setPage] = useState(1);
  const [key, setKey] = useState(resetKey);
  if (key !== resetKey) {
    setKey(resetKey);
    setPage(1);
  }
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages);
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, pages, total: items.length, pageSize, setPage };
}

type Paged = ReturnType<typeof usePaged>;

function Pager({ paged }: { paged: Paged }) {
  if (paged.pages <= 1) return null;
  const first = (paged.page - 1) * paged.pageSize + 1;
  const last = Math.min(paged.page * paged.pageSize, paged.total);
  return (
    <div className="pager">
      <span>{first.toLocaleString()}–{last.toLocaleString()} of {paged.total.toLocaleString()}</span>
      <div className="date-switch">
        <button aria-label="Previous page" disabled={paged.page === 1} onClick={() => paged.setPage(paged.page - 1)}><Icon name="chevronLeft" size={16} /></button>
        <strong>Page {paged.page} of {paged.pages}</strong>
        <button aria-label="Next page" disabled={paged.page === paged.pages} onClick={() => paged.setPage(paged.page + 1)}><Icon name="chevronRight" size={16} /></button>
      </div>
    </div>
  );
}

export default Pager;

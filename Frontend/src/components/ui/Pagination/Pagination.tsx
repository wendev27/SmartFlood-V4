import styles from "./Pagination.module.css";

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginationProps {
  pagination: PaginationState | null;
  onPageChange: (page: number) => void;
  label?: string;
  compact?: boolean;
  alwaysVisible?: boolean;
}

export function Pagination({ pagination, onPageChange, label = "Records", compact = false, alwaysVisible = false }: PaginationProps) {
  if (!pagination || (!alwaysVisible && (pagination.totalPages <= 1 || pagination.total <= pagination.limit))) return null;

  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  const firstVisiblePage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
  const lastVisiblePage = Math.min(pagination.totalPages, firstVisiblePage + 4);
  const pages = Array.from({ length: lastVisiblePage - firstVisiblePage + 1 }, (_, index) => firstVisiblePage + index);

  if (compact) {
    const compactPages = pagination.totalPages <= 4
      ? Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
      : [1, 2, 3, pagination.totalPages];
    return (
      <nav className={`${styles.pagination} ${styles.compact}`} aria-label={`${label} pagination`}>
        <div className={styles.controls}>
          <button aria-label="Previous page" type="button" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>‹</button>
          {compactPages.map((page, index) => (
            <span className={styles.compactItem} key={page}>
              {index === compactPages.length - 1 && pagination.totalPages > 4 ? <i>•••</i> : null}
              <button aria-current={page === pagination.page ? "page" : undefined} className={page === pagination.page ? styles.active : undefined} type="button" onClick={() => onPageChange(page)}>{page}</button>
            </span>
          ))}
          <button aria-label="Next page" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>›</button>
        </div>
        <span className={styles.summary}>Showing {start} to {end} of {pagination.total} requests</span>
      </nav>
    );
  }

  return (
    <nav className={styles.pagination} aria-label={`${label} pagination`}>
      <span className={styles.summary}>Showing {start}&ndash;{end} of {pagination.total}</span>
      <div className={styles.controls}>
        <button type="button" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
          Previous
        </button>
        {pages.map((page) => (
          <button
            aria-current={page === pagination.page ? "page" : undefined}
            className={page === pagination.page ? styles.active : undefined}
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}

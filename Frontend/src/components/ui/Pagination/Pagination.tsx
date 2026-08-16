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
}

export function Pagination({ pagination, onPageChange, label = "Records" }: PaginationProps) {
  if (!pagination || pagination.totalPages <= 1 || pagination.total <= pagination.limit) return null;

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  const firstVisiblePage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
  const lastVisiblePage = Math.min(pagination.totalPages, firstVisiblePage + 4);
  const pages = Array.from({ length: lastVisiblePage - firstVisiblePage + 1 }, (_, index) => firstVisiblePage + index);

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

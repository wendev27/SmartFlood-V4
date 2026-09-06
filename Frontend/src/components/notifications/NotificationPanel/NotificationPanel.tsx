"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PageKey } from "@/types/navigation";
import styles from "./NotificationPanel.module.css";

type Category = "Alert" | "Relief" | "System";
type Filter = "All" | "Unread" | Category;

const notifications = [
  { id: 1, title: "Critical Flood Alert", message: "Water level in Sensor Node 03 has reached warning threshold.", category: "Alert" as Category, unread: true, destination: "monitoring" as PageKey },
  { id: 2, title: "Relief Request", message: "Barangay Tanong requested for relief assistance.", category: "Relief" as Category, unread: true, destination: "relief" as PageKey },
  { id: 3, title: "System Maintenance", message: "Scheduled system maintenance notice.", category: "System" as Category, unread: true, destination: "systemLogs" as PageKey },
];

export const notificationCount = notifications.length;
export const unreadNotificationCount = notifications.filter((notification) => notification.unread).length;

const filters: Filter[] = ["All", "Unread", "Alert", "Relief", "System"];

interface NotificationPanelProps {
  onBack: () => void;
  onNavigate: (page: PageKey) => void;
  onRead: (notificationId: number) => void;
  readNotificationIds: number[];
}

export function NotificationPanel({ onBack, onNavigate, onRead, readNotificationIds }: NotificationPanelProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return notifications.filter((item) => {
      const isUnread = item.unread && !readNotificationIds.includes(item.id);
      return (filter === "All" || (filter === "Unread" ? isUnread : item.category === filter)) && (!term || `${item.title} ${item.message}`.toLowerCase().includes(term));
    });
  }, [filter, query, readNotificationIds]);

  function openNotification(notification: (typeof notifications)[number]) {
    onRead(notification.id);
    onNavigate(notification.destination);
  }

  return <section className={styles.page}>
    <button className={styles.back} type="button" onClick={onBack}>‹ Back</button>
    <h1>Notification</h1>
    <div className={styles.toolbar}>
      <div className={styles.filters}>{filters.map((item) => <button className={filter === item ? styles.active : ""} key={item} type="button" onClick={() => setFilter(item)}>{item}</button>)}</div>
      <label className={styles.search}><span aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requests..." /></label>
    </div>
    <div className={styles.summary}>
      <Summary label="Total Notification" value={notificationCount} icon="bell" />
      <Summary label="Unread" value={Math.max(0, unreadNotificationCount - readNotificationIds.length)} icon="mail" />
      <Summary label="Critical Alerts" value={notifications.filter((notification) => notification.category === "Alert").length} icon="alert" />
    </div>
    <div className={styles.list}>
      {visible.map((item) => (
        <article
          key={item.id}
          role="link"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onClick={() => openNotification(item)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openNotification(item);
            }
          }}
          aria-label={`Open ${item.title}`}
        >
          {item.unread && !readNotificationIds.includes(item.id) ? <i className={styles.unread} /> : null}
          <Icon category={item.category} />
          <div><h2>{item.title}</h2><p>{item.message}</p></div>
        </article>
      ))}
      {visible.length === 0 ? <EmptyState searchResult title="No notifications match" description="We couldn’t find any notifications matching your search or active filter." /> : null}
    </div>
  </section>;
}

function Summary({ label, value, icon }: { label: string; value: number; icon: string }) {
  return <article><span className={styles.summaryIcon}><Symbol kind={icon} /></span><div><h2>{label}</h2><p>{value}</p></div></article>;
}

function Icon({ category }: { category: Category }) {
  return <span className={`${styles.itemIcon} ${styles[category.toLowerCase()]}`}><Symbol kind={category.toLowerCase()} /></span>;
}

function Symbol({ kind }: { kind: string }) {
  if (kind === "mail") return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
  if (kind === "alert") return <svg viewBox="0 0 24 24"><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3h.01"/></svg>;
  if (kind === "relief") return <svg viewBox="0 0 24 24"><path d="M4 8h16v12H4zM8 8V5h8v3M4 12h16"/></svg>;
  if (kind === "system") return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>;
  return <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>;
}

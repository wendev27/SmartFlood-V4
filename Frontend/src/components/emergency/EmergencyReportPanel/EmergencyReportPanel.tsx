"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Pagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import styles from "./EmergencyReportPanel.module.css";

type View = "main" | "reports" | "history";
type Status = "Pending" | "En Route" | "Arrived" | "Resolved";
type ActiveStatus = Exclude<Status, "Resolved">;
type Report = { id: number; name: string; location: string; phone: string; status: Status; date: string; message: string };

const seedReports: Report[] = [
  { id: 1, name: "Sebastian Divina", location: "123 Recto St., Brgy. Potrero, Malabon City", phone: "0921-666-5544", status: "Pending", date: "May 12, 2025 • 9:41 AM", message: "Mataas na po ang baha sa aming lugar at mabilis pa ring tumataas ang tubig. Kailangan po namin ng agarang tulong upang makalikas nang ligtas." },
  { id: 2, name: "Sebastian Divina", location: "123 Recto St., Brgy. Potrero, Malabon City", phone: "0921-666-5544", status: "En Route", date: "May 12, 2025 • 9:41 AM", message: "Mataas na po ang baha sa aming lugar at mabilis pa ring tumataas ang tubig. Kailangan po namin ng agarang tulong upang makalikas nang ligtas." },
  { id: 3, name: "Sebastian Divina", location: "123 Recto St., Brgy. Potrero, Malabon City", phone: "0921-666-5544", status: "Arrived", date: "May 12, 2025 • 9:41 AM", message: "Mataas na po ang baha sa aming lugar at mabilis pa ring tumataas ang tubig. Kailangan po namin ng agarang tulong upang makalikas nang ligtas." },
  { id: 4, name: "Sebastian Divina", location: "123 Recto St., Brgy. Potrero, Malabon City", phone: "0921-666-5544", status: "Resolved", date: "May 12, 2025 • 9:41 AM", message: "Mataas na po ang baha sa aming lugar at mabilis pa ring tumataas ang tubig. Kailangan po namin ng agarang tulong upang makalikas nang ligtas." },
];

export function EmergencyReportPanel() {
  const [view, setView] = useState<View>("main");
  const [reports, setReports] = useState(seedReports);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ActiveStatus>("Pending");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Report | null>(null);
  const [evidenceIndex, setEvidenceIndex] = useState(0);
  const [toast, setToast] = useState<Status | null>(null);

  if (view === "main") return <Landing onOpen={setView} />;

  const isHistory = view === "history";
  const rows = reports.filter((report) => isHistory ? report.status === "Resolved" : report.status === statusFilter);
  const filtered = rows.filter((report) => `${report.name} ${report.location} ${report.phone} ${report.status}`.toLowerCase().includes(query.toLowerCase()));
  const pagination: PaginationState = { page, limit: 7, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / 7)) };
  const visibleRows = filtered.slice((page - 1) * 7, page * 7);

  function advance(report: Report) {
    if (report.status !== "Pending" && report.status !== "En Route") return;
    const next: Status = report.status === "Pending" ? "En Route" : "Arrived";
    setReports((current) => current.map((item) => item.id === report.id ? { ...item, status: next } : item));
    setSelected({ ...report, status: next });
    setToast(next);
  }

  return (
    <section className={styles.page} aria-label={isHistory ? "Emergency history" : "Emergency reports"}>
      <button className={styles.back} type="button" onClick={() => { setView("main"); setQuery(""); setStatusFilter("Pending"); setPage(1); }}>← Back</button>
      <h1>{isHistory ? "Emergency History" : "Emergency Report"}</h1>
      {!isHistory ? <div className={styles.statusTabs} role="tablist" aria-label="Emergency report status">
        {(["Pending", "En Route", "Arrived"] as ActiveStatus[]).map((status) => {
          const count = reports.filter((report) => report.status === status).length;
          return <button key={status} type="button" role="tab" aria-selected={statusFilter === status} onClick={() => { setStatusFilter(status); setPage(1); }}>
            <span className={styles.statusTabIcon} aria-hidden="true">{status === "Pending" ? "◷" : status === "En Route" ? "→" : "✓"}</span>
            {status}<small>{count}</small>
          </button>;
        })}
      </div> : null}
      <div className={styles.searchBar}><label><SearchIcon /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search" aria-label="Search emergency reports" /></label></div>
      <div className={styles.tableWrap}>
        <table><thead><tr><th>Name</th><th>Location</th><th>Phone Number</th><th>Status</th><th /></tr></thead>
          <tbody>{visibleRows.map((report) => <tr key={report.id}><td>{report.name}</td><td>{report.location}</td><td>{report.phone}</td><td><span className={styles[statusClass(report.status)]}>{report.status}</span></td><td><button className={styles.details} type="button" onClick={() => setSelected(report)}><EyeIcon />Details</button></td></tr>)}</tbody>
        </table>
        {!visibleRows.length ? <div className={styles.empty}>No emergency {isHistory ? "history records" : "reports"} available.</div> : null}
      </div>
      <Pagination compact pagination={pagination} onPageChange={setPage} label="Emergency reports" />
      {selected ? createPortal(<div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
        {toast ? <button type="button" className={styles.toast} onClick={() => setToast(null)}><b>✓</b><span><strong>{toast}</strong><small>{toast === "Arrived" ? "You have arrived at the location." : "You are now en route to the location."}</small></span></button> : null}
        <article className={styles.dialog} role="dialog" aria-modal="true"><button className={styles.close} onClick={() => setSelected(null)} aria-label="Close">×</button>
          <header><span className={styles.avatar}><UserIcon /></span><div><h2>{selected.name}</h2><p>{selected.date}</p></div></header>
          <div className={styles.contact}><p><span className={styles.contactIcon}><PinIcon /></span><span>BLK. 16-B, LOT 64 Padas Alley, Dagat-Dagatan, Caloocan, Metro Manila<small>MX37+5M Caloocan, Metro Manila</small></span></p><p><span className={styles.contactIcon}><PhoneIcon /></span>0997 452 1458</p></div>
          <div className={styles.message}><p>Mataas na po ang baha sa aming lugar at mabilis pa ring tumataas ang tubig sa kasalukuyan. Pasok na po ang baha sa loob ng bahay at nagbabanta na sa aming kaligtasan. Hindi na po ligtas para sa amin ang lumabas o lumakad nang mag-isa dahil sa lakas ng agos at lalim ng tubig sa paligid.</p><p>Kailangan na po namin ng agarang tulong o rescue team para makalikas nang ligtas patungo sa pinakamalapit na evacuation center bago pa man lalong tumaas ang tubig.</p><p>Nawawalan na rin po kami ng kuryente at access sa linis na tubig. Kung may nakakakilala po sa mga barangay officials, Caloocan CDRRMO, Red Cross, o anumang rescue group sa Dagat-Dagatan area, paki-report po ang aming kinaroroonan.</p></div>
          <EvidenceCarousel activeIndex={evidenceIndex} onChange={setEvidenceIndex} />
          {selected.status === "Pending" || selected.status === "En Route" ? <button className={styles.advance} data-status={selected.status} type="button" onClick={() => advance(selected)}>Mark as {selected.status === "Pending" ? "En Route" : "Arrived"}</button> : null}
          {selected.status === "Arrived" ? <p className={styles.awaitingResolution}>Awaiting the resident to confirm that this emergency has been resolved.</p> : null}
          {selected.status === "Resolved" ? <blockquote>“The rescue team responded quickly and assisted our family during the flooding. Thank you.”</blockquote> : null}
        </article>
      </div>, document.body) : null}
    </section>
  );
}

function Landing({ onOpen }: { onOpen: (view: View) => void }) {
  return <section className={styles.cards} aria-label="Emergency report management modules">
    <button type="button" onClick={() => onOpen("reports")}><span><AlertIcon /></span><strong>Emergency Report</strong><p>View real-time emergency report from the residents</p></button>
    <button type="button" onClick={() => onOpen("history")}><span><HistoryIcon /></span><strong>Emergency History</strong><p>View tabulated emergency history records</p></button>
  </section>;
}

const statusClass = (status: Status) => status.toLowerCase().replace(" ", "");
function SearchIcon(){return <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>}
function EyeIcon(){return <svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>}
function PinIcon(){return <svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>}
function PhoneIcon(){return <svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>}
function UserIcon(){return <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-5 3.5-7 8-7s7.2 2 8 7"/></svg>}
const evidencePhotos = ["flood-house.png", "flood-street.png", "flood-aerial.png", "flood-rescue.png"];
function EvidenceCarousel({activeIndex,onChange}:{activeIndex:number;onChange:(value:number)=>void}){const src=`/images/emergency-reports/${evidencePhotos[activeIndex]}`;return <section className={styles.carousel} aria-label="Emergency report evidence photos"><div className={styles.carouselMain}><a href={src} target="_blank" rel="noreferrer"><img src={src} alt={`Flood evidence ${activeIndex+1}`} /></a><button className={styles.carouselPrev} type="button" onClick={()=>onChange((activeIndex-1+evidencePhotos.length)%evidencePhotos.length)}>‹</button><button className={styles.carouselNext} type="button" onClick={()=>onChange((activeIndex+1)%evidencePhotos.length)}>›</button><span>{activeIndex+1} / {evidencePhotos.length}</span></div><div className={styles.thumbnails}>{evidencePhotos.map((photo,index)=><button key={photo} className={index===activeIndex?styles.activeThumb:""} type="button" onClick={()=>onChange(index)}><img src={`/images/emergency-reports/${photo}`} alt="" /></button>)}</div></section>}
function AlertIcon(){return <svg viewBox="0 0 44 44"><path d="M22 16.5v9.2M22 39.3H10.9c-6.4 0-9-4.6-6-10.1L16.1 9.2c3.2-5.9 8.6-5.9 11.8 0l11.2 20c3 5.5.4 10.1-6 10.1H22Z"/><path d="M22 31.2h.01"/></svg>}
function HistoryIcon(){return <svg viewBox="0 0 44 44"><path d="M23.8 27.5h-11l3.7 3.7m-3.7-3.7 3.7-3.7M40.3 18.3v9.2c0 9.2-3.6 12.8-12.8 12.8h-11c-9.2 0-12.8-3.6-12.8-12.8v-11c0-9.2 3.6-12.8 12.8-12.8h9.2"/><path d="M40.3 18.3H33c-5.5 0-7.3-1.8-7.3-7.3V3.7L40.3 18.3Z"/></svg>}

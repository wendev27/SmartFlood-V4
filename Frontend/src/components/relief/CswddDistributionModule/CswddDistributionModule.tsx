"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/Pagination/Pagination";
import { formatBarangayName, normalizeBarangayForCompare } from "@/lib/formatters";
import { queryKeys, queryStaleTime } from "@/lib/queryKeys";
import { getReliefCampaignHistory, getReliefDistributionHistory } from "@/services/emergencyService";
import type { ReliefDistributionRecord } from "@/types/emergency";
import styles from "./CswddDistributionModule.module.css";

type View = "main" | "list" | "history";
const pageSize = 6;

export function CswddDistributionModule({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("main");
  const [page, setPage] = useState(1);
  const campaignsQuery = useQuery({ queryKey: queryKeys.relief.campaigns, queryFn: getReliefCampaignHistory, staleTime: queryStaleTime.operational });
  const campaigns = campaignsQuery.data ?? [];
  const campaign = campaigns.find((item) => item.status === "in_distribution") ?? campaigns[0] ?? null;
  const historyQuery = useQuery({
    queryKey: queryKeys.relief.distributionHistory(campaign?.batch_id, 1, 100),
    queryFn: () => getReliefDistributionHistory(campaign?.batch_id, 1, 100),
    enabled: Boolean(campaign?.batch_id),
    staleTime: queryStaleTime.operational,
  });
  const records = historyQuery.data?.distributions ?? [];
  useEffect(() => setPage(1), [view]);

  if (view === "main") return <DistributionLanding onBack={onBack} onSelect={setView} />;
  return <DistributionRecords view={view} records={records} campaignName={campaign?.plan_name ?? "Campaign allocation"} page={page} loading={historyQuery.isPending || campaignsQuery.isPending} refreshing={historyQuery.isFetching} onRefresh={() => historyQuery.refetch()} onBack={() => setView("main")} onPage={setPage} />;
}

function DistributionLanding({ onBack, onSelect }: { onBack: () => void; onSelect: (view: View) => void }) {
  return <section className={styles.page}>
    <button className={styles.back} type="button" onClick={onBack}>← Back</button>
    <h1>Relief Distribution List</h1>
    <div className={styles.optionGrid}>
      <button type="button" onClick={() => onSelect("list")}><span><ClipboardList /></span><strong>Distribution List</strong></button>
      <button type="button" onClick={() => onSelect("history")}><span><Clock3 /></span><strong>Distribution History</strong></button>
    </div>
  </section>;
}

function DistributionRecords({ view, records, campaignName, page, loading, refreshing, onRefresh, onBack, onPage }: { view:"list"|"history"; records:ReliefDistributionRecord[]; campaignName:string; page:number; loading:boolean; refreshing:boolean; onRefresh:()=>void; onBack:()=>void; onPage:(page:number)=>void }) {
  const [barangay, setBarangay] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [distributionDate, setDistributionDate] = useState("");
  const barangays = useMemo(() => Array.from(new Set([
    "Barangay Longos",
    "Barangay Potrero",
    "Barangay Tañong",
    ...(records.map((row) => row.barangay_name).filter(Boolean) as string[]),
  ])).sort(), [records]);
  const filtered = useMemo(() => records.filter((row) => {
    const recordDate = row.verified_at ? new Date(row.verified_at).toLocaleDateString("en-CA") : "";
    return (!barangay || normalizeBarangayForCompare(row.barangay_name ?? "") === normalizeBarangayForCompare(barangay))
      && (!recommendation || campaignName.toLowerCase().includes(recommendation))
      && (!distributionDate || recordDate === distributionDate);
  }), [barangay, campaignName, distributionDate, recommendation, records]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pagination = { page:safePage, limit:pageSize, total:filtered.length, totalPages };
  const familyRows = useMemo(() => visibleRows, [visibleRows]);
  return <section className={`${styles.recordsPage} ${view === "list" ? styles.listPage : styles.distributionHistoryPage}`}>
    <button className={styles.back} type="button" onClick={onBack}>← Back</button>
    <div className={styles.titleRow}><h1>{view === "list" ? "Distribution List" : "Distribution History"}</h1>{view === "list" ? <button type="button" onClick={onRefresh} aria-label="Refresh distribution list"><RefreshCw className={refreshing ? styles.spinning : ""} /></button> : null}</div>
    {loading ? <p className={styles.message}>Loading distribution records...</p> : null}
    {view === "history" ? <div className={styles.filters}><label>Barangay<select value={barangay} onChange={(event)=>{setBarangay(event.target.value);onPage(1)}}><option value="">All Barangays</option>{barangays.map((name)=><option key={name}>{name}</option>)}</select></label><label>Type of recommendation<select value={recommendation} onChange={(event)=>{setRecommendation(event.target.value);onPage(1)}}><option value="">All recommendation types</option><option value="severity">Severity first</option><option value="vulnerability">Vulnerability first</option><option value="balanced">Balanced</option></select></label><label>Distribution Date<input type="date" value={distributionDate} onChange={(event)=>{setDistributionDate(event.target.value);onPage(1)}} /></label></div> : null}
    {view === "history" ? <><HistoryTable title="Individual" rows={[]} campaignName={campaignName} /><HistoryTable title="Family" rows={familyRows} campaignName={campaignName} /></> : <ListTable rows={visibleRows} start={(safePage - 1) * pageSize} />}
    {!loading && filtered.length === 0 ? <p className={styles.empty}>No confirmed relief distributions are available.</p> : null}
    <Pagination pagination={pagination} onPageChange={onPage} label="Distribution records" compact />
  </section>;
}

function ListTable({ rows, start }: { rows: ReliefDistributionRecord[]; start:number }) {
  return <div className={styles.tableWrap}><table><thead><tr><th>ID</th><th>Name</th><th>Barangay</th><th>Date &amp; Time</th><th>Status</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.distribution_id}><td>{String(start+index+1).padStart(3,"0")}</td><td><strong>{row.family_head_name ?? row.family_name ?? "Family"}</strong><small>Family Head</small></td><td>{formatBarangayName(row.barangay_name ?? `Barangay ${row.barangay_id}`)}</td><td>{formatDate(row.verified_at)}</td><td className={styles.received}>Received</td></tr>)}</tbody></table></div>;
}

function HistoryTable({ title, rows, campaignName }: { title:"Individual"|"Family"; rows:ReliefDistributionRecord[]; campaignName:string }) {
  return <div className={styles.historyTable}><table><thead><tr><th>ID</th><th>{title === "Individual" ? "Last Name" : "Family Name"}</th><th>{title === "Individual" ? "First Name" : "Family Head"}</th><th>Type of recommendation</th><th>Status</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.distribution_id}><td>{String(index+1).padStart(3,"0")}</td><td>{formatDate(row.created_at)}</td><td>{formatDate(row.verified_at)}</td><td className={styles.recommendationType}>{campaignName}</td><td className={styles.received}>Received</td></tr>)}</tbody></table></div>;
}

function formatDate(value?: string|null) { if(!value) return "Not recorded"; const date=new Date(value); return <><span>{date.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</span><small>{date.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</small></>; }
function ClipboardList(){return <svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4"/></svg>}
function Clock3(){return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>}
function RefreshCw({className=""}:{className?:string}){return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/><path d="M21 21v-5h-5"/></svg>}

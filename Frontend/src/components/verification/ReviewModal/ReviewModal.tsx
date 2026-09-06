"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { formatBarangayName } from "@/lib/formatters";
import type { VerificationApplication } from "@/types/verification";
import styles from "./ReviewModal.module.css";

interface ReviewModalProps { isOpen: boolean; application: VerificationApplication | null; onApprove: (notes?: string) => void; onReject: (notes?: string) => void; onClose: () => void; }

export function ReviewModal({ isOpen, application, onApprove, onReject, onClose }: ReviewModalProps) {
  const raw = application?.raw ?? {};
  const isPending = (application?.status ?? "pending") === "pending";
  const [notes, setNotes] = useState("");
  useEffect(() => { if (isOpen) setNotes(String(raw.admin_review_notes ?? "")); }, [isOpen, application?.application_id, raw.admin_review_notes]);

  return <Modal isOpen={isOpen} onClose={onClose} labelledBy="review-title" className={styles.modal} backdropClassName={styles.backdrop} size="xl">
    <header className={styles.header}><h2 id="review-title" className="srOnly">Review Resident Application</h2><button className={styles.close} type="button" aria-label="Close review" onClick={onClose}>×</button></header>
    <div className={styles.body}>
      <ReviewSection title="Personal Information" className={styles.personal}>
        <Field label="Last Name" value={raw.last_name} /><Field label="First Name" value={raw.first_name} /><Field label="Middle Name" value={raw.middle_name || "N/A"} /><Field label="Suffix" value={raw.suffix || "N/A"} /><Field label="Age" value={raw.age} /><Field label="Sex" value={raw.sex} /><Field label="Contact Number" value={raw.contact_number || application?.phone} /><CheckField label="Family Head" checked={Boolean(raw.is_family_head)} />
      </ReviewSection>
      <ReviewSection title="Location Information" className={styles.location}><Field label="Complete Address" value={raw.complete_address || application?.address} /><Field label="Barangay" value={application?.barangay} /></ReviewSection>
      <div className={styles.household}><Field label="Number of PWD" value={raw.number_of_pwd ?? raw.pwd_count ?? 0} /></div>
      <div className={styles.noChildren}><CheckField label="No Children" checked={Boolean(raw.no_children)} /></div>
      <ReviewSection title="Submission Details" className={styles.submission}><Readout label="Date Submitted" value={application?.submitted} /><Readout label="Submitted By" value={raw.source || "Self-registered"} /></ReviewSection>
      <label className={styles.notes}><span>Admin Review Notes (Optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add any notes about this application..." readOnly={!isPending} /></label>
      <footer className={styles.actions}>{isPending ? <><Button tone="danger" onClick={() => onReject(notes.trim() || undefined)}>Reject</Button><Button tone="success" onClick={() => onApprove(notes.trim() || undefined)}>Approve</Button></> : <Button onClick={onClose}>Close</Button>}</footer>
    </div>
  </Modal>;
}

function ReviewSection({ title, className, children }: { title: string; className: string; children: ReactNode }) { return <section className={`${styles.section} ${className}`}><h3>{title}</h3><div>{children}</div></section>; }
function Field({ label, value }: { label: string; value: unknown }) { return <label className={styles.field}><span>{label}</span><output>{formatBarangayName(String(value ?? "N/A"))}</output></label>; }
function Readout({ label, value }: { label: string; value: unknown }) { return <div className={styles.readout}><span>{label}</span><b>{formatBarangayName(String(value ?? "N/A"))}</b></div>; }
function CheckField({ label, checked }: { label: string; checked: boolean }) { return <label className={styles.checkField}><input type="checkbox" checked={checked} readOnly /><span>{label}</span></label>; }

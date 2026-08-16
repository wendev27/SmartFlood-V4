import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { Badge } from "@/components/ui/Badge/Badge";
import { formatBarangayName } from "@/lib/formatters";
import type { VerificationApplication } from "@/types/verification";
import styles from "./ReviewModal.module.css";

interface ReviewModalProps {
  isOpen: boolean;
  application: VerificationApplication | null;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function ReviewModal({ isOpen, application, onApprove, onReject, onClose }: ReviewModalProps) {
  const raw = application?.raw ?? {};
  const status = application?.status ?? "pending";
  const isPending = status === "pending";
  const reviewedAt = String(raw.reviewed_at ?? "");
  const reviewedBy = String(raw.reviewed_by ?? "");
  const reviewNotes = String(raw.admin_review_notes ?? "");
  const title = isPending
    ? "Review Resident Application"
    : status === "approved"
      ? "Approved Resident Application"
      : "Rejected Resident Application";

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="review-title">
      <header className={styles.header}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{application?.initials ?? "NA"}</div>
          <div className={styles.titleBlock}>
            <div className={styles.titleRow}>
              <h2 id="review-title">{title}</h2>
              {application ? (
                <Badge tone={status === "approved" ? "green" : status === "rejected" ? "red" : "blue"}>
                  {capitalize(status)}
                </Badge>
              ) : null}
            </div>
            <p>{application?.name ?? "Application"} · Resident Registration</p>
          </div>
        </div>
        <button className={styles.close} type="button" aria-label="Close review" onClick={onClose} />
      </header>
      <div className={styles.body}>
        <ReviewSection title="Personal Information" columns={3} fields={[
          ["Surname", String(raw.last_name ?? "")], ["First Name", String(raw.first_name ?? "")], ["Middle Name", String(raw.middle_name ?? "N/A")],
          ["Contact Number", String(raw.contact_number ?? application?.phone ?? "")], ["Age & Sex", `${raw.age ?? ""} ${raw.sex ?? ""}`.trim()], ["Occupation", String(raw.occupation ?? "N/A")],
        ]} />
        <ReviewSection title="Location Information" fields={[
          ["Complete Address", String(raw.complete_address ?? application?.address ?? "")], ["Barangay", application?.barangay ?? ""],
        ]} />
        <ReviewSection title="Family & Household Information" columns={3} fields={[
          ["Total Family Members", String(raw.total_family_members ?? application?.familyMembers ?? "")], ["Household Head", raw.is_family_head ? "Yes" : "No"], ["Special Needs", String(raw.special_needs ?? "N/A")], ["Medical Conditions", String(raw.medical_conditions ?? "N/A")],
        ]} />
        <ReviewSection title="Submission Details" columns={2} fields={[
          ["Date Submitted", application?.submitted ?? ""], ["Submitted By", String(raw.source ?? "Self-registered")],
        ]} />
        {!isPending ? (
          <ReviewSection title="Review Details" columns={3} fields={[
            ["Status", capitalize(status)],
            ["Reviewed At", reviewedAt || "N/A"],
            ["Reviewed By", reviewedBy || "N/A"],
            ["Review Notes", reviewNotes || "N/A"],
          ]} />
        ) : null}
        <footer className={styles.actions}>
          {isPending ? (
            <>
              <Button tone="danger" onClick={onReject}>⊗ Reject Application</Button>
              <Button tone="success" onClick={onApprove}>✓ Approve Application</Button>
            </>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </footer>
      </div>
    </Modal>
  );
}

interface ReviewSectionProps {
  title: string;
  fields: Array<[string, string]>;
  columns?: 1 | 2 | 3;
}

function ReviewSection({ title, fields, columns = 1 }: ReviewSectionProps) {
  return (
    <section className={styles.section}>
      <h3><span />{title}</h3>
      <div className={styles[`cols${columns}`]}>
        {fields.map(([label, value], index) => (
          <div key={`${label}-${index}`} className={index === 3 && fields.length === 4 ? styles.wide : undefined}>
            <span>{label}</span>
            <b>{formatBarangayName(value)}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

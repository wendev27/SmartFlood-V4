import type { VerificationApplication } from "@/types/verification";
import { Badge } from "@/components/ui/Badge/Badge";
import { Button } from "@/components/ui/Button/Button";
import { formatBarangayName } from "@/lib/formatters";
import styles from "./ApplicationCard.module.css";

interface ApplicationCardProps {
  application: VerificationApplication;
  onReview: () => void;
  onEdit?: () => void;
}

export function ApplicationCard({ application, onReview, onEdit }: ApplicationCardProps) {
  const isPending = application.status === "pending";

  return (
    <article className={styles.card}>
      <div className={styles.avatar}>{application.initials}</div>
      <div className={styles.main}>
        <div className={styles.nameRow}>
          <h3>{application.name}</h3>
          <Badge tone={application.status === "approved" ? "green" : application.status === "rejected" ? "red" : "blue"}>
            {capitalize(application.status)}
          </Badge>
        </div>
        <div className={styles.details}>
          <p><small>Type</small>{application.type.replace(" ", "\n")}</p>
          <p><small>Barangay</small>{formatBarangayName(application.barangay)}</p>
          <p><small>Family Members</small>{application.familyMembers}</p>
          <p><small>Submitted</small>{application.submitted}</p>
        </div>
        <p className={styles.meta}>{application.phone}</p>
        <p className={styles.meta}>{formatBarangayName(application.address)}</p>
        {application.approvalNote ? (
          <div className={styles.approvalNote}>
            <p>{application.approvalNote.approvedBy}</p>
            <p>{formatBarangayName(application.approvalNote.details)}</p>
          </div>
        ) : null}
      </div>
      <div className={styles.actions}>
        <Button onClick={onReview}>⊙ {isPending ? "Review" : "View"}</Button>
        {onEdit ? <Button tone="muted" onClick={onEdit}>✎ Edit</Button> : null}
      </div>
    </article>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

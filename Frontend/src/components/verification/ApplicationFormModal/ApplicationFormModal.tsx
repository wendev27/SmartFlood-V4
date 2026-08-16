import type { ApplicationFormValues, ModalMode } from "@/types/verification";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { formatBarangayName } from "@/lib/formatters";
import styles from "./ApplicationFormModal.module.css";

interface ApplicationFormModalProps {
  isOpen: boolean;
  mode: ModalMode;
  values: ApplicationFormValues;
  onClose: () => void;
}

export function ApplicationFormModal({ isOpen, mode, values, onClose }: ApplicationFormModalProps) {
  const isAdd = mode === "add";

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="application-title">
      <header className={styles.header}>
        <div className={styles.avatar}>{isAdd ? "+" : "PG"}</div>
        <div><h2 id="application-title">{isAdd ? "Add Application" : "Edit Application"}</h2><p>Resident Registration</p></div>
        <button className={styles.close} type="button" aria-label="Close application form" onClick={onClose} />
      </header>
      <form className={styles.form}>
        <FieldSet title="Personal Information" values={[
          ["Surname", values.surname], ["First Name", values.firstName], ["Middle Name", values.middleName],
          ["Contact Number", values.contactNumber], ["Age & Sex", values.ageSex], ["Occupation", values.occupation],
        ]} />
        <FieldSet title="Location Information" values={[
          ["Complete Address", values.completeAddress], ["Barangay", values.barangay],
        ]} />
        <FieldSet title="Family & Household Information" values={[
          ["Total Family Members", values.totalFamilyMembers], ["Household Head", values.householdHead], ["Special Needs", values.specialNeeds], ["Medical Conditions", values.medicalConditions],
        ]} />
        <footer className={styles.actions}>
          <Button size="sm">{isAdd ? "Add" : "Save"}</Button>
          <Button size="sm" tone="muted" onClick={onClose}>Cancel</Button>
          {!isAdd ? <Button size="sm" tone="danger">Delete</Button> : null}
        </footer>
      </form>
    </Modal>
  );
}

function FieldSet({ title, values }: { title: string; values: Array<[string, string]> }) {
  return (
    <section className={styles.section}>
      <h3><span />{title}</h3>
      <div className={styles.grid}>
        {values.map(([label, value], index) => (
          <label key={`${label}-${index}`} className={index === 3 && values.length === 4 ? styles.wide : undefined}>
            {label}
            <input type="text" defaultValue={formatBarangayName(value)} />
          </label>
        ))}
      </div>
    </section>
  );
}

import type { SystemPulseItem } from '@/types/dashboard';
import styles from './SystemPulse.module.css';

interface SystemPulseProps {
  items: SystemPulseItem[];
}

export function SystemPulse({ items }: SystemPulseProps) {
  return (
    <aside className={styles.panel}>
      <div className={styles.heading}>
        <span className={styles.pulseIcon} />
        <div>
          <h3>SYSTEM PULSE</h3>
          <p>Real-time sensor monitoring</p>
        </div>
      </div>
      <dl className={styles.list}>
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd className={item.tone ? styles[item.tone] : undefined}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      <section className={styles.reliefCard}>
        <h3>
          <span />
          AI-Optimized Relief Suggestions
        </h3>
        <p>
          Waiting for real-time sensor updates for generated AI-powered relief
          recommendations...
        </p>
      </section>
    </aside>
  );
}

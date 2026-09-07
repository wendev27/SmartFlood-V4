import Image from "next/image";
import Link from "next/link";
import { LandingNavLink } from "@/components/landing/LandingNavLink";
import styles from "./page.module.css";

const pillars = [
  { icon: "/images/landing/drop-soft.svg", title: "Real-time Monitoring", text: "Know changing flood conditions before they become more dangerous." },
  { icon: "/images/landing/people-soft.svg", title: "Community Connected", text: "Connect residents, barangay officials, and disaster responders through one platform." },
  { icon: "/images/landing/shield-soft.svg", title: "Designed for Response", text: "Turn flood information into faster warnings, decisions, and assistance." },
];

const features = [
  { icon: "/images/landing/drop.svg", title: "Flood Monitoring", text: "Monitor water levels continuously through deployed flood sensors." },
  { icon: "/images/landing/bell.svg", title: "Alerts & Notification", text: "Receive SMS and in-app alerts for high water levels." },
  { icon: "/images/landing/report.svg", title: "Report Incidents", text: "Report flooding and emergencies with just a few taps." },
  { icon: "/images/landing/box.svg", title: "Relief Management", text: "Request relief assistance and track the status of your request." },
  { icon: "/images/landing/routing.svg", title: "Emergency Response", text: "Request immediate help when flood levels become dangerous and rescue is needed." },
  { icon: "/images/landing/people.svg", title: "Community Hub", text: "Stay informed and connected with your community." },
];

export default function Home() {
  return (
    <main className={styles.page} id="home">
      <header className={styles.header}>
        <Link className={styles.brand} href="#home" aria-label="SmartFlood home">
          <span className={styles.logoCrop}><Image src="/images/landing/logo.png" alt="" width={73} height={110} priority /></span>
          <span><strong>Smart</strong><strong>Flood</strong></span>
        </Link>
        <nav className={styles.nav} aria-label="Primary navigation">
          <LandingNavLink href="#home">Home</LandingNavLink><LandingNavLink href="#about">About</LandingNavLink><LandingNavLink href="#features">Features</LandingNavLink><LandingNavLink href="#contact">Contact</LandingNavLink>
        </nav>
        <details className={styles.mobileMenu}><summary aria-label="Open navigation"><i /><i /><i /></summary><nav><LandingNavLink href="#home">Home</LandingNavLink><LandingNavLink href="#about">About</LandingNavLink><LandingNavLink href="#features">Features</LandingNavLink><LandingNavLink href="#contact">Contact</LandingNavLink></nav></details>
      </header>
      <section className={styles.hero}>
        <Image className={styles.heroImage} src="/images/landing/hero.png" alt="SmartFlood solar-powered water-level monitoring station" fill priority sizes="100vw" />
        <div className={styles.heroShade} />
        <div className={styles.heroContent}>
          <h1><em>Smarter</em> Alerts.<br /><em>Safer</em> Communities.</h1>
          <p className={styles.heroCopy}>SmartFlood monitors water levels in real-time,<br />sends instant alerts, and helps communities<br />act before it&apos;s too late.</p>
          <div className={styles.actions}><Link className={styles.primaryButton} href="/login">Get Started</Link></div>
        </div>
      </section>
      <div className={styles.glassShell}>
        <section className={styles.about} id="about">
          <p className={styles.kicker}>About SmartFlood</p><h2>Technology Built for<br />Safer Communities</h2>
          <div className={styles.aboutCopy}><p>SmartFlood is a flood monitoring and disaster-response platform designed to help communities prepare, respond, and recover more effectively.</p><p>Through real-time water-level monitoring, automated alerts, emergency reporting, resident information, and relief coordination, SmartFlood gives both residents and responders the information they need when it matters most.</p></div>
          <div className={styles.pillars}>{pillars.map((pillar) => <article key={pillar.title}><span className={styles.roundIcon}><Image src={pillar.icon} alt="" width={70} height={70} /></span><h3>{pillar.title}</h3><p>{pillar.text}</p></article>)}</div>
        </section>
        <section className={styles.features} id="features">
          <p className={`${styles.kicker} ${styles.center}`}>Features</p><h2>Everything You Need to Stay Flood Ready</h2>
          <div className={styles.featureGrid}>{features.map((feature) => <article key={feature.title}><Image src={feature.icon} alt="" width={80} height={80} /><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
        </section>
        <footer className={styles.footer} id="contact">
          <div className={styles.footerGrid}>
            <div className={styles.footerAbout}><p className={styles.footerBrand}><strong>Smart</strong><strong>Flood</strong></p><p>A smart flood management system built to protect communities through advanced sensor technology and data-driven emergency response.</p></div>
            <address className={styles.contactDetails}><h4>Contact Us</h4><a href="mailto:iotninjas.smartflood@gmail.com">✉ iotninjas.smartflood@gmail.com</a></address>
          </div>
          <p className={styles.copyright}>© 2026 SmartFlood by IoT Ninjas. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}

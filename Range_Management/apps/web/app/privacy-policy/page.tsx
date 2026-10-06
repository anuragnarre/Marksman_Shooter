import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Marksman Platform',
  description: 'Comprehensive Privacy Policy for Marksman Shooting & Range Operations Platform, compliant with DPDP Act 2023, GDPR, CCPA, and App Store guidelines.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-void text-text-primary p-4 sm:p-8 md:p-12 lg:p-20 selection:bg-accent/30 font-body">
      <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/" className="text-xs font-display uppercase tracking-widest text-accent hover:underline flex items-center gap-1">
                &larr; Return to Marksman
              </Link>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-primary uppercase tracking-wider">
              Privacy Policy
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm mt-1">
              Effective Date: October 2026 | Version 2.4
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/terms-of-service" 
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-elevated hover:border-accent text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/delete-account" 
              className="px-3 py-1.5 rounded-lg border border-[rgba(255,77,109,0.3)] bg-[rgba(255,77,109,0.06)] hover:bg-[rgba(255,77,109,0.12)] text-xs font-medium text-[#FF4D6D] transition-colors"
            >
              Account Deletion
            </Link>
          </div>
        </div>

        {/* Overview Card */}
        <div className="card p-6 border-accent/20 bg-accent/5 rounded-xl space-y-3">
          <h2 className="font-display font-semibold text-lg text-accent uppercase tracking-wide">
            Summary & Our Commitment to Your Privacy
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Marksman (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) provides high-performance precision sports shooting analytics, range operations, and coach-athlete collaboration technology. We treat your biometric, telemetry, and training data with the highest standards of confidentiality, security, and statutory compliance under the <strong>Digital Personal Data Protection Act, 2023 (India)</strong>, the <strong>General Data Protection Regulation (EU/UK GDPR)</strong>, the <strong>California Consumer Privacy Act (CCPA/CPRA)</strong>, and mobile platform developer policies (Google Play &amp; Apple App Store).
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            1. Information We Collect
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            We collect personal and technical information necessary to deliver, personalize, and secure precision shooting analytics:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="card p-4 bg-elevated border-border-subtle rounded-lg space-y-2">
              <h3 className="text-accent font-display font-semibold text-sm">A. Account &amp; Profile Data</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Full name, email address, cryptographic password hash, profile photo, user role (Shooter, Coach, Range Operator, or Federation Official), club/academy affiliation, and firearm/equipment configurations (caliber, sight offsets, rifle/pistol models).
              </p>
            </div>

            <div className="card p-4 bg-elevated border-border-subtle rounded-lg space-y-2">
              <h3 className="text-accent font-display font-semibold text-sm">B. Shooting Telemetry &amp; Vision Data</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Shot placement coordinates, string timing, split times, group dispersion metrics, cant angle, barrel stability sensors, optical target camera frames, electronic target scoring feeds, and historical session logs.
              </p>
            </div>

            <div className="card p-4 bg-elevated border-border-subtle rounded-lg space-y-2">
              <h3 className="text-[#00E5A0] font-display font-semibold text-sm">C. Biometric &amp; Physiological Metrics</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Optional connected sensor data via Bluetooth Low Energy (BLE) or wearable integrations, including heart rate, heart rate variability (HRV), breathing patterns during shot execution, and tremor analysis. <em>(Used exclusively for performance insights; never sold or monetized.)</em>
              </p>
            </div>

            <div className="card p-4 bg-elevated border-border-subtle rounded-lg space-y-2">
              <h3 className="text-text-primary font-display font-semibold text-sm">D. Device &amp; Diagnostic Information</h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                Device model, operating system version, unique device tokens for push notifications, IP address, crash telemetry, and network latency logs.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            2. Legal Grounds for Data Processing
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            We process your personal information under the following legitimate legal frameworks:
          </p>
          <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm ml-2">
            <li><strong className="text-text-primary">Performance of Contract:</strong> Providing shooting calculations, target analysis, session storage, and coach review capabilities.</li>
            <li><strong className="text-text-primary">Explicit Consent:</strong> Processing sensitive biometric sensor metrics, physiological tracking, and optional video camera stream detection.</li>
            <li><strong className="text-text-primary">Legitimate Interests:</strong> Securing platform infrastructure, debugging system anomalies, improving computer vision accuracy, and preventing fraud.</li>
            <li><strong className="text-text-primary">Statutory Obligations:</strong> Maintaining range compliance and safety logs where required by local sport and range licensing authorities.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            3. Coach-Athlete Sharing &amp; Range Collaboration
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            Marksman enables athletes to connect with certified coaches and range facilities. When you link your Shooter profile to a Coach or join a Range Session:
          </p>
          <div className="card p-4 bg-elevated border-border-subtle rounded-lg space-y-2 text-sm text-text-secondary">
            <p>
              &bull; Your authorized Coach can view your shot logs, session telemetry, dispersion diagrams, and physiological stability charts.
            </p>
            <p>
              &bull; You may revoke Coach access or unlink from an Academy roster at any moment via your <strong>Account Settings</strong>.
            </p>
            <p>
              &bull; Range Operators only receive aggregate session timing, lane occupancy, and safety check-ins necessary for range command and control.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            4. India DPDP Act 2023 &amp; Statutory Compliance
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            In compliance with the <strong>Digital Personal Data Protection Act, 2023</strong>:
          </p>
          <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm ml-2">
            <li><strong className="text-text-primary">Notice &amp; Consent:</strong> You are provided clear, itemized notice in plain language before any telemetry or biometric data collection.</li>
            <li><strong className="text-text-primary">Right to Access &amp; Summary:</strong> You have the right to obtain a summary of your personal data processed by Marksman.</li>
            <li><strong className="text-text-primary">Right to Correction &amp; Erasure:</strong> You may request correction of inaccurate data or complete erasure of your profile.</li>
            <li><strong className="text-text-primary">Right of Grievance Redressal:</strong> Our designated Grievance Officer responds to complaints within the statutory timeframe.</li>
            <li><strong className="text-text-primary">Right to Nominate:</strong> You have the right to nominate an individual to exercise your privacy rights in the event of death or incapacity.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            5. GDPR (EU/UK) &amp; CCPA/CPRA (California) Rights
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            Users in the European Union, United Kingdom, California, and other jurisdictions enjoy global privacy safeguards:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text-secondary">
            <div className="p-3 bg-elevated rounded border border-border-subtle">
              <strong className="text-text-primary block mb-1">Right to Portability</strong>
              Export your full session history, ballistics tables, and shot data in open JSON or CSV formats.
            </div>
            <div className="p-3 bg-elevated rounded border border-border-subtle">
              <strong className="text-text-primary block mb-1">No Sale of Personal Data</strong>
              Marksman does <strong>NOT</strong> sell, rent, or trade your personal or biometric information to data brokers or third-party advertisers.
            </div>
            <div className="p-3 bg-elevated rounded border border-border-subtle">
              <strong className="text-text-primary block mb-1">Right to Restriction &amp; Objection</strong>
              You can restrict automated algorithmic processing or AI-driven shot recommendation models.
            </div>
            <div className="p-3 bg-elevated rounded border border-border-subtle">
              <strong className="text-text-primary block mb-1">Opt-Out of Analytics</strong>
              Toggle diagnostic tracking and crash metrics in application settings anytime.
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            6. Protection of Youth &amp; Junior Athletes (Under 18)
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            Marksman supports youth sports development in competitive precision shooting. For shooters under the age of majority (under 18 in India / under 13-16 in US &amp; EU):
          </p>
          <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm ml-2">
            <li>Accounts must be created with verified consent from a parent, legal guardian, or recognized sports academy coach.</li>
            <li>We do not engage in behavioral profiling, targeted marketing, or public indexing of minor athlete accounts.</li>
            <li>Parents and guardians retain full authority to review, download, or delete their child&apos;s training records.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            7. Mobile App Store Compliance &amp; Account Deletion
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            In compliance with <strong>Apple App Store Rule 5.1.1(v)</strong> and <strong>Google Play User Data Policies</strong>:
          </p>
          <div className="card p-5 border-border-subtle bg-elevated rounded-xl space-y-3 text-sm">
            <p className="text-text-secondary">
              Users can delete their account directly inside the iOS/Android mobile app (under <em>Settings &rarr; Account &rarr; Delete Account</em>) as well as via our web portal:
            </p>
            <div className="pt-2">
              <Link
                href="/delete-account"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.3)] text-[#FF4D6D] font-medium text-xs hover:bg-[rgba(255,77,109,0.2)] transition-colors"
              >
                Access Self-Serve Account Deletion Tool &rarr;
              </Link>
            </div>
            <p className="text-xs text-text-muted mt-2">
              <strong>Data Deletion Scope:</strong> All personal profile records, biometric readings, uploaded target images, and training logs are permanently purged from production databases upon confirmation. Backups are cycled out within 30 days.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            8. Security Measures &amp; Data Storage
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            We protect your training and personal assets with defense-in-depth security engineering:
          </p>
          <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm ml-2">
            <li><strong className="text-text-primary">Encryption in Transit:</strong> Transport Layer Security (TLS 1.3) across all API endpoints and WebSocket telemetry feeds.</li>
            <li><strong className="text-text-primary">Encryption at Rest:</strong> AES-256 database storage for credentials, telemetry, and media archives.</li>
            <li><strong className="text-text-primary">Access Controls:</strong> Role-based access control (RBAC), multi-tenant isolation, and continuous vulnerability scanning.</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            9. Grievance Officer &amp; Privacy Contact
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            For questions, data subject access requests (DSAR), or privacy complaints, contact our Data Protection &amp; Grievance Officer:
          </p>
          <div className="card p-5 bg-elevated border-border-subtle rounded-xl text-sm space-y-1">
            <p className="font-semibold text-text-primary">Data Protection &amp; Grievance Redressal Officer</p>
            <p className="text-text-secondary">Marksman Precision Sports &amp; Range Technologies</p>
            <p className="text-text-secondary">Email: <a href="mailto:privacy@marksman.app" className="text-accent hover:underline">privacy@marksman.app</a></p>
            <p className="text-text-secondary">Support Portal: <a href="mailto:support@marksman.app" className="text-accent hover:underline">support@marksman.app</a></p>
            <p className="text-text-muted text-xs pt-2">Response turnaround time: Within 7 business days.</p>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-border-subtle pt-6 text-center text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Marksman Shooting Platform. All rights reserved.
        </div>

      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Marksman Platform',
  description: 'Terms of Service, Range Safety Disclaimer, Assumption of Risk, and Sports Shooting Agreement for the Marksman Precision Platform.',
};

export default function TermsOfServicePage() {
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
              Terms of Service
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm mt-1">
              Effective Date: October 2026 | Version 2.4
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/privacy-policy" 
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-elevated hover:border-accent text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/delete-account" 
              className="px-3 py-1.5 rounded-lg border border-[rgba(255,77,109,0.3)] bg-[rgba(255,77,109,0.06)] hover:bg-[rgba(255,77,109,0.12)] text-xs font-medium text-[#FF4D6D] transition-colors"
            >
              Account Deletion
            </Link>
          </div>
        </div>

        {/* Critical Safety & Range Liability Waiver Callout */}
        <div className="card p-6 border-[rgba(245,166,35,0.4)] bg-[rgba(245,166,35,0.06)] rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-accent font-display font-bold text-sm tracking-wider uppercase">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Mandatory Sports Shooting &amp; Firearm Safety Disclaimer
          </div>
          <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
            <strong>MARKSMAN IS A SPORTS ANALYTICS AND TRAINING APPLICATION ONLY.</strong> It does not replace certified firearms instruction, certified Range Safety Officers (RSOs), or strict adherence to universal gun safety protocols. You assume all inherent risks of target sports. Under no circumstances is Marksman liable for personal injury, property damage, range mishaps, or weapon malfunctions occurring during physical shooting sessions.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            1. Acceptance of Terms &amp; Eligibility
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            By creating an account, accessing, or using the Marksman application, website, and hardware integrations, you agree to comply with and be legally bound by these Terms of Service.
          </p>
          <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm ml-2">
            <li>You must have the legal capacity to enter into a binding agreement in your jurisdiction.</li>
            <li>If you are a minor (under the age of majority in your jurisdiction), you may only access the service with verified parental, guardian, or registered sports academy coach authorization.</li>
            <li>You agree to comply with all applicable local, regional, and national laws concerning sports shooting, target ranges, and firearm licensing (e.g., Arms Act &amp; Rules in India, ISSF rules, local state regulations).</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            2. Universal Range Safety &amp; Assumption of Risk Waiver
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            All users, coaches, and range operators utilizing the Marksman platform on physical shooting lines must adhere to strict firearm safety rules at all times:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3 text-xs text-text-secondary">
            <div className="p-3 bg-elevated rounded-lg border border-border-subtle space-y-1">
              <strong className="text-text-primary block font-display">Rule 1: Always Treat Every Firearm as Loaded</strong>
              Never assume a weapon is unloaded or cold. Verify physical clearance every time you handle equipment.
            </div>
            <div className="p-3 bg-elevated rounded-lg border border-border-subtle space-y-1">
              <strong className="text-text-primary block font-display">Rule 2: Muzzle Direction &amp; Safe Trajectory</strong>
              Always keep the firearm pointed downrange in a designated safe direction.
            </div>
            <div className="p-3 bg-elevated rounded-lg border border-border-subtle space-y-1">
              <strong className="text-text-primary block font-display">Rule 3: Trigger Discipline</strong>
              Keep your finger off the trigger and outside the trigger guard until sights are on target and ready to shoot.
            </div>
            <div className="p-3 bg-elevated rounded-lg border border-border-subtle space-y-1">
              <strong className="text-text-primary block font-display">Rule 4: Know Your Target &amp; Beyond</strong>
              Ensure the target, backstop, and surrounding zone are clear before initiating any string of fire.
            </div>
          </div>

          <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
            <strong>Release and Indemnity:</strong> You voluntarily acknowledge that participation in target sports carries inherent risks. You agree to hold harmless and indemnify Marksman, its officers, developers, and partners from any claims, losses, or legal liabilities arising from your conduct, physical training, or range activities.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            3. Account Responsibilities &amp; Roles
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            You are responsible for maintaining the confidentiality of your credentials and all activity on your account:
          </p>
          <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm ml-2">
            <li><strong className="text-text-primary">Shooters:</strong> Responsible for accurate input of equipment details, ammunition ballistics, and respecting coach guidance.</li>
            <li><strong className="text-text-primary">Coaches:</strong> Must possess appropriate sports coaching credentials and must maintain the confidentiality of athlete biometric telemetry.</li>
            <li><strong className="text-text-primary">Range Operators:</strong> Solely responsible for range safety, physical line management, target backstops, and emergency preparedness.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            4. Software Subscriptions &amp; In-App Purchases
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            For subscriptions purchased through the Apple App Store, Google Play Store, or Web Billing:
          </p>
          <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm ml-2">
            <li><strong className="text-text-primary">Billing &amp; Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled at least 24 hours prior to the end of the current billing period.</li>
            <li><strong className="text-text-primary">App Store Terms:</strong> Subscriptions processed via Apple or Google are subject to Apple In-App Purchase and Google Play Billing terms and refund policies.</li>
            <li><strong className="text-text-primary">Cancellation:</strong> You can manage or cancel your subscription at any time via your device&apos;s Store account settings or web dashboard.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            5. Intellectual Property &amp; User Data
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            <strong>Your Data:</strong> You retain ownership of your shooting session logs, target images, and personal notes. You grant Marksman a non-exclusive, worldwide license to process, store, and analyze this data solely to provide analytics and coaching tools.
          </p>
          <p className="text-text-secondary leading-relaxed text-sm">
            <strong>Marksman Property:</strong> All algorithms, computer vision models, UI designs, codebases, logos, and ballistics computation engines are the exclusive intellectual property of Marksman.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            6. Prohibited Activities
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            When using the Marksman application, you agree NOT to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm ml-2">
            <li>Use the platform for any illegal weapon manufacturing, unlicensed trafficking, or unlawful firearms modification advice.</li>
            <li>Attempt to reverse engineer, scrape, decompile, or tamper with optical target detection models.</li>
            <li>Share login credentials or impersonate licensed coaches or federation officials.</li>
            <li>Upload malicious code, exploits, or spoof sensor telemetry.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            7. Account Termination &amp; Right to Delete
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            You may terminate your account at any time using our self-serve deletion tool in compliance with GDPR, DPDP Act, and App Store policies:
          </p>
          <div className="pt-1">
            <Link
              href="/delete-account"
              className="text-xs text-[#FF4D6D] hover:underline font-semibold"
            >
              Go to Account &amp; Data Deletion Page &rarr;
            </Link>
          </div>
          <p className="text-text-secondary text-xs sm:text-sm leading-relaxed mt-2">
            Marksman reserves the right to suspend or terminate accounts that violate range safety guidelines, engage in harassment, or breach these Terms.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            8. Limitation of Liability &amp; Disclaimers
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND. MARKSMAN EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND ACCURACY OF BALLISTICS PREDICTIONS UNDER VARIABLE ENVIRONMENTAL CONDITIONS. IN NO EVENT SHALL MARKSMAN BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            9. Governing Law &amp; Dispute Resolution
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm">
            These Terms shall be governed by and construed in accordance with the laws of India, subject to the jurisdiction of the courts of New Delhi, without regard to conflict of law principles. Any dispute arising out of or in connection with these Terms shall be resolved through good-faith mutual negotiations, followed by binding arbitration where applicable.
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-2xl text-text-primary border-b border-border-subtle/50 pb-2">
            10. Contact &amp; Legal Notices
          </h2>
          <div className="card p-5 bg-elevated border-border-subtle rounded-xl text-sm space-y-1">
            <p className="font-semibold text-text-primary">Legal &amp; Compliance Department</p>
            <p className="text-text-secondary">Marksman Precision Sports Technologies</p>
            <p className="text-text-secondary">Email: <a href="mailto:legal@marksman.app" className="text-accent hover:underline">legal@marksman.app</a></p>
            <p className="text-text-secondary">Support: <a href="mailto:support@marksman.app" className="text-accent hover:underline">support@marksman.app</a></p>
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

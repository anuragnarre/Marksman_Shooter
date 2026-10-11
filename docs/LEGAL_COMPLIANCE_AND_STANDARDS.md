# Marksman Ecosystem — Legal, Regulatory & Compliance Standards

> **Document ID:** DOC-LEG-2026-V1  
> **Classification:** Official Standard Operating & Compliance Guide  
> **Audience:** Range Operators, Chief Range Safety Officers (CRSOs), Range Legal Counsel, Software Administrators  
> **Effective Date:** October 2026  

---

## 1. Regulatory Framework & Standards Alignment

The Marksman Tactical Ecosystem is engineered to conform with national and international standards governing commercial, military, and law-enforcement shooting facilities:

1. **NRA Range Sourcebook (National Rifle Association):** Standards for range geometry, safety containment, bullet trap construction, baffle overlap, and line-of-fire enforcement.
2. **NSSF (National Shooting Sports Foundation) Five-Star Facility Guidelines:** Customer safety, lead hazard abatement, noise suppression, and physical security.
3. **ISSF (International Shooting Sport Federation) Technical Rules:** Target dimensions, decimal ring calculations, electronic target scoring (EST) tolerances, and finals match procedures.
4. **OSHA (Occupational Safety and Health Administration):** Worker safety for range safety officers, cleanup crews, and armory technicians.

---

## 2. Occupational Safety & Environmental Health Regulations

### 2.1 Lead Management & Airborne Contaminants (OSHA 29 CFR 1910.1025)
Indoor and outdoor shooting ranges present significant occupational lead hazards from primer ignition, bullet friction, and lead projectile fragmentation.

* **Airflow Velocity & Ventilation Requirements:**
  - Indoor ranges utilizing the Marksman platform must maintain a **downrange laminar airflow velocity between 50 and 75 feet per minute (fpm)** at the firing line.
  - Ventilation systems must operate under **negative pressure relative to the staging lobby** to prevent lead aerosol backflow into public areas.
  - Air exhaust must pass through **HEPA filtration systems (99.97% efficiency at 0.3 microns)** prior to atmospheric discharge.
* **Environmental Sensor Integration:**
  - Where Marksman environmental sensors are deployed, differential air pressure and ambient temperature/humidity are logged directly into the Range Operations database.
* **Personal Protective Equipment (PPE) & Hygiene Mandates:**
  - Range personnel conducting bullet trap maintenance or brass sweeping must wear **NIOSH-approved N100 or HEPA half-mask respirators**, disposable nitrile gloves, and designated range overalls.
  - Mandatory use of **lead-decontaminating wipes/soap (D-Lead or equivalent)** prior to eating, drinking, or exiting the facility.
  - Prohibit eating, drinking, smoking, and vaping forward of the staging area or on the active firing line at all times.

### 2.2 Occupational Noise Exposure & Hearing Conservation (OSHA 29 CFR 1910.95)
* **Permissible Noise Exposure:**
  - OSHA limits peak impulsive firearm noise exposure to **140 dB peak sound pressure level (SPL)**.
  - All personnel and shooters must wear hearing protection with a minimum **Noise Reduction Rating (NRR) of 28 dB**.
  - On high-caliber or indoor rifle lanes, **dual hearing protection (earplugs NRR 25+ combined with over-ear earmuffs NRR 28+)** is legally mandatory for staff and highly advised for athletes.

### 2.3 EPA Lead Management for Outdoor Ranges (EPA-902-B-01-001)
* **Lead Recovery & Reclamation Cycles:**
  - Outdoor earthen berms and granular rubber traps must undergo periodic lead reclamation according to shot volume tracked by the Marksman Session telemetry.
  - Soil pH on backstops must be maintained between **6.5 and 8.5** through agricultural lime application to minimize lead mobility and groundwater leaching.

---

## 3. Armory, Firearms & Ammunition Compliance

### 3.1 ATF Compliance & Rental Armory Recordkeeping (27 CFR Part 478)
For facilities operating commercial firearm rentals, testing benches, or gunsmithing services:

* **Acquisition & Disposition (A&D) Records:**
  - All range rental weapons registered in the **Marksman Equipment Module** (`Equipment` model) must record exact manufacturer, model, serial number, caliber/gauge, and date acquired.
  - Temporary custody handoffs to shooters require verified physical government photo ID, matching the user record in the database.
* **Prohibited Persons Screen:**
  - No firearm or ammunition shall be issued to any individual who fails physical ID verification, exhibits signs of intoxication, or is legally prohibited under federal or state law.
* **Weapon Service & Armory Logs (`WeaponServiceLog`):**
  - Armory technicians must log round counts (automatically incremented via Marksman Session shot records), trigger pull calibrations, barrel wear inspections, and safety selector checks.
  - Weapons with round counts exceeding manufacturer threshold service intervals must be flagged as `OUT_OF_SERVICE` in the Marksman console.

### 3.2 Ammunition Lot Tracking & Safety (`AmmoLot`)
* Handloaded or custom-developed ammunition used in range drills must record powder charge, bullet weight, primer manufacturer, and lot batch number.
* Damaged or surplus ammunition lots must be isolated in a designated explosive safety locker adhering to local fire marshal explosive storage limits.

---

## 4. Data Privacy, Biometrics & Video Surveillance Legalities

### 4.1 Downrange Optical Sensor & Target Camera Privacy (GDPR / CCPA)
The Marksman Target Camera App utilizes high-resolution edge cameras pointed downrange at the target line.

* **Target-Only Field of View Enforcement:**
  - Cameras must be calibrated and angled exclusively toward the target backer and target face.
  - **No facial recognition, biometric identity scanning, or human surveillance** is performed by the Target Camera engine. The computer vision model processes exclusively bullet perforation geometry, target ring boundaries, and optic contrast.
* **Shooter Biometric Data Protection:**
  - When athletes connect wearable biometrics (e.g., Apple Health, Garmin heart rate monitors) for performance stress analytics, data is encrypted via **AES-256 at rest** and **TLS 1.3 in transit**.
  - Biometric telemetry is classified as sensitive personal health data under GDPR Article 9; users may revoke consent or trigger a complete erasure via the `/delete-account` workflow.

### 4.2 Immutable Audit Trail & Legal Admissibility (`AuditLog`)
* All critical safety operations—including Emergency Cease-Fire triggers, RSO lane overrides, incident report creations, and turnstile bypasses—are recorded into the immutable `AuditLog` database model with actor user ID, client IP address, and microsecond UTC timestamp.
* These logs are tamper-evident and formatted for evidentiary admissibility in civil liability or regulatory inquiries.

---

## 5. Liability Waivers, Digital Consent & Range Rules

### 5.1 Mandatory Range Liability & Hold Harmless Agreement
Prior to gate access or booking confirmation, every shooter must execute the digital Marksman Form 101:

1. **Assumption of Inherent Risk:** Acknowledgment that firearms sports carry inherent risks of severe bodily injury, acoustic trauma, lead exposure, or death.
2. **Release of Liability & Hold Harmless:** Unconditional waiver of claims against facility operators, Range Safety Officers, software providers, and coaches resulting from participant negligence or ordinary equipment failure.
3. **Safety Briefing Certification:** Affirmation that the participant has reviewed and understands the Range Safety Standard Operating Procedures (SOPs).
4. **Minor Participant Co-Signature:** Participants under 18 years of age must have an executed parental/legal guardian consent form on file and remain under direct, arm's-length supervision by an adult at all times.

### 5.2 Digital Pass & Gate Check-in Synchronization
* The Marksman Turnstile Gate Access Validator (`GET /memberships/ranges/:id/validate-access`) automatically verifies:
  - Active signed waiver on record (annual re-certification requirement).
  - Unpaid safety violations or suspensions.
  - Valid booking slot or active membership tier.
  - Green status allows physical barrier release; any safety hold immediately sounds a soft operator alert and retains the barrier closed.

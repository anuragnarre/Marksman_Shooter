# Marksman Ecosystem — Range Operator & RSO Standard Operating Procedures (SOP) Manual

> **Document ID:** SOP-RSO-2026-V1  
> **Classification:** Official Operational Manual & Training Curriculum  
> **Target Audience:** Range Operators, Chief Range Safety Officers (CRSOs), Range Safety Officers (RSOs), Facility Technicians  
> **Effective Date:** October 2026  

---

## 1. Operational Hierarchy & Responsibilities

```
                      ┌────────────────────────────┐
                      │    Range Owner / Operator  │
                      │  (Facility Admin & Policy) │
                      └─────────────┬──────────────┘
                                    │
                      ┌─────────────▼──────────────┐
                      │ Chief Range Safety Officer │
                      │  (CRSO - Safety Oversight) │
                      └───────┬────────────┬───────┘
                              │            │
            ┌─────────────────▼──┐      ┌──▼────────────────┐
            │ Range Safety Off.  │      │ Armory Technician │
            │ (RSO - Firing Line)│      │  (Weapons & Ammo) │
            └────────────────────┘      └───────────────────┘
```

1. **Range Operator:** Directs commercial bookings, membership subscriptions, financial operations, facility maintenance, and compliance audits.
2. **Chief Range Safety Officer (CRSO):** Formulates local safety directives, leads RSO training, audits incident logs, and maintains medical supplies.
3. **Range Safety Officer (RSO):** Exercises absolute, immediate command over the firing line, enforces safety protocols, controls lane turnstiles, and issues emergency cease-fires.
4. **Armory Technician:** Manages serialized weapons custody, ammunition lots, weapon servicing intervals, and lead recovery traps.

---

## 2. Daily Operational Checklists

### 2.1 Phase 1 — Pre-Opening Facility Inspection (T-minus 60 Minutes)
Before any shooter enters the facility:

- [ ] **Structural & Backstop Check:** Inspect downrange bullet traps, steel deflectors, and overhead baffles for spalling, fatigue, or lead buildup.
- [ ] **Ventilation Verification:** Turn on ventilation exhaust system. Confirm negative room pressure and verify downrange laminar velocity measures 50–75 fpm using an anemometer.
- [ ] **Target Carriers & Lighting:** Test electronic target carriers, downrange LED floodlights (ensure 1000+ lux target illumination, zero strobe effect).
- [ ] **Hardware Target Cameras:** Verify edge camera Android devices are mounted, optics clean, battery/power connected, and streaming frames to the Marksman Vision Engine (`/shots/live-frame`).
- [ ] **Emergency Cease-Fire System:** Test both physical big-red emergency buttons and the Marksman Software Console Cease-Fire trigger (`POST /gateway/ceasefire`). Confirm all lane red strobe indicators illuminate immediately.
- [ ] **Trauma & First Aid Station:** Verify the presence and unbroken tamper seal of the **IFAK / Bleeding Control Kit** (SOF-T/CAT Tourniquets, Hemostatic gauze, Chest seals, trauma shears). Check first aid inventory in Marksman console (`GET /safety/ranges/:id/first-aid-kits`).

### 2.2 Phase 2 — Active Range Firing Operations
- [ ] **Shooter In-Processing:** Ensure every shooter has an active digital waiver on file, valid photo identification, and a confirmed lane booking slot or active membership subscription.
- [ ] **Safety Briefing Verification:** First-time shooters must complete the 5-minute safety quiz (`/safety/ranges/:rangeId/quizzes`) and score 100% prior to lane assignment.
- [ ] **Eye & Ear Protection Check:** Confirm all individuals on the line have eye protection (ANSI Z87.1) and ear protection (NRR 28+).
- [ ] **RSO Line Supervision:** The RSO must maintain continuous visual coverage of the firing line. The RSO must never handle firearms while supervising active shooters.

### 2.3 Phase 3 — Post-Closing Decontamination & Armory Reconciliation
- [ ] **Muzzle Down & Clean Line:** Verify all lanes are clear of ammunition and firearms are locked in bags or cases prior to shooters stepping off the firing point.
- [ ] **Spent Brass Collection:** Sweep brass using non-sparking broom and squeegees. Prohibit dry sweeping in a manner that kicks up airborne lead particulate; use HEPA vacuuming.
- [ ] **Personal Decontamination:** All staff must wash hands, arms, and face using D-Lead soap. Staff changing shoes must place range footwear in designated lockers.
- [ ] **Software Day-End Reconciliation:** Run the Marksman Day-End Audit Report (`GET /range-operations/:rangeId/dashboard-stats`) to balance lane hours, rental firearm returns, and ammo lot usage.

---

## 3. Universal Firing Line Commands & Procedures

Commands must be delivered in a clear, assertive, loud voice with zero ambiguity:

| Verbal Command | Action Required by Shooters & Staff |
| :--- | :--- |
| **"THE RANGE IS ACTIVE. YOU MAY COMMENCE FIRING."** | Shooters may load magazines, chamber rounds, and engage authorized targets downrange. |
| **"CEASE FIRING! CEASE FIRING! CEASE FIRING!"** | **IMMEDIATE, NON-NEGOTIABLE ACTION:** All shooters instantly take fingers off triggers, stop shooting, keep muzzle pointed directly downrange, safe the weapon, bench the firearm, step 2 paces back from the firing line behind the yellow safety stripe. |
| **"UNLOAD AND SHOW CLEAR."** | Remove magazine, lock slide/bolt to the rear, verify chamber is empty visually and physically. Wait for RSO inspection. |
| **"THE RANGE IS COLD. STEP BACK FROM THE LINE."** | No handling of firearms or ammunition permitted. Target retrieval or maintenance forward of line may commence only if permitted by RSO. |

> [!IMPORTANT]
> **ANY INDIVIDUAL on the range—whether an RSO, staff member, shooter, or spectator—who observes an unsafe condition HAS THE AUTHORITY AND OBLIGATION to shout "CEASE FIRE!" immediately.**

---

## 4. Stoppage & Malfunction Handling Protocol

When a shooter experiences an unexpected stoppage, they must keep the muzzle pointed downrange, keep their finger off the trigger, and raise their off-hand to signal the RSO.

### 4.1 Hangfire (Delayed Ignition)
* **Symptom:** Hammer/striker falls on chambered round; primer clicks, but cartridge does not fire immediately.
* **Danger:** Primer or powder may smolder and detonate seconds later.
* **RSO Protocol:**
  1. Direct the shooter to maintain the muzzle strictly pointed downrange.
  2. Maintain position and **wait a minimum of 60 seconds** (30 seconds for modern rimfire, 60 seconds for centerfire).
  3. Carefully cycle action, eject cartridge directly onto bench or into a bucket of water/sand. Inspect primer strike indent.

### 4.2 Squib Load (Insufficient Powder / Stuck Projectile)
* **Symptom:** Subdued "pop" sound or puff of smoke with faint recoil.
* **Danger:** Projectile fails to exit barrel and lodges in the bore. Firing another round behind a squib will cause catastrophic barrel rupture and severe shrapnel injury.
* **RSO Protocol:**
  1. Immediately command: **"STOP FIRING!"**
  2. Remove magazine and clear chamber.
  3. Disassemble action / remove bolt, inspect bore with a bore light.
  4. If barrel is obstructed: Tag firearm `OUT_OF_SERVICE`. Use brass squib rod from the muzzle toward chamber to drive projectile out in the armory work room.

### 4.3 Double-Feed / Complex Malfunction
* **RSO Protocol:** Lock slide back, strip magazine forcefully, cycle slide 3 times to extract stuck round, visually inspect chamber with flashlight.

---

## 5. Emergency Medical & Trauma Incident Protocol

In the event of an accidental discharge causing a traumatic wound or severe bleeding, the RSO immediately initiates the **Marksman Trauma Action Plan**:

### 5.1 Immediate Line Actions
1. Shout: **"CEASE FIRE! EMERGENCY CEASE FIRE!"** Hit the Big Red Emergency Cease-Fire Button.
2. Direct all other shooters to bench weapons, step behind the safety line, and remain motionless.
3. Designate a specific staff member by name: *"John, call 911 immediately and bring the Trauma IFAK kit!"*

### 5.2 Medical Intervention (TCCC / MARCH Protocol)
* **Massive Hemorrhage (Priority #1):**
  - **Extremity Bleeding (Arms/Legs):** Apply a **Commercial Windlass Tourniquet (CAT / SOF-T)** 2–3 inches above the wound (high and tight if clothes obscure wound). Tighten windlass until arterial bleeding stops and distal pulse vanishes. Note time on tourniquet band.
  - **Junctional Bleeding (Groin/Neck/Axilla):** Pack wound firmly with **Hemostatic Gauze (QuikClot / Celox)**, hold direct mechanical pressure for 3 minutes minimum, apply pressure bandage.
* **Airway & Respiration:**
  - For penetrating chest/torso wounds, apply **Vented Chest Seals** to entry and exit wounds. Monitor for tension pneumothorax.

### 5.3 911 Dispatch Emergency Call Script
The designated staff member must state:
> *"This is [Facility Name] at [Physical Address]. We have an accidental gunshot wound to the [body location]. Active bleeding is controlled via tourniquet. The scene is secure, all firearms are made safe and grounded. Meet our staff guide at the North Entry Gate."*

### 5.4 Digital Incident Log Filing (`POST /safety/incidents`)
Within 2 hours of incident mitigation, the CRSO must file the formal incident report via the Marksman Console:
* Exact date, time, and lane number.
* Firearm make, model, caliber, and serial number.
* Ammunition brand and lot number.
* Comprehensive narrative, witness statements, and photos of equipment.

---

## 6. Software Console Operations Guide (Range Management App)

The Range Operator & RSO web application runs on **`http://localhost:3002`** (backed by API `:3003`).

### 6.1 Live Lane Monitoring & Control (`/range-operator/dashboard`)
* **Lane Status Indicators:**
  - 🟢 **Available:** Lane clean, calibrated, and ready for assignment.
  - 🔴 **Occupied / Hot:** Active session in progress; live shots streaming from camera.
  - 🟡 **Maintenance / RSO Hold:** Lane offline for target repair or baffle check.
* **Emergency Cease-Fire Software Relay:**
  - Located on the top navigation bar: **"BROADCAST CEASEFIRE"**.
  - Clicking this button immediately broadcasts a WebSocket event (`events.gateway.ts`) to all connected client screens and range kiosks, playing an audible siren and rendering full-screen red warning overlays.

### 6.2 Booking Check-In & Gate Turnstile Scanner (`/range-operator/bookings`)
* When an athlete presents their digital membership or booking QR code:
  1. Open the **RSO Gate Check-in Modal**.
  2. Scan athlete QR code or search by email/name.
  3. System validates waiver signature date, active subscription, and assigned lane slot.
  4. Click **"Check-In & Release Turnstile"** to grant physical barrier entry.

### 6.3 Environmental Telemetry & Wind Correlation (`/range-operator/dashboard`)
* Live wind speed, direction, ambient temperature, and barometric pressure are gathered automatically via OpenMeteo APIs.
* Use the **Wind-Score Correlation Heatmap** to calibrate downrange ballistic compensation advisories for long-range athletes.

---

## 7. Operator & RSO 100-Point Certification Rubric

To be certified as an authorized Marksman Range Safety Officer, candidates must complete 16 hours of classroom and range instruction, scoring 90%+ across four operational domains:

1. **Safety Standards & Regulations (25 pts):** OSHA lead rules, NRR acoustic mandates, ATF rental recordkeeping.
2. **Firing Line Command & Control (25 pts):** Verbal assertiveness, standard commands, cease-fire execution, stance and positioning.
3. **Malfunction & Weapon Clearance (25 pts):** Safe clearance of squib loads, hangfires, double-feeds, and stovepipes under time pressure.
4. **Emergency Medical & Console Mastery (25 pts):** Tourniquet application in <30 seconds, 911 dispatch communication, and Marksman Console operation.

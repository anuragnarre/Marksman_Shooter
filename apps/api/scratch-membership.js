const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
if (!schema.includes('model MembershipSubscription {')) {
  schema += `\n\nmodel MembershipSubscription {
  id                   String         @id @default(uuid())
  userId               String
  user                 User           @relation(fields: [userId], references: [id])
  tierId               String
  tier                 MembershipTier @relation(fields: [tierId], references: [id])
  rangeId              String
  range                ShootingRange  @relation(fields: [rangeId], references: [id])
  status               String         @default("ACTIVE") // ACTIVE, GRACE, SUSPENDED, CANCELLED, EXPIRED
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  stripeSubscriptionId String?
  autoRenew            Boolean        @default(true)
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt
}`;
  schema = schema.replace('model MembershipTier {', 'model MembershipTier {\n  subscriptions MembershipSubscription[]');
  schema = schema.replace('model User {\n  bookings         Booking[]', 'model User {\n  bookings         Booking[]\n  subscriptions    MembershipSubscription[]');
  schema = schema.replace('model ShootingRange {', 'model ShootingRange {\n  subscriptions MembershipSubscription[]');
  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log('MembershipSubscription model added');
}

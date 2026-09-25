const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
if (!schema.includes('model Booking {')) {
  schema += `\n\nmodel Booking {
  id               String    @id @default(uuid())
  userId           String
  user             User      @relation(fields: [userId], references: [id])
  laneId           String?
  lane             RangeLane? @relation(fields: [laneId], references: [id])
  slotId           String
  slot             TimeSlot  @relation(fields: [slotId], references: [id])
  numberOfShooters Int       @default(1)
  status           String    @default("PENDING") // PENDING, CONFIRMED, CANCELLED, NO_SHOW
  bookingReference String    @unique
  paymentId        String?
  checkInAt        DateTime?
  notes            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}`;
  schema = schema.replace('model TimeSlot {', 'model TimeSlot {\n  bookings  Booking[]');
  schema = schema.replace('model User {', 'model User {\n  bookings         Booking[]');
  schema = schema.replace('model RangeLane {', 'model RangeLane {\n  bookings               Booking[]');
  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log('Booking model added');
}

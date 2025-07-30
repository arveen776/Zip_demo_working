-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "email" TEXT;

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

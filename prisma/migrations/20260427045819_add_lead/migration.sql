-- CreateTable
CREATE TABLE "leads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "leadNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "contactTitle" TEXT,
    "source" TEXT NOT NULL DEFAULT 'OTHER',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignStatus" TEXT NOT NULL DEFAULT 'UNASSIGNED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "industry" TEXT,
    "region" TEXT,
    "budget" TEXT,
    "notes" TEXT,
    "assigneeId" INTEGER,
    "assignedAt" DATETIME,
    "protectExpiry" DATETIME,
    "invalidReason" TEXT,
    "convertedCustomerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leads_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_leadNo_key" ON "leads"("leadNo");

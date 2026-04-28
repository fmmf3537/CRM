-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SALES',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "alias" TEXT,
    "industry" TEXT NOT NULL,
    "scale" TEXT NOT NULL DEFAULT 'MEDIUM',
    "region" TEXT NOT NULL,
    "address" TEXT,
    "source" TEXT,
    "grade" TEXT NOT NULL DEFAULT 'C',
    "status" TEXT NOT NULL DEFAULT 'POTENTIAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastFollowUpAt" DATETIME,
    "ownerId" INTEGER NOT NULL,
    CONSTRAINT "customers_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "wechat" TEXT,
    "decisionRole" TEXT NOT NULL DEFAULT 'TECHNICAL_CONTACT',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "customerId" INTEGER NOT NULL,
    CONSTRAINT "contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "business_info" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requirements" TEXT,
    "interestedProducts" TEXT,
    "budget" TEXT,
    "purchaseTime" TEXT,
    "competitors" TEXT,
    "specialRequirements" TEXT,
    "customerId" INTEGER NOT NULL,
    CONSTRAINT "business_info_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "business_info_customerId_key" ON "business_info"("customerId");

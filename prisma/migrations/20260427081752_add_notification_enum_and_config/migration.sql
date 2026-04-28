-- CreateTable
CREATE TABLE "configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "updatedById" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "configs_key_key" ON "configs"("key");

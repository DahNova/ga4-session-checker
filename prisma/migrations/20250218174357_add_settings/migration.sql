-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "anomalyThreshold" INTEGER NOT NULL DEFAULT 50,
    "minSessions" INTEGER NOT NULL DEFAULT 100,
    "compareWithDays" INTEGER NOT NULL DEFAULT 7,
    "checkFrequency" TEXT NOT NULL DEFAULT 'daily',
    "customCron" TEXT,
    "checkTime" TEXT NOT NULL DEFAULT '00:00',
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emailAddresses" TEXT[],
    "slackWebhook" TEXT,
    "telegramChatId" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpFromEmail" TEXT,
    "smtpFromName" TEXT,
    "warningSeverity" INTEGER NOT NULL DEFAULT 30,
    "criticalSeverity" INTEGER NOT NULL DEFAULT 50,
    "defaultPageSize" INTEGER NOT NULL DEFAULT 25,
    "defaultSortField" TEXT NOT NULL DEFAULT 'name',
    "defaultSortOrder" TEXT NOT NULL DEFAULT 'asc',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

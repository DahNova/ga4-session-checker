-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "anomalyThreshold" SET DEFAULT 0.5,
ALTER COLUMN "anomalyThreshold" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "emailAddresses" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "warningSeverity" SET DEFAULT 0.3,
ALTER COLUMN "warningSeverity" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "criticalSeverity" SET DEFAULT 0.5,
ALTER COLUMN "criticalSeverity" SET DATA TYPE DOUBLE PRECISION;

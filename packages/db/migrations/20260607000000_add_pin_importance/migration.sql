CREATE TYPE "PinImportance" AS ENUM ('MAJOR', 'MEDIUM', 'MINOR');
ALTER TABLE "places" ADD COLUMN "pin_importance" "PinImportance" NOT NULL DEFAULT 'MAJOR';

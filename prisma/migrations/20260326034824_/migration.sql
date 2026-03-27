/*
  Warnings:

  - The values [ADMIN,MEMBER] on the enum `GroupRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `category` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `paid_by_id` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `expense_splits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_members` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[import_hash]` on the table `expenses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `expenses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `group_id` on table `expenses` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum (nuevos, sin conflicto)
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'CLASSIFIED', 'ASSIGNED', 'VOIDED', 'IMPORTED');
CREATE TYPE "ExpenseSource" AS ENUM ('CARD', 'CASH', 'TRANSFER', 'DIGITAL_WALLET');
CREATE TYPE "AccountType" AS ENUM ('CREDIT_CARD', 'DEBIT', 'CASH', 'TRANSFER', 'DIGITAL_WALLET', 'SHARED');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'REGISTER', 'IMPORT', 'EXPORT');

-- AlterEnum: primero crear el nuevo tipo ANTES de usarlo
CREATE TYPE "GroupRole_new" AS ENUM ('GROUP_ADMIN', 'GROUP_MEMBER', 'GROUP_VIEWER');

-- DropForeignKey de tablas que vamos a eliminar
ALTER TABLE "expense_splits" DROP CONSTRAINT "expense_splits_expense_id_fkey";
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_paid_by_id_fkey";
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_group_id_fkey";
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_user_id_fkey";
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_group_id_fkey";

-- DropTable primero (antes de alterar el enum que las referencia)
DROP TABLE "expense_splits";
DROP TABLE "group_members";



-- Finalizar el cambio del enum GroupRole
ALTER TYPE "GroupRole" RENAME TO "GroupRole_old";
ALTER TYPE "GroupRole_new" RENAME TO "GroupRole";
DROP TYPE "GroupRole_old";

-- AlterTable expenses: columnas NOT NULL con DEFAULT temporal
ALTER TABLE "expenses"
  DROP COLUMN "category",
  DROP COLUMN "paid_by_id",
  DROP COLUMN "title",
  ADD COLUMN "account_id"   TEXT,
  ADD COLUMN "category_id"  TEXT,
  ADD COLUMN "import_hash"  TEXT,
  ADD COLUMN "import_id"    TEXT,
  ADD COLUMN "source"       "ExpenseSource" NOT NULL DEFAULT 'CARD',
  ADD COLUMN "status"       "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
  -- Columnas NOT NULL con DEFAULT temporal para filas existentes
  ADD COLUMN "date"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  ADD COLUMN "month"  CHAR(2)      NOT NULL DEFAULT TO_CHAR(NOW(), 'MM'),
  ADD COLUMN "year"   CHAR(4)      NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY');


-- DropEnum viejo (ahora que las tablas que lo usaban ya no existen)
DROP TYPE "ExpenseCategory";

-- Limpiar NULLs antes de hacer columnas required
UPDATE "expenses" SET "description" = 'Sin descripción' WHERE "description" IS NULL;
UPDATE "expenses" SET "group_id" = (SELECT id FROM "groups" LIMIT 1) WHERE "group_id" IS NULL;

ALTER TABLE "expenses"
  ALTER COLUMN "description" SET NOT NULL,
  ALTER COLUMN "group_id"    SET NOT NULL;

-- Quitar los defaults temporales (opcionales, para forzar valores explícitos en el futuro)
ALTER TABLE "expenses" ALTER COLUMN "date"  DROP DEFAULT;
ALTER TABLE "expenses" ALTER COLUMN "month" DROP DEFAULT;
ALTER TABLE "expenses" ALTER COLUMN "year"  DROP DEFAULT;

-- AlterTable groups
ALTER TABLE "groups"
  ADD COLUMN "active"    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "currency"  TEXT    NOT NULL DEFAULT 'USD';

-- AlterTable users: password_hash con DEFAULT temporal
ALTER TABLE "users"
  DROP COLUMN "password",
  ADD COLUMN "active"         BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "password_hash"  TEXT    NOT NULL DEFAULT 'PENDING_RESET';

ALTER TABLE "users" ALTER COLUMN "password_hash" DROP DEFAULT;

-- CreateTable group_memberships
CREATE TABLE "group_memberships" (
  "id"        TEXT      NOT NULL,
  "user_id"   TEXT      NOT NULL,
  "group_id"  TEXT      NOT NULL,
  "role"      "GroupRole" NOT NULL DEFAULT 'GROUP_MEMBER',
  "active"    BOOLEAN   NOT NULL DEFAULT true,
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "group_memberships_pkey" PRIMARY KEY ("id")
);

-- (resto de CREATE TABLEs sin cambios)
CREATE TABLE "members" (
  "id"         TEXT    NOT NULL,
  "group_id"   TEXT    NOT NULL,
  "user_id"    TEXT,
  "name"       TEXT    NOT NULL,
  "color"      TEXT    NOT NULL DEFAULT '#6366f1',
  "active"     BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accounts" (
  "id"         TEXT         NOT NULL,
  "group_id"   TEXT         NOT NULL,
  "name"       TEXT         NOT NULL,
  "holder"     TEXT,
  "type"       "AccountType" NOT NULL DEFAULT 'CREDIT_CARD',
  "currency"   TEXT         NOT NULL DEFAULT 'USD',
  "active"     BOOLEAN      NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assignments" (
  "id"         TEXT           NOT NULL,
  "expense_id" TEXT           NOT NULL,
  "member_id"  TEXT           NOT NULL,
  "percentage" DECIMAL(5,2)   NOT NULL,
  CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
  "id"        TEXT    NOT NULL,
  "group_id"  TEXT,
  "parent_id" TEXT,
  "name"      TEXT    NOT NULL,
  "icon"      TEXT    NOT NULL DEFAULT '📦',
  "active"    BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
  "id"        TEXT           NOT NULL,
  "group_id"  TEXT           NOT NULL,
  "member_id" TEXT           NOT NULL,
  "month"     CHAR(2)        NOT NULL,
  "year"      CHAR(4)        NOT NULL,
  "amount"    DECIMAL(12,2)  NOT NULL,
  "note"      TEXT,
  "paid_at"   TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "imports" (
  "id"              TEXT    NOT NULL,
  "group_id"        TEXT    NOT NULL,
  "raw_text"        TEXT    NOT NULL,
  "total_parsed"    INTEGER NOT NULL DEFAULT 0,
  "total_inserted"  INTEGER NOT NULL DEFAULT 0,
  "total_skipped"   INTEGER NOT NULL DEFAULT 0,
  "total_errors"    INTEGER NOT NULL DEFAULT 0,
  "status"          TEXT    NOT NULL DEFAULT 'COMPLETED',
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "imports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exports" (
  "id"         TEXT    NOT NULL,
  "group_id"   TEXT    NOT NULL,
  "filters"    JSONB   NOT NULL,
  "file_size"  INTEGER,
  "status"     TEXT    NOT NULL DEFAULT 'COMPLETED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id"          TEXT         NOT NULL,
  "user_id"     TEXT,
  "action"      "AuditAction" NOT NULL,
  "entity_type" TEXT         NOT NULL,
  "entity_id"   TEXT         NOT NULL,
  "before"      JSONB,
  "after"       JSONB,
  "ip_address"  TEXT,
  "user_agent"  TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
  "id"         TEXT         NOT NULL,
  "user_id"    TEXT         NOT NULL,
  "token_hash" TEXT         NOT NULL,
  "revoked"    BOOLEAN      NOT NULL DEFAULT false,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "settings" (
  "key"   TEXT NOT NULL,
  "value" TEXT NOT NULL,
  CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_memberships_user_id_group_id_key" ON "group_memberships"("user_id", "group_id");
CREATE UNIQUE INDEX "members_group_id_name_key" ON "members"("group_id", "name");
CREATE UNIQUE INDEX "accounts_group_id_name_key" ON "accounts"("group_id", "name");
CREATE INDEX "assignments_expense_id_idx" ON "assignments"("expense_id");
CREATE INDEX "assignments_member_id_idx" ON "assignments"("member_id");
CREATE UNIQUE INDEX "assignments_expense_id_member_id_key" ON "assignments"("expense_id", "member_id");
CREATE UNIQUE INDEX "categories_group_id_name_key" ON "categories"("group_id", "name");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE UNIQUE INDEX "expenses_import_hash_key" ON "expenses"("import_hash");
CREATE INDEX "expenses_group_id_date_idx" ON "expenses"("group_id", "date");
CREATE INDEX "expenses_account_id_idx" ON "expenses"("account_id");
CREATE INDEX "expenses_import_hash_idx" ON "expenses"("import_hash");

-- AddForeignKey
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "members" ADD CONSTRAINT "members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "imports" ADD CONSTRAINT "imports_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exports" ADD CONSTRAINT "exports_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

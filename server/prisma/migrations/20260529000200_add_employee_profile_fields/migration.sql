ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "date_of_birth" TIMESTAMP(3);
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "place" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "educational_qualification" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "government_id_front" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "government_id_back" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "blood_group" TEXT;

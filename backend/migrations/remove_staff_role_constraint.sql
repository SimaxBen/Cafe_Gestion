'-- Remove CHECK constraint on staff.role to allow custom roles
-- This allows flexibility for cafes to define their own staff roles

-- Drop the existing CHECK constraint
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;

-- The role column will now accept any text value
-- Predefined roles (barista, server, cleaner) are suggested in the frontend
-- but custom roles are fully supported

-- Drop all existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS guest_reservations CASCADE;
DROP TABLE IF EXISTS customer_reservations CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS email_notifications CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS restaurant_menu_item CASCADE;
DROP TABLE IF EXISTS restaurant_schedule CASCADE;
DROP TABLE IF EXISTS restaurant_details CASCADE;
DROP TABLE IF EXISTS admin_account_details CASCADE;
DROP TABLE IF EXISTS customer_account_details CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS update_customer_reserved_tables ON customer_reservations CASCADE;
DROP TRIGGER IF EXISTS update_guest_reserved_tables ON guest_reservations CASCADE;
DROP TRIGGER IF EXISTS set_customer_display_id ON customer_reservations CASCADE;
DROP TRIGGER IF EXISTS set_guest_display_id ON guest_reservations CASCADE;
DROP FUNCTION IF EXISTS update_timeslot_reserved_tables() CASCADE;
DROP FUNCTION IF EXISTS generate_reservation_display_id() CASCADE;

-- Drop types/enums
DROP TYPE IF EXISTS reservation_status CASCADE;
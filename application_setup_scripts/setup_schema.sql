-- 1. Create an ENUM type for reservation status (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
        CREATE TYPE reservation_status AS ENUM ('upcoming', 'no_show', 'attended', 'cancelled');
    END IF;
END
$$;


-- 2. Restaurant Menu Item table.
CREATE TABLE IF NOT EXISTS restaurant_menu_item (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    dish_name VARCHAR(255) NOT NULL UNIQUE,
    dish_description TEXT,
    dish_tags TEXT[],  -- Storing tags as a PostgreSQL text array.
    price DECIMAL(10, 2) NOT NULL,  -- Added price field which was missing
    active BOOLEAN DEFAULT TRUE  -- To easily remove items from menu without deleting
);

-- 3. Admin Account Details table.
CREATE TABLE IF NOT EXISTS admin_account_details (
    id SERIAL PRIMARY KEY,
    email_address VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50) NOT NULL, 
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Store encrypted password.
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- 4. Customer Account Details table.
CREATE TABLE IF NOT EXISTS customer_account_details (
    id SERIAL PRIMARY KEY,
    email_address VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50) NOT NULL, 
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Store encrypted password.
    dietary_requirements TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- 5. Table for available time slots per day.
CREATE TABLE IF NOT EXISTS time_slots (
    id SERIAL PRIMARY KEY,
    reservation_date DATE NOT NULL,
    slot_start TIME NOT NULL,
    slot_end TIME NOT NULL,
    max_tables INTEGER NOT NULL,  -- Added max tables capacity
    reserved_tables INTEGER NOT NULL DEFAULT 0,  -- Current count of reserved tables
    CONSTRAINT unique_slot UNIQUE (reservation_date, slot_start),
    CONSTRAINT valid_reserved_tables CHECK (reserved_tables <= max_tables)
);

-- 6. Customer Reservations table.
CREATE TABLE IF NOT EXISTS customer_reservations (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customer_account_details(id) ON DELETE CASCADE,
    time_slot_id INTEGER NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
    number_of_guests INTEGER NOT NULL CHECK (number_of_guests > 0),
    number_of_tables INTEGER NOT NULL CHECK (number_of_tables > 0),
    display_id VARCHAR(20) UNIQUE,
    comments_for_admin TEXT,
    status reservation_status NOT NULL DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Guest Reservations table.
CREATE TABLE IF NOT EXISTS guest_reservations (
    id SERIAL PRIMARY KEY,
    guest_first_name VARCHAR(100) NOT NULL,
    guest_last_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) NOT NULL,
    time_slot_id INTEGER NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
    number_of_guests INTEGER NOT NULL CHECK (number_of_guests > 0),
    number_of_tables INTEGER NOT NULL CHECK (number_of_tables > 0),
    display_id VARCHAR(20) UNIQUE,
    comments_for_admin TEXT,
    status reservation_status NOT NULL DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- 9. Email Log Table
CREATE TABLE IF NOT EXISTS email_notifications (
    id SERIAL PRIMARY KEY,
    email_address VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'sent'  -- For tracking delivery status
);

-- 10. Restaurant Details Table
CREATE TABLE IF NOT EXISTS restaurant_details (
    id SERIAL PRIMARY KEY,
    restaurant_email_address VARCHAR(255) NOT NULL UNIQUE,
    restaurant_phone_number VARCHAR(50) NOT NULL, 
    restaurant_name VARCHAR(100) NOT NULL,
    restaurant_address VARCHAR(255) NOT NULL,
    restaurant_description TEXT,
    restaurant_seating_capacity INTEGER NOT NULL CHECK (restaurant_seating_capacity > 0),
    tables_count INTEGER NOT NULL CHECK (tables_count > 0),
    logo_url VARCHAR(255),
    website_url VARCHAR(255),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. Restaurant Weekly Schedule 
CREATE TABLE IF NOT EXISTS restaurant_schedule (
    id SERIAL PRIMARY KEY,
    day_of_the_week INTEGER NOT NULL CHECK (day_of_the_week BETWEEN 0 AND 6),
    time_open TIME NOT NULL, 
    time_closed TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    CONSTRAINT valid_hours CHECK (time_closed > time_open)
);

-- Function to update time_slots.reserved_tables when reservation status changes
CREATE OR REPLACE FUNCTION update_timeslot_reserved_tables()
RETURNS TRIGGER AS $$
BEGIN
    -- For new reservations
    IF (TG_OP = 'INSERT' AND NEW.status = 'upcoming') THEN
        UPDATE time_slots
        SET reserved_tables = reserved_tables + NEW.number_of_tables
        WHERE id = NEW.time_slot_id;
    
    -- For status changes
    ELSIF (TG_OP = 'UPDATE') THEN
        -- When a reservation is cancelled (status changes from upcoming to cancelled)
        IF (OLD.status = 'upcoming' AND NEW.status = 'cancelled') THEN
            UPDATE time_slots
            SET reserved_tables = reserved_tables - OLD.number_of_tables
            WHERE id = NEW.time_slot_id;
        
        -- When a reservation is reinstated (status changes from cancelled to upcoming)
        ELSIF (OLD.status = 'cancelled' AND NEW.status = 'upcoming') THEN
            UPDATE time_slots
            SET reserved_tables = reserved_tables + NEW.number_of_tables
            WHERE id = NEW.time_slot_id;
        
        -- When the number of tables changes for an upcoming reservation
        ELSIF (OLD.status = 'upcoming' AND NEW.status = 'upcoming' AND OLD.number_of_tables != NEW.number_of_tables) THEN
            UPDATE time_slots
            SET reserved_tables = reserved_tables - OLD.number_of_tables + NEW.number_of_tables
            WHERE id = NEW.time_slot_id;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for customer reservations
CREATE TRIGGER update_customer_reserved_tables
AFTER INSERT OR UPDATE ON customer_reservations
FOR EACH ROW EXECUTE FUNCTION update_timeslot_reserved_tables();

-- Trigger for guest reservations
CREATE TRIGGER update_guest_reserved_tables
AFTER INSERT OR UPDATE ON guest_reservations
FOR EACH ROW EXECUTE FUNCTION update_timeslot_reserved_tables();


-- Create a function to generate the display IDs
CREATE OR REPLACE FUNCTION generate_reservation_display_id()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'customer_reservations' THEN
        NEW.display_id := 'C-' || NEW.id;
    ELSIF TG_TABLE_NAME = 'guest_reservations' THEN
        NEW.display_id := 'G-' || NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create triggers to automatically generate display_ids for new reservations
CREATE TRIGGER set_customer_display_id
BEFORE INSERT ON customer_reservations
FOR EACH ROW EXECUTE FUNCTION generate_reservation_display_id();

CREATE TRIGGER set_guest_display_id
BEFORE INSERT ON guest_reservations
FOR EACH ROW EXECUTE FUNCTION generate_reservation_display_id();

-- 5. Create indexes on display_id for faster searches
CREATE INDEX idx_customer_reservations_display_id ON customer_reservations(display_id);
CREATE INDEX idx_guest_reservations_display_id ON guest_reservations(display_id);

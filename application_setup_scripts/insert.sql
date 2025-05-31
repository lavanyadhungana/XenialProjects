-- insert_data.sql
-- This script inserts sample data for Marco Italian Restaurant

-- 1. Insert restaurant_details
INSERT INTO restaurant_details (restaurant_email_address, restaurant_phone_number, restaurant_name, restaurant_address, restaurant_description, restaurant_seating_capacity, tables_count, logo_url, website_url) 
VALUES ('info@markoitalian.com', '+61-2-9876-5432', 'Marco Italian Restaurant', '123 Italian Lane, Sydney NSW 2000, Australia', 'Marco Italian Restaurant offers authentic Italian cuisine in a cozy atmosphere, featuring handmade pasta, wood-fired pizzas, and an extensive selection of Italian wines.', 30, 15, 'https://www.marcoitalian.com/logo.png', 'https://www.marcoitalian.com');

-- 2. Insert restaurant_schedule (7 days a week, 5pm to 10pm)
INSERT INTO restaurant_schedule (day_of_the_week, time_open, time_closed, is_closed) VALUES (0, '17:00', '22:00', false); -- Sunday
INSERT INTO restaurant_schedule (day_of_the_week, time_open, time_closed, is_closed) VALUES (1, '17:00', '22:00', false); -- Monday
INSERT INTO restaurant_schedule (day_of_the_week, time_open, time_closed, is_closed) VALUES (2, '17:00', '22:00', false); -- Tuesday
INSERT INTO restaurant_schedule (day_of_the_week, time_open, time_closed, is_closed) VALUES (3, '17:00', '22:00', false); -- Wednesday
INSERT INTO restaurant_schedule (day_of_the_week, time_open, time_closed, is_closed) VALUES (4, '17:00', '22:30', false); -- Thursday
INSERT INTO restaurant_schedule (day_of_the_week, time_open, time_closed, is_closed) VALUES (5, '17:00', '23:00', false); -- Friday
INSERT INTO restaurant_schedule (day_of_the_week, time_open, time_closed, is_closed) VALUES (6, '17:00', '23:00', false); -- Saturday

-- Note: Admin account will be created through API request instead of direct SQL insertion

-- Appetizers (includes starters, antipasti, salads)
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Appetizers', 'Bruschetta al Pomodoro', 'Toasted bread topped with fresh tomatoes, garlic, and basil', ARRAY['vegetarian', 'classic'], 12.50, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Appetizers', 'Calamari Fritti', 'Crispy fried calamari served with lemon and aioli', ARRAY['seafood', 'fried'], 16.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Appetizers', 'Burrata con Prosciutto', 'Creamy burrata cheese with thinly sliced prosciutto di Parma', ARRAY['cheese', 'meat'], 18.50, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Appetizers', 'Arancini Siciliani', 'Sicilian rice balls filled with mozzarella and peas', ARRAY['vegetarian', 'fried'], 14.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Appetizers', 'Insalata Caprese', 'Fresh buffalo mozzarella, tomatoes, and basil', ARRAY['vegetarian', 'gluten-free', 'salad'], 15.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Appetizers', 'Insalata di Rucola', 'Arugula salad with shaved parmesan and balsamic vinaigrette', ARRAY['vegetarian', 'gluten-free', 'salad'], 14.50, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Appetizers', 'Patate al Rosmarino', 'Rosemary roasted potatoes', ARRAY['vegetarian', 'gluten-free', 'side'], 8.50, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Appetizers', 'Verdure Grigliate', 'Grilled seasonal vegetables with extra virgin olive oil', ARRAY['vegetarian', 'vegan', 'gluten-free', 'side'], 9.90, true);

-- Main Courses (includes pasta, pizza, seafood, meat dishes)
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Spaghetti alla Carbonara', 'Classic carbonara with pancetta, egg, pecorino, and black pepper', ARRAY['classic', 'egg', 'pasta'], 22.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Linguine alle Vongole', 'Linguine pasta with clams, white wine, and garlic', ARRAY['seafood', 'white wine', 'pasta'], 25.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Pappardelle al Ragù', 'Wide ribbon pasta with slow-cooked beef ragù', ARRAY['beef', 'classic', 'pasta'], 23.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Ravioli di Ricotta e Spinaci', 'Handmade ravioli filled with ricotta and spinach in sage butter', ARRAY['vegetarian', 'handmade', 'pasta'], 24.50, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Gnocchi al Gorgonzola', 'Potato gnocchi in creamy gorgonzola sauce', ARRAY['vegetarian', 'cheese', 'pasta'], 22.50, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Margherita', 'San Marzano tomatoes, fior di latte mozzarella, basil, olive oil', ARRAY['vegetarian', 'classic', 'pizza'], 19.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Diavola', 'Spicy salami, San Marzano tomatoes, mozzarella', ARRAY['spicy', 'meat', 'pizza'], 22.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Quattro Formaggi', 'Four cheese pizza with mozzarella, gorgonzola, parmesan, and fontina', ARRAY['vegetarian', 'cheese', 'pizza'], 23.50, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Prosciutto e Funghi', 'Ham, mushrooms, mozzarella, and tomato sauce', ARRAY['meat', 'mushroom', 'pizza'], 22.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Osso Buco alla Milanese', 'Braised veal shanks with gremolata and saffron risotto', ARRAY['meat', 'classic'], 32.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Branzino al Forno', 'Oven-baked sea bass with herbs, lemon, and roasted vegetables', ARRAY['seafood', 'gluten-free'], 34.50, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Main Courses', 'Pollo al Marsala', 'Chicken breast cooked in Marsala wine with mushrooms', ARRAY['poultry', 'wine'], 28.90, true);

-- Desserts
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Desserts', 'Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream', ARRAY['classic', 'coffee'], 12.50, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Desserts', 'Panna Cotta', 'Vanilla panna cotta with mixed berry compote', ARRAY['gluten-free', 'classic'], 11.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Desserts', 'Cannoli Siciliani', 'Crispy pastry shells filled with sweet ricotta cream and pistachios', ARRAY['nuts', 'classic'], 11.90, true);

-- Drinks
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Drinks', 'Acqua Minerale', 'Still or sparkling mineral water (750ml)', ARRAY['non-alcoholic'], 6.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Drinks', 'Espresso', 'Traditional Italian espresso', ARRAY['coffee', 'non-alcoholic'], 4.50, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Drinks', 'Vino Rosso della Casa', 'House red wine (glass)', ARRAY['wine', 'alcoholic'], 10.90, true);
INSERT INTO restaurant_menu_item (category, dish_name, dish_description, dish_tags, price, active) VALUES ('Drinks', 'Vino Bianco della Casa', 'House white wine (glass)', ARRAY['wine', 'alcoholic'], 10.90, true);
-- 4. Insert announcements (special events)
INSERT INTO announcements (title, description, start_date, end_date, is_active) VALUES ('Pasta Making Class', 'Join Chef Marco for a hands-on pasta making class. Learn to create traditional Italian pasta from scratch. $75 per person, includes dinner and a glass of wine.', '2025-05-15', '2025-05-15', true);
INSERT INTO announcements (title, description, start_date, end_date, is_active) VALUES ('Wine Tasting Evening', 'Experience a curated selection of premium Italian wines paired with regional appetizers. $60 per person.', '2025-05-22', '2025-05-22', true);
INSERT INTO announcements (title, description, start_date, end_date, is_active) VALUES ('Summer Menu Launch', 'We are excited to introduce our new summer menu featuring seasonal Italian specialties and fresh local produce.', '2025-06-01', '2025-08-31', true);
INSERT INTO announcements (title, description, start_date, end_date, is_active) VALUES ('Anniversary Celebration', 'Join us in celebrating 5 years of Marco Italian Restaurant! Special prix fixe menu available for $65 per person.', '2025-06-10', '2025-06-12', true);
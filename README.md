# Restaurant Application Installation Guide

## Prerequisites

- Ubuntu/Debian-based Linux system
- sudo privileges
- PostgreSQL 16
- Node.js LTS

## Installation Steps

### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Install PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql-16 postgresql-client-16
```

### 3. Set Up Database

Run these scripts in order:

```bash
./application_setup_scripts/SetUpDatabase.sh
./application_setup_scripts/SetUpTables.sh
```

## Environment Configuration

### Production Environment

#### Install and Configure Nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo ufw allow 'Nginx HTTP'
sudo ufw enable
sudo ufw status
```

Create the nginx configuration file as provided in `./application_setup_scripts/NGINX_SETUP.txt`.
but we don't require this for localhost development!

```bash
sudo ln -s /etc/nginx/sites-available/marko /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Localhost Environment

**Note: Nginx is NOT required for localhost development.**

#### Update Configuration Files

Update the following files with localhost URLs:

1. **customer login-website/src/components/Navbar.js**
   - Replace: `https://www.markoitalianrestaurant.com`
   - With: `http://localhost:3100`

2. **public_restaurant_website/src/components/BookingOptions.js**
   - Replace: `https://customer.markoitalianrestaurant.com`
   - With: `http://localhost:3000`

3. **admin_restaurant_website/src/services/apiService.js**
   - Replace: `https://api.markoitalianrestaurant.com`
   - With: `http://localhost:4000`

4. **AdminSignUp.sh**
   - Replace: `https://api.markoitalianrestaurant.com`
   - With: `http://localhost:4000`

5. **customer login-website/src/services/apiService.js**
   - Replace: `https://api.markoitalianrestaurant.com`
   - With: `http://localhost:4000`

6. **public_restaurant_website/src/config/apiConfig.js**
   - Replace: `https://api.markoitalianrestaurant.com`
   - With: `http://localhost:4000`

## Starting the Application

```bash
.application_setup_scripts/application_startup.sh
```

## Access Points

### Production
- Public site: https://www.markoitalianrestaurant.com
- Admin site: https://admin.markoitalianrestaurant.com
- Customer site: https://customer.markoitalianrestaurant.com
- API: https://api.markoitalianrestaurant.com/api/

### Localhost
- Public site: http://localhost:3100
- Admin site: http://localhost:3200
- Customer site: http://localhost:3000
- API: http://localhost:4000/api/

## Stopping the Application

```bash
./application_shut_down.sh
```

## Creating Admin Account

After the application is running, create an admin account:

```bash
./AdminSignUp.sh
```

## Logs

Application logs are stored in `/opt/app/logs/`
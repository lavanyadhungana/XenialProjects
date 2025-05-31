#!/usr/bin/env bash
# admin_signup.sh
# This script sends a request to create an admin account using curl

# Exit immediately if any command fails
set -e

# API endpoint configuration - replace with your actual backend URL and endpoint
API_URL="https://api.markoitalianrestaurant.com/api/auth"
ADMIN_SIGNUP_ENDPOINT="/admins/signup"

echo "   Sending request to ${API_URL}${ADMIN_SIGNUP_ENDPOINT}..."

# Send the POST request with curl
curl -X POST "${API_URL}${ADMIN_SIGNUP_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "email_address": "markoitalianrestaurant@gmail.com",
    "password": "eatwithmarko",
    "first_name": "Marko",
    "last_name": "Rossi",
    "phone_number": "+61412345678"
  }' \
  --fail \
  --silent \
  --show-error \
  --output admin_response.json

# Check if the request was successful
if [ $? -eq 0 ]; then
  echo "Admin account created successfully!"
  echo "Response saved to admin_response.json"
else
  echo "Error creating admin account. Please check your backend API."
  exit 1
fi


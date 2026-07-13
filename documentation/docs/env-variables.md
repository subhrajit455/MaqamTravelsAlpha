---
sidebar_position: 3
---

# Environment Variables

The application relies on environment variables for system configuration, security secrets, database connections, and payment integrations.

## Environment File Structure

Copy `.env.example` into a local `.env` file at the root of the project. **Never commit the `.env` file to version control.**

```env
# System Configuration
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/maqam_travels

# Security and Cryptography
ACCESS_TOKEN_SECRET=your_jwt_access_secret_key_minimum_32_characters
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key_minimum_32_characters

# Payment Gateways (Staging/Production Credentials)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PHONEPE_MERCHANT_ID=...
PHONEPE_SALT_KEY=...
PHONEPE_SALT_INDEX=1

# Ops & CRM Portal Gating
CRM_PREFIX=/ops-crm
```

---

## Detailed Variable Reference

### System Configurations
* **`PORT`:** The port on which the Express server listens. Default is `5000`.
* **`NODE_ENV`:** The environment context. Options: `development`, `staging`, `production`. 
  > [!WARNING]
  > Set `NODE_ENV=production` in live environments to force HTTP cookie security (`secure: true`), strict logging, and disable raw error stacks in API responses.
* **`API_URL`:** Root URL of the API. Used to construct redirect links for PayPal cancel/success URLs and webhook listeners.

### Database
* **`MONGODB_URI`:** MongoDB connection string. In production, this should point to a high-availability MongoDB Atlas replica set with auth credentials.

### Cryptography & JWT
* **`ACCESS_TOKEN_SECRET`:** Random high-entropy secret key used to sign access tokens (expiry 60 minutes).
* **`REFRESH_TOKEN_SECRET`:** Secret key used to sign refresh tokens (expiry 7 days).
  > [!IMPORTANT]
  > Do not use plain text strings. Generate secure secrets using OpenSSL:
  > ```bash
  > openssl rand -base64 32
  > ```

### Payment Gateways
* **`RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`:** Credentials for creating Razorpay Orders and verifying signature webhooks.
* **`PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET`:** API keys for the PayPal checkout capture lifecycle.
* **`PHONEPE_MERCHANT_ID` & `PHONEPE_SALT_KEY`:** Keys for generating PhonePe checksum hashes.

### CRM Configuration
* **`CRM_PREFIX`:** URL prefix gate for back-office operations (e.g. `/ops-crm`). Changing this value acts as security through obscurity to hide the administrative CRM endpoints.

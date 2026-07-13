---
sidebar_position: 2
---

# Getting Started

This guide explains how to set up the MaqamTravels backend development environment on your local machine.

## Prerequisites

Ensure you have the following software installed:

* **Node.js** (v18.x or v20.x recommended)
* **MongoDB** (v6.x+ or local instance / MongoDB Atlas URI)
* **Git** for version control
* **npm** (v9.x+ or v10.x+)

---

## Installation Steps

### 1. Clone the Repository

Clone the repository to your local directory:

```bash
git clone https://github.com/maqamtravels/travel-platform-server.git
cd travel-platform-server
```

### 2. Install Backend Dependencies

Run the installation command in the root folder:

```bash
npm install
```

### 3. Set Up Environment variables

Create a `.env` file from the provided example template:

```bash
cp .env.example .env
```

*(Review the [Environment Variables](./env-variables.md) guide to fill in the secrets).*

### 4. Seed Development Data (Optional)

If database seeding scripts are provided for hotels, flights, or packages:

```bash
npm run seed
```

---

## Running the Application

### Local Development Mode

Start the local server with `nodemon` for hot-reloading:

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the `PORT` specified in your `.env`).

### Production Mode

Build and run the compiled Node application:

```bash
npm run build
npm start
```

---

## Verifying the Setup

* **Health Check:** Send a GET request to `http://localhost:5000/health` to confirm the server is running.

  ```bash
  curl http://localhost:5000/health
  ```

  Expected response:

  ```json
  {
    "status": "ok",
    "env": "development",
    "uptime": 12.34
  }
  ```

* **API Documentation:** Visit `http://localhost:5000/api/docs` in your browser to view the interactive Swagger interface.

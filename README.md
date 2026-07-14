# URL Shortener Backend API

This project provides a robust, production-ready backend service for a URL shortener application. Built on top of Node.js and Express.js, it leverages a PostgreSQL database to ensure data persistence, atomicity, and high availability. The system is designed to efficiently generate shortened URLs, execute rapid HTTP redirects, and asynchronously track comprehensive access analytics.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Features](#core-features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Environment Configuration](#environment-configuration)
7. [API Documentation](#api-documentation)
8. [Installation and Setup](#installation-and-setup)
9. [Error Handling and Logging](#error-handling-and-logging)

---

## Architecture Overview

The system follows a Model-View-Controller (MVC) architectural pattern, adapted for a headless API structure.
*   **Routing Layer:** Express.js routers intercept incoming requests and pass them through a centralized middleware stack.
*   **Controller Layer:** The core business logic (URL generation, validation, analytics processing) resides in the controllers.
*   **Data Access Layer:** Raw SQL queries are executed against a PostgreSQL connection pool using the `pg` driver, ensuring optimal resource utilization under concurrent load.
*   **Asynchronous Processing:** Analytics tracking and click counting are decoupled from the redirection response, ensuring that database I/O does not penalize client redirect latency.

## Core Features

*   **Algorithmic URL Generation:** Utilizes a Base62 encoding algorithm paired with an atomic, thread-safe database counter to generate ultra-compact, collision-free short identifiers.
*   **High-Speed Redirection:** Looks up original URLs via indexed Short IDs and issues standard HTTP 302 redirects.
*   **Input Normalization:** Strictly validates and sanitizes incoming URLs, automatically prepending `http://` protocols to prevent relative-path vulnerabilities.
*   **Comprehensive Analytics:** Silently tracks incoming request data, including timestamps (`accessed_at`), User-Agent strings, and IP addresses.
*   **Automated Click Tracking:** Maintains an ongoing ledger of total clicks per generated URL.
*   **Cascading Deletions:** Safely removes URLs and their associated analytics records while preserving database integrity via foreign key constraints.

## Technology Stack

*   **Runtime:** Node.js (v18+)
*   **Framework:** Express.js (v5)
*   **Database:** PostgreSQL (v14+)
*   **Driver:** `pg` (node-postgres)
*   **Security:** `helmet` (HTTP header security), `cors` (Cross-Origin Resource Sharing)
*   **Logging:** `winston` (Advanced JSON and console logging)

## Project Structure

```text
.
├── .env.example             # Template for required environment variables
├── app.js                   # Express application, middleware injection, and root routes
├── config.js                # Centralized configuration loader for database/environment
├── index.js                 # Application entry point and TCP server binding
├── package.json             # Project dependencies and npm scripts
├── schema.sql               # PostgreSQL DDL script for database initialization
├── controllers/
│   └── urlController.js     # Business logic for API endpoints
├── middleware/
│   ├── errorHandler.js      # Global error catching middleware
│   └── index.js             # Middleware barrel file
├── routes/
│   ├── index.js             # API route aggregator and health check
│   └── urlRoutes.js         # Dedicated URL resource routes
└── utils/
    ├── database.js          # PostgreSQL connection pool manager
    └── logger.js            # Winston logger instantiation and formatting
```

## Database Schema

The backend requires a PostgreSQL database provisioned with the following normalized tables:

### 1. `url_counter`
Maintains a single row tracking the absolute number of URLs generated. Used for atomic increments to prevent race conditions.
*   `num_value` (BIGINT): The atomic counter.
*   `updated_at` (TIMESTAMP): Last modification time.

### 2. `urls`
Stores the core mapping data.
*   `id` (SERIAL): Primary Key.
*   `short_id` (VARCHAR(10)): Unique Base62 string. Indexed for fast redirect lookups.
*   `long_url` (TEXT): The original destination URL.
*   `clicks` (INTEGER): Total access counter.
*   `created_at` (TIMESTAMP): Record creation time.

### 3. `analytics`
Stores granular tracking data for every redirect event.
*   `id` (SERIAL): Primary Key.
*   `short_id` (TEXT): Foreign Key linked to `urls(short_id)`.
*   `accessed_at` (TIMESTAMP): Exact time of request.
*   `user_agent` (TEXT): Client browser data.
*   `ip_address` (TEXT): Client network address.

## Environment Configuration

The application requires specific environment variables to establish database connections and configure the server port. Copy the `.env.example` file to a new file named `.env` in the root directory and populate it with your specific values.

```env
PORT=3000
BASE_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=url_shortener_database
DB_USER=postgres
DB_PASSWORD=your_secure_password
```

## API Documentation

The server responds to the following RESTful endpoints. The default port is `3000`.

### 1. Server Health Check
Validates that the Node.js server is actively listening for incoming TCP connections.

*   **Endpoint:** `GET /api/health`
*   **cURL Example:**
    ```bash
    curl -X GET http://localhost:3000/api/health
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "ok",
      "timestamp": "2026-07-14T18:49:28.064Z"
    }
    ```

### 2. Generate Short URL
Creates a new short URL record.

*   **Endpoint:** `POST /api/shorturl`
*   **Headers:** `Content-Type: application/json`
*   **Body:**
    ```json
    {
      "longURL": "github.com"
    }
    ```
*   **cURL Example:**
    ```bash
    curl -X POST http://localhost:3000/api/shorturl \
         -H "Content-Type: application/json" \
         -d '{"longURL": "github.com"}'
    ```
*   **Response (200 OK):**
    ```json
    {
      "longURL": "http://github.com",
      "shortenedURL": "http://localhost:3000/1",
      "shortID": "1"
    }
    ```

### 3. URL Redirection
The core redirect mechanism. Note that this endpoint is mounted at the root level, not under `/api`.

*   **Endpoint:** `GET /<shortID>`
*   **cURL Example:**
    ```bash
    curl -i http://localhost:3000/1
    ```
*   **Response (302 Found):**
    ```http
    HTTP/1.1 302 Found
    Location: http://github.com
    ```

### 4. Fetch URL Analytics
Retrieves all logged access events for a specific shortened URL.

*   **Endpoint:** `GET /api/analytics/<shortID>`
*   **cURL Example:**
    ```bash
    curl -X GET http://localhost:3000/api/analytics/1
    ```
*   **Response (200 OK):**
    ```json
    {
      "url": {
        "long_url": "http://github.com"
      },
      "stats": [
        {
          "id": 1,
          "short_id": "1",
          "accessed_at": "2026-07-14T18:49:28.136Z",
          "user_agent": "curl/8.7.1",
          "ip_address": "::1"
        }
      ]
    }
    ```

### 5. Fetch Full URL History
Returns an array of all shortened URLs stored in the database, ordered by creation date.

*   **Endpoint:** `GET /api/history`
*   **cURL Example:**
    ```bash
    curl -X GET http://localhost:3000/api/history
    ```
*   **Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "short_id": "1",
        "long_url": "http://github.com",
        "clicks": 1,
        "created_at": "2026-07-14T18:49:28.108Z"
      }
    ]
    ```

### 6. Delete URL Record
Permanently removes a URL and cascades the deletion to all associated analytics records.

*   **Endpoint:** `DELETE /api/delete/<shortID>`
*   **cURL Example:**
    ```bash
    curl -X DELETE http://localhost:3000/api/delete/1
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "URL deleted successfully",
      "deleted": {
        "id": 1,
        "short_id": "1",
        "long_url": "http://github.com"
      }
    }
    ```

## Installation and Setup

### Prerequisites
*   Node.js (v18.x or higher)
*   PostgreSQL (v14.x or higher)

### Step-by-Step Guide

1.  **Clone the Repository**
    ```bash
    git clone <repository_url>
    cd url_shortener_backend
    ```

2.  **Database Provisioning**
    Ensure your PostgreSQL server is active. Log into `psql` or use a GUI tool (like pgAdmin) to create the target database:
    ```sql
    CREATE DATABASE url_shortener_database;
    ```

3.  **Apply the Database Schema**
    Execute the provided `schema.sql` script against your newly created database to provision the necessary tables and constraints:
    ```bash
    psql -U postgres -d url_shortener_database -f schema.sql
    ```

4.  **Configure Environment Variables**
    Create a secure `.env` file based on the template:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and fill in the database credentials mapping to the database created in Step 2.

5.  **Install Node Dependencies**
    Install all required npm packages specified in `package.json`:
    ```bash
    npm install
    ```

6.  **Run the Server**
    For development, run the application using `nodemon` to enable hot-reloading:
    ```bash
    npm run dev
    ```
    For production, run the application using the standard node process:
    ```bash
    npm start
    ```
    The server will output `Server running on port 3000.` and `Database connected successfully` in the terminal.

## Error Handling and Logging

This application utilizes a strict, centralized error handling pipeline.
*   **Uncaught Exceptions:** Database queries wrapped in `try/catch` blocks funnel errors directly to `next(error)`.
*   **JSON Responses:** The API will never crash or return HTML stack traces to the client. All errors are intercepted by `middleware/errorHandler.js` and formatted as standard JSON objects:
    ```json
    {
      "success": false,
      "error": {
        "code": "INTERNAL_ERROR",
        "message": "Failed to generate Shortened URL",
        "path": "/api/shorturl",
        "method": "POST"
      }
    }
    ```
*   **Winston Logger:** Internal application states, incoming requests, and stack traces are logged via Winston (`utils/logger.js`). In development mode, logs are colorized and sent to `stdout`. In production environments, Winston can be configured to pipe logs directly to external aggregation services.

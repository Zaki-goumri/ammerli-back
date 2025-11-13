
# Project Technical Overview
This document provides a technical overview of the current codebase, including its architecture, components, key features, and instructions for interacting with the code.

# Application Overview
The application is a B2B e-commerce platform connecting **wholesalers** (sellers) and **supermarkets** (buyers).

## Key Features
- **Product Management**: Allows wholesalers to manage their product catalog, including brands, categories, pricing, and stock levels.
- **Order Management**: Enables supermarkets to place orders, with support for multiple payment methods.
- **Payment Integration**: Integrates with the **Chargily** payment gateway for online transactions and uses webhooks to handle payment status updates.
- **Invoice Generation**: Automatically generates PDF invoices for completed orders.
- **Order Tracking**: Provides order tracking with statuses like `CONFIRMATION`, `PREPARATION`, `ON_DELIVERING`, and `DELIVERED`.
- **User Management**: Features a role-based access control system (`ADMIN`, `WHOLESELLER`, `SUPERMARKET`) and includes user registration, profile management, and address management.
- **Notifications**: Uses FCM (Firebase Cloud Messaging) for push notifications related to payments and product expirations.
- **Analytics Dashboard**: An analytics module provides insights into daily stats, turnover, and top-selling products for administrators.

# Tech Stack
- **NestJs**: A backend framework for building efficient, scalable, and clean server-side applications.
- **TypeScript**: A superset of JavaScript that adds static types, enhancing code quality and maintainability.
- **PostgreSQL**: A powerful, open-source relational database system.

# Core Module Structure (`src/core`)
- **`analytics`**: Provides business analytics for the admin dashboard, including daily statistics, monthly turnover, and top-selling products.
- **`authentication`**: Handles user authentication via OTP and JWT, registration, and role-based access control.
- **`chargili`**: Manages integration with the Chargily payment gateway.
- **`invoice`**: Responsible for generating and managing PDF invoices for orders.
- **`notifications`**: Manages push notifications through FCM for events like payment updates and product alerts.
- **`order`**: Handles the entire order lifecycle, including creation, payment processing, and status tracking.
- **`product`**: Manages products, brands, categories, and user favorites.
- **`user`**: Manages user profiles, addresses, and a user blacklisting system.

# General Folder Structure
- **`src/common`**: Contains shared modules, services, and utilities (constants, decorators, filters, etc.).
- **`src/config`**: Manages application configuration loaded from `.env` files.
- **`src/infrastructure`**: Handles external service integrations like databases (`db`), Firebase (`firebase`), object storage (`minio`), and background job queues (`queue`).

# How to Interact with the Codebase
1.  **Understand the Architecture**: Familiarize yourself with the core modules listed above to understand the application's main functionalities.
2.  **Identify Key Components**: For a given feature, locate the relevant module in `src/core` (e.g., for order issues, check `src/core/order`).
3.  **Explore the Code**: Navigate through the module's controllers, services, and entities to understand its logic and data structures.
4.  **Use TypeScript Features**: Leverage TypeScript interfaces, types, and decorators to understand data shapes and application flow.
5.  **Review Documentation**: Check for JSDoc comments in the code for additional context.
6.  **Log Changes**: Log all prompts and significant file changes in the `ai_logs` folder to track modifications and assist in debugging.
7.  **Document New Code**: Add JSDoc comments to any new methods or files, explaining their purpose, parameters, and providing examples.
8.  **Follow Best Practices**: Adhere to the project's existing coding standards for clean and maintainable code.

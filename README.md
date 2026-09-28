# DREWANE

DREWANE is a full-stack luxury jewelry and fragrance e-commerce platform built with Node.js, Express, SQLite, and JavaScript.

## Live Demo

https://drewane.onrender.com/

## Overview

DREWANE is a complete e-commerce application designed to provide a modern online shopping experience for jewelry and fragrance products.

The platform combines a responsive frontend with a Node.js and Express backend, SQLite database, customer accounts, shopping cart and wishlist functionality, order processing, and Paystack payment integration.

## Key Features

### Shopping Experience

- Browse jewelry and fragrance products
- View detailed product information
- Responsive interface for desktop and mobile devices

### Customer Accounts

- User registration
- User sign-in
- Password hashing
- Account information management
- Persistent login state

### Shopping Cart

- Add products to the cart
- Update product quantities
- Select ring sizes where applicable
- Remove cart items
- Automatic subtotal calculation
- Persistent cart data

### Wishlist

- Add products to a wishlist
- Remove saved products
- View saved products
- Persistent wishlist data

### Checkout & Orders

- Complete checkout workflow
- Standard and Express shipping options
- Automatic shipping calculation
- 7.5% tax calculation
- Order number generation
- Order confirmation
- Order data stored in SQLite

### Payments

- Paystack payment initialization
- Transaction verification
- Backend payment validation

## Technology Stack

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- SQLite
- Paystack API
- Git & GitHub
- Render

## Application Architecture

DREWANE uses a frontend and backend architecture.

### Frontend

The frontend provides:

- Product browsing
- Product details
- Customer authentication
- Shopping cart
- Wishlist
- Checkout interface
- Order confirmation
- Responsive layouts

### Backend

The backend is built with Node.js and Express.

It provides API routes for:

- Products
- Customer accounts
- Cart operations
- Wishlist management
- Orders
- Payment initialization
- Payment verification

## Database

SQLite is used for persistent application data.

The database stores:

- Products
- Users
- Cart items
- Wishlist items
- Orders
- Order items

## Payment Integration

DREWANE integrates Paystack for payment processing.

Payment operations are handled through the backend, including:

- Payment initialization
- Transaction verification
- Backend payment validation

Sensitive payment credentials are kept outside the source code through environment variables.

## Project Structure

```text
DREWANE/
├── assets/
├── css/
├── js/
├── pages/
├── accountRoutes.js
├── cartRoutes.js
├── database.js
├── index.html
├── orderRoutes.js
├── package-lock.json
├── package.json
├── paymentRoutes.js
├── productRoutes.js
├── server.js
└── wishlistRoutes.js

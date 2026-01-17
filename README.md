# 💸 Splitwise – Backend (Spring Boot)

A backend system for group-based expense sharing similar to Splitwise, built using **Spring Boot** with secure authentication, dynamic expense splitting, balance tracking, and settlements.

This project focuses on **backend system design, business logic, and production-style authentication workflows** rather than simple CRUD APIs.

---

## 🎯 Purpose

This project was built to practice and demonstrate **real-world backend system design**, including authentication, financial data consistency, and scalable API architecture, inspired by how platforms like Splitwise manage shared expenses.

---

## 🚀 Features

- **JWT-based stateless authentication** using Spring Security with **custom filters and refresh token rotation backed by database persistence**
- Email verification using activation tokens before account activation
- User and group management with authorization checks for group members
- Expense creation with multiple split strategies:
  - EQUAL
  - EXACT
  - PERCENTAGE
- **Net settlement calculation** to minimize number of transactions
- DTO-based API contracts and centralized exception handling

---

## 🛠 Tech Stack

- Java
- Spring Boot
- Spring Security
- JWT
- JPA / Hibernate
- MySQL
- Maven
- REST APIs

---

## 🧠 Key Backend Highlights

- Layered architecture: **Controller → Service → Repository**
- Custom business validations for split calculations and group membership
- Transaction-safe updates for expenses and balances
- Optimized aggregation queries for computing group balances
- Stateless security with token revocation support via refresh tokens

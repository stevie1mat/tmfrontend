# 🕐 TradeMinutes - Time-Based Skill Exchange Platform

<div align="center">

![TradeMinutes Logo](https://img.shields.io/badge/TradeMinutes-Time%20Exchange%20Platform-green?style=for-the-badge&logo=clock)

**Exchange Your Skills. Earn Time Credits. Build Community.**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Go](https://img.shields.io/badge/Go-1.21+-blue?style=flat-square&logo=go)](https://golang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0+-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

[Live Demo](#) • [Documentation](#) • [Contributing](#contributing) • [License](#license)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**TradeMinutes** is a revolutionary time-based skill exchange platform that enables communities to trade services using time credits instead of money. Built with a modern microservices architecture, it connects neighbors who want to help each other while building stronger, more self-sufficient communities.

### 🎯 Core Concept

Instead of traditional monetary transactions, TradeMinutes operates on a simple principle:
- **Help someone for 1 hour** = Earn 1 time credit
- **Need help for 1 hour** = Spend 1 time credit
- **Build connections** while saving money and strengthening your community

### 💡 Why TradeMinutes?

- **💰 No Money Involved**: Pure time-based exchange system
- **🤝 Community Building**: Connect with neighbors and build trust
- **🎯 Skill Diversity**: From tutoring to home repairs, gardening to tech support
- **📍 Local Focus**: Find help and offer services in your neighborhood
- **⭐ Quality Assurance**: Review system ensures reliable service

---

## ✨ Key Features

### 🔐 Authentication & User Management
- **Secure JWT-based authentication**
- **Social login integration** (Google, GitHub)
- **Password reset functionality**
- **Profile management with verification**

### 📋 Task & Service Management
- **Create and browse service listings**
- **Category-based filtering** (Cooking, Web Design, Fitness, etc.)
- **Availability scheduling** with calendar integration
- **Real-time booking system**
- **Task status tracking**

### 💬 Real-time Communication
- **WebSocket-based messaging**
- **Direct and group conversations**
- **Typing indicators and read receipts**
- **Message persistence and history**

### ⭐ Review & Rating System
- **Comprehensive review system**
- **User reputation tracking**
- **Skill verification badges**
- **Community moderation tools**

### 📱 Modern User Interface
- **Responsive design** for all devices
- **Interactive maps** for location-based services
- **Real-time notifications**
- **Beautiful animations** with Framer Motion

---

## 🏗️ Architecture

TradeMinutes follows a **microservices architecture** pattern for scalability and maintainability:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Frontend      │    │   Frontend      │
│   (Next.js)     │    │   (Next.js)     │    │   (Next.js)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼────────┐    ┌───────────▼──────────┐    ┌────────▼────────┐
│   Auth Service │    │  Task Core Service   │    │ Profile Service │
│   (Go + JWT)   │    │   (Go + MongoDB)     │    │  (Go + MongoDB) │
└────────────────┘    └──────────────────────┘    └─────────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │    Messaging Service      │
                    │   (Go + WebSockets)       │
                    └───────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Review Service        │
                    │    (Go + MongoDB)         │
                    └───────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      MongoDB Atlas        │
                    │    (Primary Database)     │
                    └───────────────────────────┘
```

### Service Breakdown

| Service | Technology | Purpose | Port |
|---------|------------|---------|------|
| **Frontend** | Next.js + TypeScript | User interface and experience | 3000 |
| **Auth Service** | Go + JWT | User authentication & authorization | 8080 |
| **Task Core** | Go + MongoDB | Task creation, booking, management | 8084 |
| **Profile Service** | Go + MongoDB | User profile management | 8081 |
| **Messaging** | Go + WebSockets | Real-time communication | 8085 |
| **Review Service** | Go + MongoDB | Reviews and ratings | 8086 |

---

## 📸 Screenshots

### 🏠 Homepage
![Homepage](../develop/screenshots/homepage.png)

*Beautiful hero section with search functionality and category browsing*

### 🔍 Service Discovery
![Service Discovery](../develop/screenshots/services.png)

*Browse services by category with filtering and search options*

### 👤 User Dashboard
![Dashboard](../develop/screenshots/dashboard.png)

*Personal dashboard showing credits, bookings, and activity*

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15.3.3](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5.0+](https://typescriptlang.org/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Maps**: [React Leaflet](https://react-leaflet.js.org/)
- **Calendar**: [FullCalendar](https://fullcalendar.io/)
- **Icons**: [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/)

### Backend Services
- **Language**: [Go 1.21+](https://golang.org/)
- **Framework**: Standard library + [Gorilla Mux](https://github.com/gorilla/mux)
- **Database**: [MongoDB 6.0+](https://mongodb.com/)
- **Authentication**: [JWT](https://jwt.io/)
- **Real-time**: [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- **Environment**: [Godotenv](https://github.com/joho/godotenv)

### DevOps & Tools
- **Containerization**: [Docker](https://www.docker.com/)
- **Version Control**: [Git](https://git-scm.com/)
- **Package Manager**: [npm](https://www.npmjs.com/) (Frontend), [Go Modules](https://go.dev/blog/using-go-modules) (Backend)
- **Linting**: [ESLint](https://eslint.org/) (Frontend), [golangci-lint](https://golangci-lint.run/) (Backend)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0+ and **npm** 8.0+
- **Go** 1.21+
- **MongoDB** 6.0+ (or MongoDB Atlas account)
- **Git**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/trademinutes.git
   cd trademinutes
   ```

2. **Set up environment variables**
   ```bash
   # Create .env files for each service
   cp trademinutes-auth/.env.example trademinutes-auth/.env
   cp trademinutes-task-core/.env.example trademinutes-task-core/.env
   cp trademinutes-profile/.env.example trademinutes-profile/.env
   cp trademinutes-messaging/.env.example trademinutes-messaging/.env
   cp trademinutes-review/.env.example trademinutes-review/.env
   ```

3. **Configure environment variables**
   ```bash
   # Example .env configuration
   MONGO_URI=mongodb://localhost:27017
   DB_NAME=trademinutes
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=8080
   ```

4. **Start the backend services**
   ```bash
   # Start Auth Service
   cd trademinutes-auth
   go mod tidy
   go run main.go

   # Start Task Core Service (in new terminal)
   cd trademinutes-task-core
   go mod tidy
   go run main.go

   # Start Profile Service (in new terminal)
   cd trademinutes-profile
   go mod tidy
   go run main.go

   # Start Messaging Service (in new terminal)
   cd trademinutes-messaging
   go mod tidy
   go run main.go

   # Start Review Service (in new terminal)
   cd trademinutes-review
   go mod tidy
   go run main.go
   ```

5. **Start the frontend**
   ```bash
   cd trademinutes-frontend
   npm install
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Setup (Alternative)

```bash
# Build and run all services with Docker Compose
docker-compose up --build
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password |
| `GET` | `/api/auth/profile` | Get user profile |

### Task Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get all tasks |
| `POST` | `/api/tasks` | Create new task |
| `GET` | `/api/tasks/{id}` | Get specific task |
| `PUT` | `/api/tasks/{id}` | Update task |
| `DELETE` | `/api/tasks/{id}` | Delete task |
| `GET` | `/api/tasks/categories` | Get task categories |

### Booking Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookings` | Create booking |
| `GET` | `/api/bookings` | Get user bookings |
| `PUT` | `/api/bookings/{id}` | Update booking |
| `DELETE` | `/api/bookings/{id}` | Cancel booking |

### Messaging Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/conversations` | Get user conversations |
| `POST` | `/api/conversations` | Create conversation |
| `GET` | `/api/conversations/{id}/messages` | Get conversation messages |
| `WebSocket` | `/ws` | Real-time messaging |

### Review Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/reviews` | Create review |
| `GET` | `/api/reviews` | Get reviews (filtered) |

---

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

### Backend Deployment (Docker)

```bash
# Build Docker images
docker build -t trademinutes-auth ./trademinutes-auth
docker build -t trademinutes-task-core ./trademinutes-task-core
docker build -t trademinutes-profile ./trademinutes-profile
docker build -t trademinutes-messaging ./trademinutes-messaging
docker build -t trademinutes-review ./trademinutes-review

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

```bash
# Required for all services
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/trademinutes
JWT_SECRET=your_production_jwt_secret
NODE_ENV=production

# Frontend specific
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** for new functionality
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style Guidelines

- **Frontend**: Follow ESLint configuration and Prettier formatting
- **Backend**: Use `gofmt` and follow Go best practices
- **Commits**: Use conventional commit messages
- **Tests**: Maintain good test coverage

### Areas for Contribution

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation improvements**
- 🎨 **UI/UX enhancements**
- 🚀 **Performance optimizations**
- 🔒 **Security improvements**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Community**: Thanks to all contributors and users
- **Open Source**: Built with amazing open-source tools
- **Design Inspiration**: Inspired by modern marketplace platforms
- **Icons**: [Lucide](https://lucide.dev/) and [React Icons](https://react-icons.github.io/react-icons/)

---

## 📞 Support

- **Documentation**: [docs.trademinutes.com](#)
- **Issues**: [GitHub Issues](https://github.com/yourusername/trademinutes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/trademinutes/discussions)
- **Email**: support@trademinutes.com

---

<div align="center">

**Made with ❤️ by the TradeMinutes Team**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/trademinutes?style=social)](https://github.com/yourusername/trademinutes)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/trademinutes?style=social)](https://github.com/yourusername/trademinutes)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/trademinutes)](https://github.com/yourusername/trademinutes/issues)

</div> 

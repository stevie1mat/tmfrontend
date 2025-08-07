# 🕐 TradeMinutes - Time-Based Skill Exchange Platform

<div align="center">

![TradeMinutes Logo](https://img.shields.io/badge/TradeMinutes-Time%20Exchange%20Platform-green?style=for-the-badge&logo=clock)

**Exchange Your Skills. Earn Time Credits. Build Community.**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Go](https://img.shields.io/badge/Go-1.21+-blue?style=flat-square&logo=go)](https://golang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0+-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

[🌐 Live Demo](https://trademinutes.app) • [Documentation](#) • [Contributing](#contributing) • [License](#license)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [🤖 AI Agent Features](#-ai-agent-features)
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
- **🤖 AI-Powered**: Advanced AI agents to enhance your experience

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

## 🤖 AI Agent Features

### 🧠 Intelligent AI Agents
TradeMinutes features advanced AI agents that enhance your experience and productivity:

#### **🤖 AI Agent Marketplace**
- **Browse AI Agents**: Discover specialized AI agents for various tasks
- **Agent Categories**: Content creation, data analysis, scheduling, and more
- **Agent Ratings**: Community-rated AI agents with performance metrics
- **Custom Agents**: Create and deploy your own AI agents

#### **⚡ AI Agent Workflows**
- **Visual Workflow Builder**: Drag-and-drop interface for creating AI workflows
- **Node-Based System**: Input, Action, and Output nodes for complex workflows
- **Real-time Execution**: Run workflows instantly with live results
- **Export Capabilities**: Export results as PDF, DOCX, or Excel files

#### **🎯 Specialized AI Agents**

##### **📝 Content Creation Agent**
- **Blog Writing**: Generate engaging blog posts and articles
- **Social Media**: Create posts for various platforms
- **Email Marketing**: Craft compelling email campaigns
- **Copywriting**: Professional copy for ads and websites

##### **📊 Data Analysis Agent**
- **Spreadsheet Analysis**: Process and analyze Excel/CSV data
- **Chart Generation**: Create visualizations and graphs
- **Report Creation**: Generate comprehensive data reports
- **Trend Analysis**: Identify patterns and insights

##### **📅 Scheduling Assistant**
- **Calendar Management**: Intelligent scheduling and planning
- **Meeting Coordination**: Automated meeting scheduling
- **Task Prioritization**: Smart task organization
- **Time Optimization**: Efficient time management suggestions

##### **🎨 Creative Design Agent**
- **Logo Design**: Generate brand logos and graphics
- **Color Schemes**: Professional color palette suggestions
- **Layout Design**: Website and document layouts
- **Brand Identity**: Complete brand development

#### **🔄 AI Agent Integration**
- **Seamless Integration**: AI agents work alongside human services
- **Hybrid Solutions**: Combine AI and human expertise
- **Quality Assurance**: AI-enhanced service verification
- **Learning System**: Agents improve with community feedback

#### **📈 AI Agent Analytics**
- **Performance Tracking**: Monitor agent effectiveness
- **Usage Analytics**: Understand agent popularity and usage
- **Improvement Suggestions**: AI-driven optimization recommendations
- **Community Insights**: Learn from collective usage patterns

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
                    │    AI Agent Service       │
                    │   (Python + FastAPI)      │
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
| **AI Agent Service** | Python + FastAPI | AI agent management and execution | 8002 |

---

## 📸 Screenshots

### 🏠 Homepage
![Homepage](screenshots/homepage_new.png)

*Beautiful hero section with search functionality and category browsing*

### 🤖 AI Agent Marketplace
![AI Agents](../develop/screenshots/ai-agents.png)

*Browse and interact with specialized AI agents*

### ⚡ AI Workflow Builder
![Workflow Builder](../develop/screenshots/workflow-builder.png)

*Visual workflow builder for creating complex AI workflows*

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
- **AI Integration**: [Mistral AI API](https://mistral.ai/) for AI agents

### Backend Services
- **Language**: [Go 1.21+](https://golang.org/) & [Python 3.9+](https://python.org/)
- **Framework**: Standard library + [Gorilla Mux](https://github.com/gorilla/mux) (Go), [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: [MongoDB 6.0+](https://mongodb.com/)
- **Authentication**: [JWT](https://jwt.io/)
- **Real-time**: [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- **Environment**: [Godotenv](https://github.com/joho/godotenv)

### AI & ML
- **AI Models**: [Mistral AI](https://mistral.ai/) for text generation
- **Workflow Engine**: Custom Python-based workflow execution
- **File Processing**: [ExcelJS](https://github.com/exceljs/exceljs) for Excel operations
- **Document Generation**: [Docx](https://python-docx.readthedocs.io/) for Word documents

### DevOps & Tools
- **Containerization**: [Docker](https://www.docker.com/)
- **Version Control**: [Git](https://git-scm.com/)
- **Package Manager**: [npm](https://www.npmjs.com/) (Frontend), [Go Modules](https://go.dev/blog/using-go-modules) (Backend), [pip](https://pip.pypa.io/) (Python)
- **Linting**: [ESLint](https://eslint.org/) (Frontend), [golangci-lint](https://golangci-lint.run/) (Backend), [flake8](https://flake8.pycqa.org/) (Python)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0+ and **npm** 8.0+
- **Go** 1.21+
- **Python** 3.9+
- **MongoDB** 6.0+ (or MongoDB Atlas account)
- **Git**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/ElioCloud/trademinutes-frontend.git
   cd trademinutes-frontend
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file
   cp .env.example .env
   ```

3. **Configure environment variables**
   ```bash
   # Example .env configuration
   NEXT_PUBLIC_USER_API_URL=https://tm-userservice-ddb4axfjb0bxf0ck.canadacentral-01.azurewebsites.net
   NEXT_PUBLIC_TASK_API_URL=http://localhost:8084
   NEXT_PUBLIC_MESSAGING_API_URL=http://localhost:8085
   NEXT_PUBLIC_REVIEW_API_URL=http://localhost:8086
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8002
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start the development server**
   ```bash
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
| `POST` | `/api/auth/github` | GitHub OAuth login |
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

### AI Agent Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agents` | Get all AI agents |
| `POST` | `/api/agents` | Create new AI agent |
| `GET` | `/api/agents/{id}` | Get specific AI agent |
| `POST` | `/api/workflows` | Create AI workflow |
| `POST` | `/api/workflows/{id}/execute` | Execute AI workflow |
| `GET` | `/api/workflows/{id}/results` | Get workflow results |

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
docker build -t trademinutes-ai ./trademinutes-ai

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
NEXTAUTH_URL=https://trademinutes.app
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AI Service specific
MISTRAL_API_KEY=your_mistral_api_key
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
- **Python**: Follow PEP 8 and use `black` for formatting
- **Commits**: Use conventional commit messages
- **Tests**: Maintain good test coverage

### Areas for Contribution

- 🐛 **Bug fixes**
- ✨ **New features**
- 🤖 **AI agent improvements**
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
- **AI Integration**: Powered by [Mistral AI](https://mistral.ai/)
- **Design Inspiration**: Inspired by modern marketplace platforms
- **Icons**: [Lucide](https://lucide.dev/) and [React Icons](https://react-icons.github.io/react-icons/)

---

## 📞 Support

- **🌐 Live Demo**: [https://trademinutes.app](https://trademinutes.app)
- **Documentation**: [docs.trademinutes.app](#)
- **Issues**: [GitHub Issues](https://github.com/ElioCloud/trademinutes-frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ElioCloud/trademinutes-frontend/discussions)
- **Email**: support@trademinutes.app

---

<div align="center">

**Made with ❤️ by the TradeMinutes Team**

[![GitHub stars](https://img.shields.io/github/stars/ElioCloud/trademinutes-frontend?style=social)](https://github.com/ElioCloud/trademinutes-frontend)
[![GitHub forks](https://img.shields.io/github/forks/ElioCloud/trademinutes-frontend?style=social)](https://github.com/ElioCloud/trademinutes-frontend)
[![GitHub issues](https://img.shields.io/github/issues/ElioCloud/trademinutes-frontend)](https://github.com/ElioCloud/trademinutes-frontend/issues)

</div> 
# Updated Thu Aug  7 16:21:07 EDT 2025

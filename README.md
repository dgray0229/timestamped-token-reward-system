# Timestamped Token Reward System

A comprehensive tutorial application demonstrating Solana blockchain integration with modern React frontend and Node.js backend. Perfect for learning blockchain development and showcasing full-stack skills in technical interviews.

## 🏗️ Architecture Overview

- **Frontend**: React 18 + TypeScript + Vite + Redux Toolkit + Tailwind CSS + SHAD UI
- **Backend**: Node.js + Express + TypeScript + PostgreSQL (Supabase) + Redis
- **Blockchain**: Solana + Anchor Framework + @solana/web3.js
- **Deployment**: Vercel (Frontend) + Railway (Backend) + Solana Devnet/Mainnet

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (recommend using [fnm](https://github.com/Schniz/fnm))
- pnpm 8+ (`npm install -g pnpm`)
- Rust and Solana CLI ([install guide](https://docs.solana.com/cli/install-solana-cli-tools))
- Anchor CLI (`npm install -g @coral-xyz/anchor-cli`)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd timestamped-token-reward-system

# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Setup the project
pnpm setup
```

### Development

```bash
# Start all services (recommended)
pnpm dev

# Or start services individually
pnpm dev:web     # Frontend only
pnpm dev:api     # Backend only
pnpm dev:solana  # Local Solana validator
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific tests
pnpm test:web
pnpm test:api
pnpm test:solana
```

## 📁 Project Structure

```
├── apps/
│   ├── web/           # React frontend application
│   ├── api/           # Express backend API
│   └── solana-program/# Anchor Solana program
├── packages/
│   ├── shared/        # Shared TypeScript types
│   ├── ui/            # Shared UI components
│   └── config/        # Shared configurations
├── docs/              # Documentation
└── scripts/           # Build and deployment scripts
```

## 🎯 Learning Objectives

This project demonstrates:

- **Modern React Patterns**: Functional components, custom hooks, Redux Toolkit
- **Backend Development**: Express API design, database integration, authentication
- **Blockchain Integration**: Solana program development, wallet connections, transactions
- **Full-Stack Architecture**: Monorepo structure, shared types, deployment strategies
- **Professional Practices**: Testing, linting, CI/CD, documentation

## 🔗 Key Features

- **Wallet Connection**: Multi-wallet support (Phantom, Solflare, etc.)
- **Reward System**: Time-based token rewards with claiming mechanism
- **Transaction History**: Complete audit trail with blockchain verification
- **Real-time Updates**: Live balance and transaction status updates
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## 📚 Documentation

- [Architecture Document](./docs/architecture.md) - Complete system design
- [API Documentation](./docs/api-documentation.md) - REST API reference
- [Development Setup](./docs/development-setup.md) - Detailed setup guide
- [Deployment Guide](./docs/deployment-guide.md) - Production deployment
- [Tutorial Series](./docs/tutorial/) - Step-by-step learning guide

## 🛠️ Tech Stack Details

### Frontend
- **React 18**: Modern React with concurrent features
- **TypeScript**: Full type safety across the application
- **Vite**: Lightning-fast development and build tool
- **Redux Toolkit**: Efficient state management with RTK Query
- **Tailwind CSS**: Utility-first CSS framework
- **SHAD UI**: Accessible, customizable component library

### Backend
- **Node.js 20**: Latest LTS with modern JavaScript features
- **Express**: Fast, unopinionated web framework
- **TypeScript**: Server-side type safety
- **Supabase**: PostgreSQL database with real-time features
- **Redis**: High-performance caching and session storage
- **JWT**: Secure authentication tokens

### Blockchain
- **Solana**: High-performance blockchain platform
- **Anchor**: Rust framework for Solana programs
- **@solana/web3.js**: Official JavaScript SDK
- **Wallet Adapter**: Multi-wallet support library

## 🔐 Security Features

- Wallet signature verification
- JWT-based authentication
- Rate limiting and input validation
- CORS protection
- Environment variable security
- Error handling and logging

## 📈 Performance Optimizations

- Code splitting and lazy loading
- Redis caching strategy
- Database query optimization
- Bundle size optimization
- CDN deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Book](https://book.anchor-lang.com/)
- [React Documentation](https://react.dev/)
- [SHAD UI](https://ui.shadcn.com/)

---

Built with ❤️ for learning and demonstrating modern full-stack development with blockchain integration.
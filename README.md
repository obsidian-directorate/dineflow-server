# DineFlow Backend API

Real-time restaurant management and reservation system.

## 🚀 Quick start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd dineflow-backend
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## 🛠️ Development scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:debug` - Start with debugger
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting

## 🔧 Environment variables

See `.env.example` for all required variables.

## 📊 API status

Once running, check: `http://localhost:5000/health`

## 🪵 Logging

Uses Winston with:

- Console output (colored)
- Daily rotating files
- Multiple log levels

## 🚨 Error handling

Global error handling with appropriate HTTP status codes.

## 📝 License

This project is licensed under the MIT license. See [LICENSE](LICENSE) for info.

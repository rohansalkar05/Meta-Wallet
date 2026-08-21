# Integrated Full-Stack Authentication & Web3 Wallet Dashboard

A production-ready full-stack application combining a standalone **Authentication System** (React, Express, Neon PostgreSQL) with an integrated **Web3 Wallet Dashboard** (MetaMask, ethers.js v6, BNB Smart Chain Testnet) and **Hardhat Smart Contracts**.

---

## 🏗️ Architecture Overview

```
                      React Single-Page Application (Vite)
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
       Authentication Routes                         Protected Route
    (/login, /signup, /verify-otp)                      (/dashboard)
                │                                             │
                ▼                                             ▼
      Backend REST API (Express)                   Integrated Web3 Dashboard
     (Neon PostgreSQL DB, JWT)                 (window.ethereum + ethers.js v6)
                                                              │
                                                              ▼
                                                   BNB Smart Chain Testnet
                                                      (Chain ID: 97)
```

### Key Components

1. **Authentication Core (`backend/` & `frontend/src/pages/`)**:
   - **Signup**: Full name, Email, Password $\rightarrow$ bcrypt hashing $\rightarrow$ PostgreSQL storage $\rightarrow$ SHA-256 hashed 6-digit OTP $\rightarrow$ 5-min OTP JWT.
   - **Signup OTP Verification**: Validates 6-digit OTP $\rightarrow$ Issues 1-hour session JWT $\rightarrow$ Stores in `localStorage`.
   - **Login**: Email + Password authentication $\rightarrow$ Direct 1-hour session JWT (**NO OTP on login**).
   - **Protected Dashboard Guard**: Rejects invalid, missing, or expired tokens.

2. **Web3 Wallet Dashboard (`frontend/src/pages/DashboardPage.jsx`)**:
   - **MetaMask Connection**: Uses `window.ethereum` and `ethers.BrowserProvider` (ethers.js v6).
   - **BNB Smart Chain Testnet**: Chain ID `97` (`0x61`). Automatic detection & network switching (`wallet_switchEthereumChain` / `wallet_addEthereumChain`).
   - **Wallet Metrics**: Full wallet address with instant copy button, native `tBNB` balance formatted via `ethers.formatEther()`, raw Wei count, BscScan explorer link.
   - **MetaMask Events**: Listens for `accountsChanged` and `chainChanged` to update state dynamically.

3. **Hardhat Project (`hardhat/`)**:
   - Preserved `hardhat/contracts/Counter.sol` (Solidity `0.8.28`) and `hardhat/hardhat.config.js` for independent contract development, testing, and deployment.

---

## 🚀 Quick Start Guide

### 1. Database Initialization
Ensure your Neon PostgreSQL connection URL is configured in [`backend/.env`](file:///c:/Users/Rohan/Desktop/internship/iMETA/wallet-app/backend/.env):
```env
PORT=5000
DATABASE_URL=postgresql://your_neon_user:password@ep-xxx.neon.tech/neondb?sslmode=require
JWT_SECRET=super_secret_jwt_key_auth_2026
```

Initialize the database schema:
```powershell
cd backend
npm run db:init
```

### 2. Start Backend Server
```powershell
cd backend
npm run dev
```
*Backend runs on `http://localhost:5000`*

### 3. Start Frontend React Application
```powershell
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🧪 Testing the Integrated Application

1. Open `http://localhost:5173/signup` in your browser.
2. Register a new user, enter the 6-digit DEV OTP from the blue notice box, and click **Verify OTP**.
3. You will land on the protected **Web3 Financial Terminal Dashboard** (`/dashboard`).
4. Click **Connect MetaMask** to connect your MetaMask wallet.
5. If your MetaMask is on another network, click **Switch to BNB Testnet** to switch to Chain ID 97.
6. Observe your connected address, `tBNB` balance, copy address button, and network metadata.
7. Click **Log Out** to clear your session token and return to `/login`.

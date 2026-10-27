# Luma Wallet

### Your money, beautifully organized.

Luma Wallet is a modern personal finance dashboard designed to make tracking expenses, managing budgets, and understanding spending habits simple and intuitive.

Built with a clean interface, a calming sage-and-forest-green color palette, and a focus on user experience, Luma Wallet brings everyday money management into one place.

## 🔗 Live Demo & Deployment

- **Frontend:** [Luma Wallet — Live Website](https://luma-wallet.vercel.app)
- **Backend API:** [Luma Wallet — Render](https://luma-wallet-4.onrender.com)

> **Deployment status:** The frontend and backend are deployed. The backend is successfully connected to MongoDB Atlas. Frontend-to-backend integration and Content Security Policy (CSP) issues are currently being investigated.

## ✨ Features

- **📊 Financial Overview** — View your financial summary from a centralized dashboard.
- **💸 Transaction Management** — Add, edit, delete, search, and filter transactions.
- **🎯 Budget Tracking** — Set and monitor your monthly budget.
- **📈 Spending Analytics** — Explore your spending patterns through visual insights.
- **💳 My Cards** — A dedicated section for a cleaner financial dashboard experience.
- **📁 CSV Export** — Export transaction data for personal records and analysis.
- **💾 Local Data Persistence** — Save supported transaction and budget data in your browser using local storage.
- **📱 Responsive UI** — A thoughtfully designed interface for different screen sizes.

## 🎨 Design Philosophy

Luma Wallet combines a minimal layout with a soft ivory background, forest-green accents, clean white cards, and rounded components.

The goal is to make financial information feel clear, approachable, and easy to navigate.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, CSS
- **3D Graphics:** Three.js, React Three Fiber, React Three Drei
- **Backend:** Node.js, TypeScript
- **Database:** MongoDB Atlas
- **Backend Hosting:** Render
- **Frontend Hosting:** Vercel
- **Browser Storage:** Local Storage

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) and npm installed.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Aayushi-Agarwal123/luma-wallet.git
   ```

2. Navigate to the project directory:

   ```bash
   cd luma-wallet
   ```

3. Install dependencies in the appropriate frontend or backend directory using its `package.json`.

4. Configure the required environment variables locally. Never commit database credentials or API secrets.

5. Start the development server using the scripts defined in the relevant `package.json`.

## 📂 Project Structure

```text
luma-wallet/
├── public/
├── src/
│   ├── assets/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

*Note: The repository may contain additional backend files and directories as development progresses.*

## 🔒 Data & Privacy

Luma Wallet currently uses browser local storage for supported data. Data is stored locally in the browser rather than synced through a backend account.

The backend is deployed and connected to MongoDB Atlas. Frontend integration with the deployed backend is still being tested.

**Note:** This project is a personal finance management interface, not a banking application. Live bank integration is not currently included.

## 🗺️ Future Improvements

- Enhanced transaction categorization
- Advanced budgeting and spending insights
- Improved charts and financial reports
- Data backup and restore options
- Authentication and secure cloud synchronization
- Complete frontend-backend integration
- Further UI and accessibility improvements

## 👩‍💻 Author

**Aayushi Agarwal**

B.Tech Computer Science & Engineering student interested in full-stack development and building practical, user-friendly applications.

- GitHub: [@Aayushi-Agarwal123](https://github.com/Aayushi-Agarwal123)

## 📄 License

This project is currently available for personal learning and development. A formal open-source license can be added separately.

---

*Luma Wallet — A clearer view of your money.* 💚

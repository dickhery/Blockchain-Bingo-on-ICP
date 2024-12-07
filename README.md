# 🎉 Bingo on the Internet Computer 🎉

Welcome to **Blockchain Bingo** – an exciting decentralized Bingo game built on the Internet Computer Protocol (ICP)! Dive into a fair, transparent, and engaging gaming experience where you can play against users from around the world directly on the blockchain. Whether you're aiming for a **Standard** win or going for a complete **Blackout**, our platform ensures a seamless and fun experience for all players.

## 📖 Table of Contents

- [✨ Description](#description)
  - [🎲 How It Works](#how-it-works)
- [🕹️ How to Play](#how-to-play)
- [🚀 Features](#features)
- [📊 Game Types](#game-types)
- [💡 What is ICP?](#what-is-icp)
- [🛠️ User Guides](#user-guides)
  - [🔑 Creating or Changing Your Username](#creating-or-changing-your-username)
  - [🎮 Hosting a Game](#hosting-a-game)
    - [💸 Financial Breakdown Example](#financial-breakdown-example)
  - [🔒 Creating Private Games](#creating-private-games)
- [💰 Financial Breakdown](#financial-breakdown)
- [💻 Installation](#installation)
- [🛠️ Deployment](#deployment)
  - [Deploying to the Internet Computer](#deploying-to-the-internet-computer)
- [🏃‍♂️ Running Locally](#running-locally)
- [⚙️ Frontend Environment Variables](#frontend-environment-variables)
- [📦 Dependencies](#dependencies)
  - [Backend Dependencies](#backend-dependencies)
  - [Frontend Dependencies](#frontend-dependencies)
- [🌐 Geolocation API](#geolocation-api)
- [🔄 Re-deployment Policy](#re-deployment-policy)
- [🛠️ For Developers](#for-developers)
- [📬 Contact Page](#contact-page)
- [📝 Credits](#credits)
- [📄 License](#license)

## Description

**Blockchain Bingo** is a decentralized application (dApp) that brings the classic game of Bingo to the blockchain. Leveraging the power of the Internet Computer, Bingo offers a secure and transparent platform where players can generate unique Bingo cards, participate in real-time games, and experience the thrill of winning without any centralized authority.

### 🎲 How It Works

1. **Authentication:** Players log in securely using Internet Identity.
2. **Card Generation:** Each player generates a unique 5x5 Bingo card with a free center space.
3. **Game Types:** Admins can choose between two win types:
   - **Standard:** Achieve five numbers in a row, column, or diagonal.
   - **Blackout:** Mark all numbers on your card.
4. **Gameplay:** Admins draw numbers sequentially, and all players' interfaces update in real-time.
5. **Winning:** Players can check their cards against called numbers to determine if they've won based on the selected game type.

## How to Play

1. **Login:** Use your Internet Identity to authenticate and join the game.
2. **Generate Your Card:** Click on the "View My Card" button to receive your unique Bingo card.
3. **Choose Game Type (Admin Only):** If you're the admin, select between **Standard** or **Blackout** win types before starting the game.
4. **Start the Game (Admin Only):** Begin the game, and the admin can start drawing numbers.
5. **Mark Your Numbers:** As numbers are drawn, mark them on your Bingo card.
6. **Check for Win:** Once enough numbers are drawn, use the "Check Bingo" button to see if you've won.
7. **Celebrate Victory:** If you meet the win condition, your Principal ID will be displayed as the winner, and the game will conclude.

## Features

- **Unique Bingo Cards:** Every player gets a distinct Bingo card for each game.
- **Multiple Win Types:** Choose between **Standard** and **Blackout** game modes.
- **Real-Time Updates:** Numbers drawn by the admin are instantly reflected across all players' interfaces.
- **Admin Controls:** Admins can start, reset, and control the flow of the game.
- **Secure Authentication:** Utilize Internet Identity for safe and secure user logins.
- **Transparent Gameplay:** All game actions and states are recorded on the blockchain for complete transparency.
- **Real-Time Chat Rooms:** Communicate and strategize with other players within the game's dedicated chat room.
- **ICP Balance Management:** View your ICP balance, transfer funds to other users, and manage your account seamlessly within the app.
- **Geoblocking:** Ensure compliance with regional regulations by enabling geoblocking, preventing unauthorized access to paid games.
- **Responsive Design:** Enjoy a seamless gaming experience across all devices, whether you're on a desktop, tablet, or mobile.
- **Audio Features:** Enable audio to hear numbers being called out during the game, enhancing the immersive experience.
- **Contact Page:** Reach out to the team or leave feedback through our integrated contact page.

## Game Types

**Blockchain Bingo** offers two exciting game types: **Standard** and **Blackout**. Each game type provides a unique Bingo experience tailored to different player preferences.

- **Standard Bingo:**
  - **Winning Criteria:** Achieve five numbers in a row horizontally, vertically, or diagonally.
  - **Gameplay:** Requires strategic placement and timely marking of numbers.

- **Blackout Bingo:**
  - **Winning Criteria:** Mark all squares on your Bingo card.
  - **Gameplay:** Offers a more challenging and rewarding experience for avid Bingo enthusiasts.

## What is ICP?

The **Internet Computer Protocol (ICP)** is a revolutionary blockchain technology that enables the creation of decentralized applications (dApps) with enhanced scalability, speed, and security. By leveraging ICP, **Blockchain Bingo** operates seamlessly on-chain, ensuring transparent game mechanics, secure transactions, and a trustless environment where players can enjoy Bingo without intermediaries.

## User Guides

### 🔑 Creating or Changing Your Username

Navigate to the **Chat Room** within any game and click on the **Create Username** or **Change Username** button. Follow the prompts to set or update your display name, enhancing your interaction within the community.

### 🎮 Hosting a Game

Hosting your own Bingo game is simple and rewarding. Follow these steps to set up a game that attracts players and offers enticing rewards:

1. **Choose a Game Name:** Select a unique and catchy name that reflects the theme or atmosphere of your game.
2. **Set the Entry Price:** Determine the price for each Bingo card. Remember, when you set the price in the Host Bingo screen, an additional **0.0002 ICP** is added to cover network fees required for user registration.
3. **Define the Host Percentage:** Decide on the percentage of the total pot you wish to retain as the host. This percentage is taken after a **2.5% service fee** is deducted from the total card price. For example, if you set a host percentage of **10%** on a card price of **1 ICP**, the service fee would be **0.025 ICP**, leaving **0.975 ICP**. Your host percentage would then be **0.0975 ICP**, and the remaining **0.8775 ICP** would be allocated as the prize pool for the winner.
4. **Create Private Games:** Enhance exclusivity by adding a password to your game. Players will need to enter this password before registering, ensuring only authorized participants can join.

By hosting a game, you not only create an engaging experience for players but also earn a share of the prize pool, making it a rewarding endeavor.

#### 💸 Financial Breakdown Example

- **Card Price:** 1 ICP
- **Additional ICP Fees:** 0.0002 ICP (covers two transactions at 0.0001 ICP each)
- **Service Fee (2.5%):** 0.025 ICP
- **Amount After Service Fee:** 0.975 ICP
- **Host Percentage (10%):** 0.0975 ICP
- **Prize Pool Allocation:** 0.8775 ICP

This ensures that both the host and the platform are fairly compensated while providing a substantial prize for the winner.

### 🔒 Creating Private Games

To create a private game, add a password during the game setup process in the Host Bingo screen. This password will be required for players to join the game, ensuring that only invited or authorized participants can register and play.

## Financial Breakdown

Understanding how funds are managed within **Blockchain Bingo** ensures transparency and trust. Here's a detailed breakdown of the financial aspects:

- **Additional ICP Fees:**
  - When setting the entry price for Bingo cards in the Host Bingo screen, an additional **0.0002 ICP** is added to the card price. This covers two separate transactions, each requiring a **0.0001 ICP** network fee, necessary for the registration process.

- **Service Fee:**
  - A **2.5%** service fee is deducted from the total card price each time a user registers for a game. This fee supports the maintenance and development of the platform.

- **Host Percentage:**
  - After the service fee is deducted, the host percentage is taken from the remaining amount. For example:
    - **Card Price:** 1 ICP
    - **Service Fee (2.5%):** 0.025 ICP
    - **Amount After Service Fee:** 0.975 ICP
    - **Host Percentage (10%):** 0.0975 ICP
    - **Prize Pool Allocation:** 0.8775 ICP
  - The remaining amount after both deductions forms the prize pool, which is awarded to the winner of the game.

- **Prize Pool Allocation:**
  - The accumulated prize pool is distributed to the winner(s) of the game. Additionally, hosts receive their designated percentage once the winner claims their winnings. This ensures that both hosts and winners are rewarded promptly.

- **Claiming Winnings:**
  - When a user presses the **Claim Winnings** button, two transactions are executed:
    1. A transaction directing the prize to the winner's ICP account.
    2. A transaction directing the host's percentage to their ICP account.
  - This dual-transaction system ensures fair and immediate distribution of rewards.

## Installation

### 🛠️ Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js:** Version 16.0.0 or higher
- **NPM:** Version 7.0.0 or higher
- **DFX SDK:** Version 0.24.0 or higher
- **Git:** For cloning the repository

### 💿 Clone the Repository

```bash
git clone https://github.com/yourusername/bingo.git
cd bingo
```

### 📦 Install Backend Dependencies

Navigate to the root directory and install the necessary dependencies.

```bash
npm install
```

### 📦 Install Frontend Dependencies

```bash
cd src/bingo_frontend
npm install
cd ../..
```

## Deployment

### Deploying to the Internet Computer

Follow these steps to deploy **Blockchain Bingo** to the Internet Computer:

1. **Start the DFX Replica:**

   Start the DFX local replica in the background.

   ```bash
   dfx start --background
   ```

2. **Deploy the Canisters:**

   Deploy both backend and frontend canisters.

   ```bash
   dfx deploy
   ```

3. **Generate Frontend Declarations:**

   After deployment, generate the frontend declarations to ensure the frontend has the latest interface.

   ```bash
   dfx generate
   ```

4. **Update Environment Variables:**

   Ensure that your `.env` file has the correct canister IDs as per the deployment.

5. **Deploy to the IC Network:**

   To deploy to the Internet Computer mainnet or a specific network, adjust your `dfx.json` and use the appropriate network flags.

   ```bash
   dfx deploy --network ic
   ```

6. **Access the Application:**

   Once deployed, your application will be available at:

   ```
   https://your-canister-id.ic0.app
   ```

   Replace `your-canister-id` with your actual frontend canister ID from `canister_ids.json`.

## Running Locally

If you want to test your project locally, follow these steps:

1. **Start the Replica:**

   ```bash
   dfx start --background
   ```

2. **Deploy the Canisters:**

   ```bash
   dfx deploy
   ```

3. **Generate Frontend Declarations:**

   ```bash
   dfx generate
   ```

4. **Start the Frontend Development Server:**

   Navigate to the frontend directory and start the development server.

   ```bash
   cd src/bingo_frontend
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000` and proxy API requests to the replica at port 4943.

## Frontend Environment Variables

When hosting the frontend outside of DFX, ensure that the application does not fetch the root key in production. You may need to adjust environment variables accordingly:

- **Set `DFX_NETWORK` to `ic`** if you are using a bundler like Webpack.
- **Use your preferred method** to replace `process.env.DFX_NETWORK` in the autogenerated declarations.
- **Configure `dfx.json`** by setting `canisters -> {asset_canister_id} -> declarations -> env_override` to replace `process.env.DFX_NETWORK` with a string.
- **Customize `createActor` constructor** as needed.

## Dependencies

### Backend Dependencies

Ensure that the backend canister has the following dependencies installed:

- **@dfinity/ledger-icp**: ^2.6.2
- **@dfinity/principal**: ^2.1.3
- **buffer**: ^6.0.3
- **process**: ^0.11.10
- **react-markdown**: ^9.0.1
- **rollup-plugin-node-polyfills**: ^0.2.1

### Frontend Dependencies

The frontend relies on the following dependencies:

- **@dfinity/auth-client**: ^2.1.2
- **@dfinity/ledger-icp**: ^2.6.2
- **@dfinity/utils**: ^2.6.0
- **@dfinity/candid**: ^2.1.3
- **react**: ^18.2.0
- **react-dom**: ^18.2.0
- **react-router-dom**: ^6.12.1
- **buffer**: ^6.0.3
- **process**: ^0.11.10

#### Development Dependencies

- **@types/react**: ^18.2.14
- **@types/react-dom**: ^18.2.6
- **@vitejs/plugin-react**: ^4.0.1
- **dotenv**: ^16.3.1
- **sass**: ^1.79.5
- **typescript**: ^5.1.3
- **vite**: ^4.3.9
- **vite-plugin-environment**: ^1.1.3
- **rollup-plugin-node-polyfills**: ^0.2.1
- **@esbuild-plugins/node-globals-polyfill**: ^0.2.3
- **rollup-plugin-polyfill-node**: ^0.13.0

Ensure all dependencies are installed by running `npm install` in both the root and frontend directories as outlined in the [Installation](#installation) section.

## Geolocation API

🌐 **Blockchain Bingo** relies on an IP location API for geolocation to enforce geoblocking, ensuring compliance with regional regulations. The application is configured to work with the current setup, providing a seamless experience while maintaining necessary access restrictions.

## Re-deployment Policy

You're welcome to **re-deploy Blockchain Bingo** as long as you adhere to the following conditions:

- **Service Fee Retention:** Ensure that the **2.5% service fee** for all card purchases remains intact when you deploy your version of the application. This fee supports the maintenance and development of the platform.
- **Credit Original Authors:** While not mandatory, it's encouraged to acknowledge the original creators to foster a collaborative community.

Feel free to customize and enhance the project to suit your needs, making it a great starting point for your own Internet Computer Protocol (ICP) Motoko projects.

## For Developers

**Blockchain Bingo** serves as an excellent example for developers looking to build their own ICP-based dApps. Explore the project's structure, smart contract logic, and frontend integration to gain insights and inspiration for your endeavors.

## Contact Page

**Blockchain Bingo** includes an integrated **Contact Page** where users can leave messages or feedback. These messages are accessible to admins through the authorized Principal ID in the `MenuScreen.jsx` file. If you have any questions, suggestions, or need support, feel free to reach out via the contact section within the app.

## Credits

This Bingo game was inspired and partially created by [RichardHery.com](https://3jorm-yqaaa-aaaam-aaa6a-cai.ic0.app/). Special thanks to the Internet Computer development community for their support and resources. IP address data powered by [IPinfo](https://ipinfo.io)

## License

This project is licensed under the [MIT License](LICENSE). You are free to **re-deploy and modify** the project as long as the **2.5% service fee** for all card purchases is retained. This ensures the sustainability and continuous improvement of **Blockchain Bingo**.

---

Feel free to reach out or contribute to the project! Let's make decentralized Bingo even more fun and engaging together.
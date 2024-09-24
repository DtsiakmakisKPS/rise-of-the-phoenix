# Rise of the Phoenix

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Code Structure](#code-structure)
  - [Client-Side (`public/main.js`)](#client-side-publicmainjs)
  - [Server-Side (`server/index.js`)](#server-side-serverindexjs)
  - [Server-Side Game Loop (`server/game-loop.js`)](#server-side-game-loop-servergame-loopjs)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Overview

Welcome to **Rise of the Phoenix**! This is a real-time multiplayer game where players compete to find and secure available seats within a dynamic office environment. The game features chair randomization each round, NPC interactions, and smooth player movements facilitated by Phaser.js and Socket.io.
Play the live game [here](https://rise-of-the-phoenix.up.railway.app/).
## Features

- **Real-Time Multiplayer:** Connect and play with multiple players simultaneously.
- **Dynamic Chair Allocation:** Chairs are randomized each round to ensure a fresh gameplay experience.
- **NPC Interactions:** Non-player characters (NPCs) occupy taken chairs, enhancing the game's realism.
- **Responsive Controls:** Intuitive player movement using keyboard inputs (WASD and arrow keys).
- **Game Phases:** Pre-game lobby, active gameplay, and game break phases to manage the game's flow.
- **Visual Feedback:** Players receive visual cues when they win or when the game resets.
- **Collision Detection:** Accurate collision handling between players, chairs, and walls.
- **HUD (Heads-Up Display):** Displays game status, timers, and feedback messages.

## Technologies Used

- **Phaser.js:** A fast, robust, and versatile 2D game framework for making HTML5 games.
- **Socket.io:** Enables real-time, bidirectional communication between web clients and servers.
- **Node.js:** JavaScript runtime built on Chrome's V8 JavaScript engine.
- **Express.js:** Fast, unopinionated, minimalist web framework for Node.js.
- **HTML/CSS:** For structuring and styling the game interface.
- **Prettier:** Code formatter to maintain consistent code style.

## Installation

### Prerequisites

- **Node.js:** Ensure you have Node.js installed. You can download it [here](https://nodejs.org/).
- **npm:** Node.js comes with npm. Verify installation by running `npm -v` in your terminal.

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/rise-of-the-phoenix.git
   ```
2. **Navigate to the Project Directory**
   ```bash
   cd rise-of-the-phoenix
   ```
3. **Install Server Dependencies**
   ```bash
   npm install
   ```
4. **Start the Server**
   ```bash
   npm start
   ```
5. **Access the Game**
   - Open your browser and navigate to `http://localhost:3000` (or the port specified in your server configuration).

## Usage

1. **Start the Server**
   ```bash
   npm start
   ```
2. **Access the Game**
   - Open your browser and navigate to `http://localhost:3000`.
3. **Join the Game**
   - Enter a username and join the lobby to start playing with other connected players.
4. **Gameplay**
   - Use **WASD** or **Arrow Keys** to move your character.
   - Navigate the lobby to find available seats.
   - Secure a seat to win the round.
   - Avoid or interact with NPCs occupying seats.

## Code Structure

### Client-Side (`public/main.js`)

This file manages the main game scenes using Phaser.js. It handles player creation, movement, chair and NPC interactions, and listens for server events to update the game state.

**Key Components:**

- **GameScene Class:**
  - Manages the primary game logic, including player and NPC management, collision handling, and game phase transitions.
  - Handles user input for movement and animations.
  - Communicates with the server to emit and listen for events like player movements and chair acquisitions.

- **HUD Class:**
  - Manages the Heads-Up Display, showing game status, timers, and feedback messages.
  - Listens to events from the `GameScene` to update the HUD accordingly.

- **Helper Functions:**
  - `capitalize(str)`: Capitalizes the first letter of a given string, used for loading sprite assets.


### Server-Side (`server/index.js`)

Handles server-side logic including player connections, disconnections, movement updates, and game phase transitions. Utilizes Socket.io for real-time communication with clients.

**Key Components:**

- **Player Management:**
  - Manages connected players, including adding and removing players upon connection and disconnection.

- **Game Phases:**
  - Controls the game loop with different phases: Pre-Game, Game, and Game Break.
  - Integrates with the `GameLoop` class to manage phase durations and transitions.

- **Event Handling:**
  - Listens for client events like `playerJoined`, `playerMovement`, and `chairFound` to update game state and broadcast changes.

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/YourFeatureName
   ```
3. **Commit Your Changes**
   ```bash
   git commit -m "Add some feature"
   ```
4. **Push to the Branch**
   ```bash
   git push origin feature/YourFeatureName
   ```
5. **Open a Pull Request**

Please ensure that your code follows the project's coding standards and includes appropriate comments and documentation.

## License

This project is licensed under the [MIT License](LICENSE).



---
*Enjoy playing **Rise of the Phoenix**! 🔥🪑🎮*


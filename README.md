# Phishgame: Learn to Spot Phishing Emails! 🎣

![Phishgame Logo](Logo.png)

## Overview

Phishgame is an engaging and educational game designed to teach users how to identify phishing emails. In a world where cyber threats are constantly evolving, this game provides a fun and interactive way to sharpen your phishing detection skills. Test your knowledge, improve your awareness, and become a phish-spotting pro!

## Features

*   **Interactive Gameplay:** Experience realistic email scenarios and make critical decisions.
*   **Educational Content:** Learn key indicators of phishing attempts.
*   **Difficulty Levels:** Progress from "Phish Noob" to "Phish Master" as your skills improve.
*   **Score Tracking:** Monitor your progress and see how well you're doing.
*   **Sound Effects:** Immersive sound effects to enhance the gaming experience.
*   **Statistics:** Learn interesting facts about phishing attacks.

## Table of Contents

- [Phishgame: Learn to Spot Phishing Emails! 🎣](#phishgame-learn-to-spot-phishing-emails-)
  - [Overview](#overview)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
  - [Project Structure](#project-structure)
  - [Key Components](#key-components)
  - [Customization](#customization)
  - [Troubleshooting](#troubleshooting)
  - [Contributing](#contributing)
  - [License](#license)

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js:** (Recommended version: >=18) [Download Node.js](https://nodejs.org/)
*   **npm:** (Usually comes with Node.js)
*   **Expo CLI:** Install globally using `npm install -g expo-cli`
*   **Python:** (Recommended version: >=3.6) [Download Python](https://www.python.org/downloads/)
*   **Expo Go:** Install on your iOS or Android device. [Expo Go](https://expo.dev/go)

## Installation

Follow these steps to set up the project locally:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Odinroast/HackNYUPhish.git
    cd Phishgame
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Install Python dependencies:**

    ```bash
    pip install pymongo dnspython
    ```

## Running the App

1.  **Start the Expo development server:**

    ```bash
    npm start
    ```

    This will open the Expo DevTools in your web browser.

2.  **Run on your device/emulator:**

    *   **Expo Go (Recommended):** Scan the QR code displayed in the Expo DevTools using the Expo Go app on your iOS or Android device.
    *   **Android Emulator:** If you have an Android emulator set up, you can press `a` in the terminal to run the app on the emulator.
    *   **iOS Simulator:** If you're on macOS, you can press `i` in the terminal to run the app on the iOS simulator.
    *   **Web Browser:** You can press `w` in the terminal to run the app in your web browser.

3.  **Start the backend server:**

    Open a new terminal and navigate to the project directory. Then, run the Python server:

    ```bash
    python server.py
    ```

## Project Structure

Here's an overview of the project's directory structure:

```
Phishgame/
├── app/                # Expo Router-based app code
│   ├── index.tsx       # Main entry point
│   └── ...
├── components/         # Reusable React components
│   ├── EmailsList.tsx  # Component for displaying emails
│   ├── TagsList.tsx    # Component for difficulty selection
│   └── ...
├── assets/             # Images, fonts, and other assets
│   ├── fonts/          # Custom fonts
│   ├── images/         # Images used in the app
│   └── ...
├── generated_phishing_emails.json # JSON file containing email data
├── server.py           # Python backend server
├── model.py            # Python model for generating email content
├── package.json        # npm dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Key Components

*   **`app/index.tsx`:** The main entry point of the Expo app. It handles the game's logic, state management, and UI rendering.
*   **`components/EmailsList.tsx`:** This component is responsible for displaying the list of emails and handling user interactions with them.
*   **`components/TagsList.tsx`:** This component allows users to select the difficulty level of the game.
*   **`server.py`:** The Python backend server that generates phishing emails and serves them to the Expo app.
*   **`model.py`:** Contains the logic for sampling and generating email content.
*   **`generated_phishing_emails.json`:** A JSON file containing a collection of pre-generated phishing emails.

## Customization

*   **Adding/Modifying Emails:** You can add or modify emails in the `generated_phishing_emails.json` file. Ensure the JSON structure is maintained.
*   **Styling:** Customize the app's appearance by modifying the styles in the `StyleSheet.create` blocks within the component files.
*   **Sound Effects:** Replace the sound files in the `assets/sounds/` directory to change the game's audio.
*   **Difficulty Levels:** Adjust the game's difficulty levels by modifying the logic in `TagsList.tsx` and the email generation in `server.py`.

## Troubleshooting

*   **"npm start" fails:**
    *   Ensure you have Node.js and npm installed correctly.
    *   Try deleting the `node_modules` folder and running `npm install` again.
*   **App crashes on device/emulator:**
    *   Check the Expo DevTools for error messages.
    *   Ensure your device/emulator is connected to the internet.
    *   Try restarting the Expo development server.
*   **Backend server errors:**
    *   Ensure you have Python and the required dependencies installed.
    *   Check the terminal output for error messages.
*   **Font loading issues:**
    *   Make sure the font file is correctly placed in the `assets/fonts/` directory.
    *   Verify the font name in the `useFonts` hook matches the font file name.

## Contributing

Contributions are welcome! If you'd like to contribute to the project, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, concise messages.
4.  Submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

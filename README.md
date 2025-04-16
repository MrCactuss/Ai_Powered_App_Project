# Liepāja Project: Visitation Tracker & Helper Bot

## Description

This project combines two main components:

1.  **A React Native mobile application (built with Expo)** that allows users to:
    * Track visitations by scanning location-specific QR codes.
    * Verify their location against stored coordinates to earn points.
    * Sign up and log in using Firebase Authentication.
    * Interact with the Liepāja Helper Bot via a chat interface.
2.  **A Python backend server (built with FastAPI)** that powers the Liepāja Helper Bot. This server uses the OpenAI Assistants API, enhanced with custom tools that leverage the Google Maps API and web scraping of the official Liepāja events calendar, to provide relevant local information.

## User App Features 
This app helps you explore and learn about Liepāja!

* **Track Your Visits & Earn Points:**
    * Discover designated locations around Liepāja featured in the app.
    * Visit these locations and scan their unique QR codes to check in.
    * The app verifies you're at the correct spot using your phone's location.
    * Earn points for every successful check-in and track your progress!

* **Get Help with the Liepāja Bot:**
    * Have questions about Liepāja? Ask the integrated chatbot!
    * **Find Places:** Ask things like "Where can I find a museum in the city center?" or "Show me pharmacies in Karosta".
    * **Get Place Details:** Ask for more info about a place found, like "Tell me more about the Liepāja Museum" or "What are the hours for [Restaurant Name]?".
    * **Get Directions:** Ask "How do I walk from the train station to the beach?".
    * **Check Travel Time:** Ask "How long does it take to drive from Peter's Market to the Olympic Centre?".
    * **Find Events:** Ask "What events are happening this weekend?" or "Any concerts today?".

* **Manage Your Account:**
    * Create your own account to save your visited locations and points.
    * Log in securely using your email and password.

## Features technical description

**Mobile App (React Native / Expo):**

* **Visitation Tracking:**
    * QR Code Scanning for location check-ins.
    * Location verification against database entries.
    * Points system for successful check-ins.
* **User Authentication:** Secure sign-up and login via Firebase Authentication.
* **Liepāja Helper Chatbot:** Integrated chat interface to query the backend assistant.

**Backend Server (Python / FastAPI):**

* **Conversational AI:** Employs OpenAI Assistants API (gpt-4o-mini model) for interaction.
* **Tool Integration:** The Assistant uses function calling to access external data sources.
* **Google Maps Tools:**
    * Finds places based on type and specified area (e.g., "cafes in city center").
    * Retrieves details for specific places (address, phone, hours, rating).
    * Provides directions between two named locations.
    * Calculates estimated travel time and distance between locations.
* **Liepāja Events Calendar:** Fetches upcoming events via web scraping from `kalendars.liepaja.lv`.
* **Conversation Threads:** Basic support for maintaining conversation context using OpenAI threads.

## Technology Stack

* **Frontend (Mobile App):**
    * React Native
    * Expo Framework
    * Firebase Authentication
    * React Navigation
    * `expo-camera` 
    * `expo-location` 
    * JavaScript / TypeScript
* **Backend (Server):**
    * Python (3.9+ recommended)
    * FastAPI
    * Uvicorn (ASGI Server)
    * OpenAI Python Library (`openai`)
    * Google Maps Services Python Client (`googlemaps`)
    * Requests
    * Beautiful Soup 4 (`beautifulsoup4`)
    * lxml (HTML Parser)
    * Pydantic
    * python-dotenv 

## Project Structure (Example)

```text
Projekt/  Main project folder
├── frontend/   <-- Expo app code
│   ├── app/
│   ├── src/
│   ├── assets/
│   ├── package.json
│   └── ...
│
└── backend/    <-- FastAPI server code
    ├── main.py
    ├── requirements.txt
    ├── .env 
    ├── venv/
    └── ...
```

## Setup Instructions

**Prerequisites:**

* Node.js (LTS version recommended) and npm (or yarn)
* Python 3.9 or later and `pip`
* Expo CLI installed globally (`npm install -g expo-cli`)
* An OpenAI API Key.
* A Google Cloud Platform project with the following APIs enabled and an API Key created:
    * Places API
    * Directions API
    * Distance Matrix API
* A Firebase project set up for Authentication.

**1. Backend Setup:**

a.  Navigate to the `backend` directory:
    ```bash
    cd path/to/Projekt/backend
    ```
b.  Create and activate a Python virtual environment:
    ```bash
    python -m venv venv
    # Windows: .\venv\Scripts\activate
    # macOS/Linux: source venv/bin/activate
    ```
c.  Install Python dependencies:
    ```bash
    # If requirements.txt exists and is up-to-date:
    pip install -r requirements.txt

    # Or if installing manually:
    pip install "fastapi[all]" openai googlemaps requests beautifulsoup4 lxml python-dotenv

    # Optional: Generate requirements.txt after manual install
    # pip freeze > requirements.txt
    ```
d.  Configure API Keys (CRITICAL):
    * Create a file named `.env` in the `backend` directory.
    * Add your API keys to the `.env` file:
        ```dotenv
        # .env file
        OPENAI_API_KEY="sk-proj-YOUR_OPENAI_API_KEY_HERE"
        GOOGLE_MAPS_API_KEY="AIzaSyYOUR_GOOGLE_MAPS_API_KEY_HERE"
        # OWM_API_KEY="YOUR_OPENWEATHERMAP_API_KEY" # Add if using weather tool
        ```
    * Ensure `main.py` loads keys using `os.getenv()` (requires `from dotenv import load_dotenv` and `load_dotenv()` at the top of the script).
    * **IMPORTANT:** Add the `.env` file to your project's `.gitignore` file.

**2. Frontend Setup:**

a.  Navigate to the `frontend` directory:
    ```bash
    cd path/to/Projekt/frontend
    ```
b.  Install Node dependencies:
    ```bash
    npm install
    # OR
    # yarn install
    ```
c.  Firebase Configuration:
    * Ensure your Firebase project configuration is correctly set up within the React Native app. Follow Firebase documentation for React Native/Expo setup, which typically involves adding `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) and potentially initializing Firebase in your app code.

## Running the Project

Both the backend server and the frontend app need to be running simultaneously.

**1. Run the Backend Server:**

a.  Open a terminal in the `backend` directory.
b.  Activate the virtual environment (`source venv/bin/activate` or `.\venv\Scripts\activate`).
c.  Start the server:
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
d.  Note the local network IP address your computer is using (e.g., `192.168.1.XXX`) if testing on a physical device.

**2. Run the Frontend App:**

a.  Open *another* terminal in the `frontend` directory.
b.  **Update Backend URL:** Edit the `backendUrl` variable in your chatbot screen file (e.g., `app/(tabs)/chatBot.tsx`) to point to your backend server's address (e.g., `http://192.168.1.XXX:8000/send-message/`, `http://10.0.2.2:8000/send-message/` for Android Emulator, `http://localhost:8000/send-message/` for iOS Simulator).
c.  **Start the app:**
    ```bash
    npx expo start
    ```
d.  Follow the Expo CLI instructions to open the app on your chosen device or simulator.
e.  **Note:** Depending on the exact native dependencies used (Firebase, Camera, Location), you might need to use an **Expo Development Build** instead of the standard Expo Go app. If you encounter native module errors in Expo Go, create a development build (`npx expo run:android` or `npx expo run:ios`) and start with `npx expo start --dev-client`.

## Testing User Credentials

* **Username:** cinkusr@inbox.lv
* **Password:** testing

## API Endpoints

* **`GET /`**
    * Description: Health check endpoint.
    * Response: `{"message": "Liepaja Chatbot Backend is running!"}`
* **`POST /send-message/`**
    * Description: Main endpoint for chatbot interaction.
    * Request Body (JSON):
        ```json
        {
          "message": "User's message text",
          "thread_id": "optional_string_id_of_existing_thread",
          "latitude": "optional_float_latitude",
          "longitude": "optional_float_longitude"
        }
        ```
    * Response Body (JSON):
        ```json
        {
          "thread_id": "string_id_of_thread_used_or_created",
          "reply": "The assistant's generated response text",
          "message_received": "The original user message text"
        }
        ```



# Liepāja Helper Bot Backend

## Description

This project provides the backend server for the Liepāja Helper Bot. It utilizes FastAPI as the web framework and leverages the OpenAI Assistants API for natural language processing and conversation management. The Assistant is equipped with custom tools that interact with the Google Maps API and perform web scraping on the Liepāja events calendar to provide relevant local information about Liepāja, Latvia.

## Features

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

* Python (3.9+ recommended)
* FastAPI
* Uvicorn (ASGI Server)
* OpenAI Python Library (`openai`)
* Google Maps Services Python Client (`googlemaps`)
* Requests
* Beautiful Soup 4 (`beautifulsoup4`)
* lxml (HTML Parser)
* Pydantic
* SQLite (Optional, for conversation history)
* python-dotenv (For environment variables)

## Setup Instructions

1.  **Prerequisites:** Ensure Python 3.9 or later and `pip` are installed.

2.  **Clone Repository:** Clone this repository to your local machine.
    ```bash
    # git clone <repository-url>
    cd path/to/backend # Navigate to the directory containing main.py
    ```

3.  **Create Virtual Environment:** It is highly recommended to use a virtual environment.
    ```bash
    python -m venv venv
    ```

4.  **Activate Virtual Environment:**
    * Windows: `.\venv\Scripts\activate`
    * macOS/Linux: `source venv/bin/activate`

5.  **Install Dependencies:**
    * If a `requirements.txt` file is provided:
        ```bash
        pip install -r requirements.txt
        ```
    * If installing manually:
        ```bash
        pip install "fastapi[all]" openai googlemaps requests beautifulsoup4 lxml python-dotenv
        # Add pandas if needed for other purposes
        ```
    * *(Optional: After manual install, generate requirements file: `pip freeze > requirements.txt`)*

6.  **API Key Configuration (CRITICAL):**
    * This application requires API keys from OpenAI and Google Cloud Platform (with Google Maps Places, Directions, and Distance Matrix APIs enabled).
    * Create a file named `.env` in the root of the `backend` directory.
    * Add your API keys to the `.env` file in the following format:
        ```dotenv
        # .env file
        OPENAI_API_KEY="sk-proj-YOUR_OPENAI_API_KEY_HERE"
        Maps_API_KEY="AIzaSyYOUR_Maps_API_KEY_HERE"
        # OWM_API_KEY="YOUR_OPENWEATHERMAP_API_KEY" # Add if using weather tool
        ```
    * The application uses `python-dotenv` to load these keys via `os.getenv()`. Make sure this loading mechanism is present in `main.py`.
    * **IMPORTANT:** Add the `.env` file to your project's `.gitignore` file to prevent accidentally committing your secret keys to version control.

7.  **Database (Optional):**
    * If conversation history persistence is enabled (check `main.py`), the SQLite database (`assistant_threads.db`) will be created automatically in the backend directory when the server first runs relevant database functions (like `create_tables`).

## Running the Server

1.  Ensure your virtual environment is activated (you should see `(venv)` in your terminal prompt).
2.  Make sure you are in the `backend` directory.
3.  Run the FastAPI application using Uvicorn:
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    * `--reload`: Enables auto-reload for development (server restarts on code changes).
    * `--host 0.0.0.0`: Makes the server accessible on your local network.
    * `--port 8000`: Specifies the port number.

The server should now be running and accessible (e.g., at `http://127.0.0.1:8000` or your local network IP).

## API Endpoints

* **`GET /`**
    * Description: Health check endpoint.
    * Response: `{"message": "Liepaja Chatbot Backend is running!"}`

* **`POST /send-message/`**
    * Description: Handles incoming user messages, interacts with the OpenAI Assistant and tools, and returns the bot's reply.
    * Request Body (JSON):
        ```json
        {
          "message": "User's message text",
          "thread_id": "optional_string_id_of_existing_thread"
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
* **`GET /conversation-history/`** (If Implemented)
    * Description: Retrieves stored message history for a given thread ID.
    * Query Parameter: `thread_id=<thread_id_string>`
    * Response Body (JSON): Contains `thread_id` and `conversation_history` list.

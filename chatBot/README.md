# Liepāja Helper Bot Backend

## Description

This project provides the backend server for the Liepāja Helper Bot. It's built using Python and FastAPI, leveraging the OpenAI Assistants API to handle conversations. The Assistant is equipped with custom tools that interact with the Google Maps API (Places, Directions, Distance Matrix) and perform web scraping on the official Liepāja events calendar to provide relevant local information.

## Features

* **Conversational AI:** Uses OpenAI Assistants API (gpt-4o-mini) for natural language interaction and conversation management (using threads).
* **Tool Integration:** The Assistant can use custom-built tools to fetch real-time or specific data.
* **Google Maps Tools:**
    * **Find Places:** Locates places (restaurants, shops, etc.) based on type within a specified text-based area in Liepāja (e.g., "city center", "Karosta").
    * **Get Place Details:** Retrieves detailed information for a specific place (address, phone, website, rating, hours).
    * **Get Directions:** Provides text-based driving, walking, transit, or bicycling directions between two named locations in Liepāja.
    * **Get Distance/Time:** Calculates estimated travel time and distance between two named locations in Liepāja.
* **Liepāja Events:**
    * Fetches upcoming events by scraping the official Liepāja events calendar website (`kalendars.liepaja.lv`).

## Technology Stack

* Python (3.9+ recommended)
* FastAPI (Web framework)
* Uvicorn (ASGI server)
* OpenAI Python Library (`openai`)
* Google Maps Services Python Client (`googlemaps`)
* Requests (HTTP library)
* Beautiful Soup 4 (`beautifulsoup4`) & `lxml` (Web scraping)
* Pydantic (Data validation - used by FastAPI)
* SQLite (Optional, for conversation history persistence)
* python-dotenv (Recommended for API key management)

## Setup and Installation

1.  **Clone/Download:** Obtain the project files and navigate into the `backend` directory.
    ```bash
    cd path/to/your/LiepajaChatbotProject/backend
    ```

2.  **Create Virtual Environment:** It's highly recommended to use a virtual environment.
    ```bash
    python -m venv venv
    ```

3.  **Activate Virtual Environment:**
    * Windows: `.\venv\Scripts\activate`
    * macOS/Linux: `source venv/bin/activate`

4.  **Install Dependencies:** Install the required Python packages.
    ```bash
    pip install "fastapi[all]" openai googlemaps requests beautifulsoup4 lxml python-dotenv
    # Add any other specific libraries if needed (e.g., pandas if re-introduced)
    ```
    *Tip: After installing, create a `requirements.txt` file for easy setup later:*
    `pip freeze > requirements.txt`
    *(Then others can just run `pip install -r requirements.txt`)*

5.  **API Keys:** This project requires API keys from OpenAI and Google Cloud Platform (with Maps APIs enabled).
    * **WARNING:** The current `main.py` might have keys hardcoded for study purposes. **This is insecure.** For any real use or sharing, you **must** use environment variables.
    * Create a file named `.env` in the `backend` directory.
    * Add your keys to the `.env` file:
        ```dotenv
        # .env file
        OPENAI_API_KEY="sk-proj-your-openai-key..."
        Maps_API_KEY="AIzaS..."
        # Add OWM_API_KEY="YOUR_KEY" if using weather
        ```
    * Ensure your `main.py` uses `os.getenv(...)` to load these keys (you might need to uncomment `from dotenv import load_dotenv` and `load_dotenv()` at the top of `main.py`).
    * **IMPORTANT:** Add the `.env` file to your `.gitignore` file to prevent accidentally committing your secret keys.

6.  **Database (Optional):** If using the SQLite database for conversation history, ensure the `create_tables()` function is called once when the server starts (it might already be in `main.py`). The `assistant_threads.db` file will be created in the `backend` directory.

## Running the Server

1.  Make sure your virtual environment is active (`(venv)` should be in your prompt).
2.  Navigate to the `backend` directory in your terminal.
3.  Run Uvicorn:
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    * `--reload`: Automatically restarts the server when code changes (useful for development).
    * `--host 0.0.0.0`: Makes the server accessible on your local network (needed for testing from physical devices or emulators sometimes).
    * `--port 8000`: Specifies the port number.

The server should now be running, typically at `http://127.0.0.1:8000`.

## API Endpoints

* **`GET /`**
    * Description: Root endpoint to check if the server is running.
    * Response: `{"message": "Liepaja Chatbot Backend is running!"}`

* **`POST /send-message/`**
    * Description: Main endpoint for interacting with the chatbot. Receives the user's message and conversation thread ID, processes it using the OpenAI Assistant and tools, and returns the bot's reply.
    * Request Body (JSON):
        ```json
        {
          "message": "Your message text",
          "thread_id": "optional_existing_thread_id_string_or_null"
        }
        ```
    * Response Body (JSON):
        ```json
        {
          "thread_id": "thread_id_used_or_created",
          "reply": "The assistant's response text",
          "message_received": "The original user message text"
        }
        ```
* **`GET /conversation-history/`** (If implemented)
    * Description: Retrieves message history for a given thread ID.
    * Query Parameter: `thread_id` (string).
    * Response Body (JSON): Contains `thread_id` and `conversation_history` list.
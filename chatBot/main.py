# main.py

# Importing libraries
import json
import openai
import time
import asyncio
# import pandas as pd # 
import requests
from bs4 import BeautifulSoup
from datetime import date, timedelta # For date calculations
import re

from fastapi import FastAPI, HTTPException 
from pydantic import BaseModel

import googlemaps
import os
# from dotenv import load_dotenv 

# //////////////////////////////////// AI TOOLS AND BASIC SETUP ///////////////////////////////////////////

# --- Replace with environment variables in a real project. ---

openai.api_key = "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"
MAPS_API_KEY = "AIzaSyBwJbcCFeDSE7pjJSahEaz0-B9bpdpKYGM" 

# Define the tools (API calls)
tools = [
    {
        "type": "function",
        "function": {
            "name": "find_places_in_liepaja",
            "description": "Searches for specific types of places (e.g., restaurants, shops, cafes, museums) within a specified area or near a landmark in Liepāja, Latvia. Useful for queries like 'where can I find X' or 'are there any Y near Z'.",
            "parameters": {
                "type": "object", "properties": {
                    "place_type": { "type": "string", "description": "The type of place to search for (e.g., 'pizza restaurant', 'cafe', 'supermarket', 'pharmacy', 'beach access'). Be specific." },
                    "area": { "type": "string", "description": "Optional. The specific area or landmark in Liepāja to search near (e.g., 'city center', 'Jūrmalas Park', 'Karosta', 'Peter's Market'). If not specified, assumes a general city search." }
                }, "required": ["place_type"]
            }
        }
    },
    { 
        "type": "function",
        "function": {
            "name": "get_place_details",
            "description": "Gets detailed information (like phone number, website, opening hours, rating) for a specific place name in Liepāja, usually after finding it with 'find_places_in_liepaja'.",
            "parameters": {
                "type": "object", "properties": {
                    "place_name": { "type": "string", "description": "The name of the specific place in Liepāja to get details for." },
                    "address": { "type": "string", "description": "Optional. The address of the place, if known, to help find the exact match." }
                }, "required": ["place_name"]
            }
        }
    },
    { 
        "type": "function",
        "function": {
            "name": "get_directions",
            "description": "Provides text-based directions between two locations or addresses within Liepāja.",
            "parameters": {
                "type": "object", "properties": {
                    "origin": { "type": "string", "description": "The starting point address or landmark in Liepāja." },
                    "destination": { "type": "string", "description": "The destination address or landmark in Liepāja." },
                    "mode": { "type": "string", "description": "Optional mode of transport. Defaults to 'driving'. Options: 'driving', 'walking', 'bicycling', 'transit'." }
                }, "required": ["origin", "destination"]
            }
        }
    },
    { 
        "type": "function",
        "function": {
            "name": "get_distance_time",
            "description": "Calculates the estimated travel distance and duration between two locations in Liepāja.",
             "parameters": {
                "type": "object", "properties": {
                    "origin": { "type": "string", "description": "The starting point address or landmark in Liepāja." },
                    "destination": { "type": "string", "description": "The destination address or landmark in Liepāja." },
                    "mode": { "type": "string", "description": "Optional mode of transport. Defaults to 'driving'. Options: 'driving', 'walking', 'bicycling', 'transit'." }
                }, "required": ["origin", "destination"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_liepaja_events",
            "description": "Fetches upcoming events listed in the official Liepāja events calendar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date_range": {
                        "type": "string",
                        "description": "Optional. Specify the time frame, e.g., 'today', 'this week', 'this weekend', 'next 7 days'. Defaults to upcoming events."
                    },
                    "category": {
                        "type": "string",
                        "description": "Optional. Filter events by category if possible (e.g., 'concerts', 'exhibitions', 'sports')."
                    }
                },
                "required": [] 
            }
        }
    }
]

# Initialize clients (with error handling)
assistant = None
if openai.api_key:
    try:
        assistant = openai.beta.assistants.create(
            name="Liepāja Helper Bot",
            instructions="You are a helpful assistant focused on providing information about Liepāja, Latvia. Use the available tools to answer questions about locations and local information. Be concise and helpful.",
            model="gpt-4o-mini",
            tools=tools
        )
        print(f"OpenAI Assistant created/retrieved with ID: {assistant.id}")
    except Exception as e:
        print(f"CRITICAL ERROR creating OpenAI assistant: {e}")
else:
    print("CRITICAL ERROR: OpenAI API Key is missing!")

gmaps = None
if MAPS_API_KEY:
    try:
        gmaps = googlemaps.Client(key=MAPS_API_KEY)
        print("Google Maps client initialized.")
    except Exception as e:
        print(f"ERROR initializing Google Maps client: {e}")
else:
    print("ERROR: Google Maps API Key is missing!")

# Define coordinates for Liepāja (approx center)
LIEPAJA_COORDS = (56.5107, 21.0106)

# //////////////////////////////////////// TOOL FUNCTIONS /////////////////////////////////////////////////

# --- Function to strip basic HTML tags ---
def strip_html(text):
    if not text: return ""
    return re.sub('<[^<]+?>', '', text)

def find_places_in_liepaja(place_type: str, area: str = "Liepāja"):
    """
    Finds places using Google Maps Places API based on type and area within Liepāja.
    """
    print(f"Tool Function: Finding '{place_type}' in area '{area}'")
    if not gmaps:
         return "Error: Google Maps client is not available on the server."
    try:
        search_query = f"{place_type} in {area}, Liepāja, Latvia"
        # Use Text Search for flexibility
        places_result = gmaps.places(query=search_query, language='en')

        if places_result.get('status') == 'OK' and places_result.get('results'):
            results = places_result['results']
            output_lines = [f"Found these '{place_type}' options near '{area}':"]
            for i, place in enumerate(results[:3], 1): # Limit to top 3
                name = place.get('name', 'N/A')
                address = place.get('vicinity', place.get('formatted_address', 'N/A'))
                rating = place.get('rating', 'N/A')
                output_lines.append(f"{i}. {name} at {address} (Rating: {rating})")
            if len(results) > 3:
                 output_lines.append("There might be more options available.")
            return "\n".join(output_lines)
        elif places_result.get('status') == 'ZERO_RESULTS':
            return f"Sorry, I couldn't find any '{place_type}' matching your search near '{area}' in Liepāja."
        else:
            print(f"Google Maps API Error Status: {places_result.get('status')}")
            return f"Sorry, there was an issue searching for places (Status: {places_result.get('status')}). Check API key/quota?"
    except Exception as e:
        print(f"Error calling Google Maps API: {e}")
        return "Sorry, I encountered an error while searching for places."
    
def get_place_details(place_name: str, address: str = None):
    """Gets details for a specific place using Google Maps Places API."""
    print(f"Tool Function: Getting details for '{place_name}'" + (f" at '{address}'" if address else ""))
    if not gmaps: return "Error: Google Maps client is not available."

    try:
        query = f"{place_name} in Liepāja, Latvia"
        if address: query = f"{place_name}, {address}, Liepāja, Latvia"

        find_result = gmaps.places(query=query, language='en')

        if not (find_result.get('status') == 'OK' and find_result.get('results')):
            print(f"GMaps Find Error Status: {find_result.get('status')}")
            return f"Sorry, I couldn't find a unique place matching '{place_name}'" + (f" at '{address}'" if address else "") + "."

        # Assume the first result is the best match (could be improved)
        place_id = find_result['results'][0].get('place_id')
        if not place_id: return "Sorry, couldn't get a place ID to fetch details."

        print(f"  Found place_id: {place_id}")

        # Get details using the place_id
        fields = ['name', 'formatted_address', 'international_phone_number',
                  'website', 'opening_hours', 'rating', 'user_ratings_total']
        details_result = gmaps.place(place_id=place_id, fields=fields, language='en')

        if details_result.get('status') == 'OK':
            place = details_result.get('result', {})
            details = [f"Details for {place.get('name', place_name)}:"]
            if place.get('formatted_address'): details.append(f"- Address: {place.get('formatted_address')}")
            if place.get('international_phone_number'): details.append(f"- Phone: {place.get('international_phone_number')}")
            if place.get('website'): details.append(f"- Website: {place.get('website')}")
            if place.get('rating'): details.append(f"- Rating: {place.get('rating')} ({place.get('user_ratings_total', 0)} reviews)")
            if 'opening_hours' in place and place['opening_hours'].get('weekday_text'):
                details.append("- Opening Hours:")
                details.extend([f"  {line}" for line in place['opening_hours']['weekday_text']])
            elif 'opening_hours' in place:
                 details.append(f"- Open Now: {'Yes' if place['opening_hours'].get('open_now') else 'No'}")

            return "\n".join(details)
        else:
            print(f"GMaps Details Error Status: {details_result.get('status')}")
            return f"Sorry, couldn't fetch details. Status: {details_result.get('status')}"

    except Exception as e:
        print(f"Error getting place details: {e}")
        return "Sorry, an error occurred while fetching place details."

def get_directions(origin: str, destination: str, mode: str = 'driving'):
    """Gets directions using Google Maps Directions API."""
    print(f"Tool Function: Getting directions from '{origin}' to '{destination}' by {mode}")
    if not gmaps: return "Error: Google Maps client is not available."

    # Append city/country for better geocoding by Google
    origin_full = f"{origin}, Liepāja, Latvia"
    destination_full = f"{destination}, Liepāja, Latvia"
    valid_modes = ['driving', 'walking', 'bicycling', 'transit']
    if mode.lower() not in valid_modes: mode = 'driving' # Default to driving if mode is invalid

    try:
        directions_result = gmaps.directions(origin_full, destination_full, mode=mode.lower(), language='en')

        if directions_result: # API returns a list of routes
            route = directions_result[0] # Get the first route
            leg = route['legs'][0] # Get the first leg of the route
            duration = leg['duration']['text']
            distance = leg['distance']['text']

            summary = f"Directions from {origin} to {destination} by {mode} ({duration}, {distance}):"
            steps = [summary]
            # Get first few steps (strip HTML tags)
            for i, step in enumerate(leg['steps'][:3], 1): # Limit to 3 steps for brevity
                 instruction = strip_html(step['html_instructions'])
                 steps.append(f"{i}. {instruction} ({step['distance']['text']})")
            if len(leg['steps']) > 3: steps.append("...") # Indicate more steps exist

            return "\n".join(steps)
        else:
            return f"Sorry, couldn't find directions from '{origin}' to '{destination}' by {mode}."

    except Exception as e:
        print(f"Error getting directions: {e}")
        return "Sorry, an error occurred while fetching directions."

def get_distance_time(origin: str, destination: str, mode: str = 'driving'):
    """Gets distance and travel time using Google Maps Distance Matrix API."""
    print(f"Tool Function: Getting distance/time from '{origin}' to '{destination}' by {mode}")
    if not gmaps: return "Error: Google Maps client is not available."

    origin_full = f"{origin}, Liepāja, Latvia"
    destination_full = f"{destination}, Liepāja, Latvia"
    valid_modes = ['driving', 'walking', 'bicycling', 'transit']
    if mode.lower() not in valid_modes: mode = 'driving'

    try:
        matrix_result = gmaps.distance_matrix(origins=[origin_full], destinations=[destination_full], mode=mode.lower(), language='en')

        if matrix_result.get('status') == 'OK' and matrix_result['rows'][0]['elements'][0].get('status') == 'OK':
            element = matrix_result['rows'][0]['elements'][0]
            duration = element['duration']['text']
            distance = element['distance']['text']
            return f"Estimated travel time from {origin} to {destination} by {mode} is {duration} ({distance})."
        elif matrix_result.get('status') == 'OK' and matrix_result['rows'][0]['elements'][0].get('status') == 'ZERO_RESULTS':
             return f"Could not calculate route between {origin} and {destination} by {mode}."
        else:
            print(f"GMaps Matrix Error Status: {matrix_result.get('status')}, Element Status: {matrix_result['rows'][0]['elements'][0].get('status')}")
            return f"Sorry, couldn't calculate distance/time. Status: {matrix_result.get('status')}"

    except Exception as e:
        print(f"Error getting distance matrix: {e}")
        return "Sorry, an error occurred while calculating distance/time."
    
def get_liepaja_events(date_range: str = "next_7_days", category: str = None):
    """
    Fetches upcoming events from the Liepāja event calendar website by scraping.
    date_range options: 'today', 'tomorrow', 'this_weekend', 'next_7_days', etc.
    """
    print(f"Tool Function: Getting events for date_range '{date_range}'")

    # --- Calculate Date Range ---
    today = date.today()
    start_date = today
    end_date = today + timedelta(days=7) # Default: next 7 days

    # ... (Date calculation logic remains the same) ...
    if date_range == "today": end_date = start_date
    elif date_range == "tomorrow": start_date = today + timedelta(days=1); end_date = start_date
    elif date_range == "this_weekend": start_date = today + timedelta(days=(5 - today.weekday() + 7) % 7); end_date = start_date + timedelta(days=1)
    elif date_range == "next_7_days": end_date = today + timedelta(days=6)

    start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')
    print(f"  Date range calculated: {start_date_str} to {end_date_str}")

    # --- Construct URL ---
    base_url = "https://kalendars.liepaja.lv/lv/"
    target_url = f"{base_url}page:1,date_from:{start_date_str},date_until:{end_date_str},a:f"
    print(f"  Fetching URL: {target_url}")

    try:
        # --- Fetch HTML ---
        headers = {'User-Agent': 'LiepajaStudyBot/1.0 (+http://example.com)'}
        response = requests.get(target_url, headers=headers, timeout=10)
        response.raise_for_status()

        # --- Parse HTML ---
        soup = BeautifulSoup(response.content, 'lxml')

        # --- Find Event Elements using the CORRECTED selector ---
        event_item_selector = '.events.list li' # <--- UPDATED SELECTOR
        event_elements = soup.select(event_item_selector)
        # -------------------------------------------------------
        print(f"  Found {len(event_elements)} elements matching '{event_item_selector}'.")

        if not event_elements:
            return f"No event list items found on the calendar page for {start_date_str} to {end_date_str} using selector '{event_item_selector}'."

        extracted_events = []
        for event_li in event_elements[:5]: # Limit to first 5 events
            try:
                # --- Use the class names within each 'li' ---
                title_element = event_li.select_one('.title')
                date_element = event_li.select_one('.event-date')
                location_element = event_li.select_one('.event-place')
                fee_element = event_li.select_one('.event-fee')
                # ------------------------------------------

                title = title_element.get_text(strip=True) if title_element else "N/A"
                # Combine date/time/place extraction, clean up whitespace
                date_str = date_element.get_text(separator=' ', strip=True) if date_element else "N/A"
                location = location_element.get_text(strip=True) if location_element else "N/A"
                fee = fee_element.get_text(strip=True) if fee_element else None

                if title != "N/A":
                    event_data = { "title": title, "date": date_str, "location": location }
                    if fee: event_data["fee"] = fee
                    extracted_events.append(event_data)

            except Exception as extract_error:
                print(f"  Error extracting details from one event element: {extract_error}")
                continue

        # --- Format Output ---
        if not extracted_events:
             return f"Found event list items but couldn't extract details for {start_date_str} to {end_date_str}."

        output_lines = [f"Upcoming Events in Liepāja ({start_date_str} to {end_date_str}):"]
        for i, ev in enumerate(extracted_events, 1):
             fee_info = f" ({ev['fee']})" if 'fee' in ev else ""
             # Improved formatting for date/time which might be multiline
             output_lines.append(f"{i}. {ev['title']} [{ev['date']}] at {ev['location']}{fee_info}")

        if len(event_elements) > 5:
             output_lines.append("...")

        return "\n".join(output_lines)

    except requests.exceptions.RequestException as req_err: # ...
        print(f"Error fetching event page: {req_err}")
        return "Sorry, I couldn't connect to the Liepāja event calendar right now."
    except Exception as e: # ...
        print(f"Error processing events: {e}")
        return "Sorry, an error occurred while processing events."


# /////////////////////////////////////// FUNCTION TO WORK WITH ASSISTANT //////////////////////////////////////////////////

def handle_user_query_with_assistant(user_input: str, thread_id: str | None = None):
    """
    Handles interaction with the OpenAI assistant, including tool calls,
    using an existing thread ID if provided, or creating a new one.
    Returns a dictionary containing the answer and the thread_id used.
    """
    if not assistant or not openai.api_key:
         return {"answer": "Error: OpenAI Assistant is not configured correctly.", "thread_id": thread_id}

    current_thread_id = thread_id
    try:
        # --- Thread Creation/Re-use ---
        if current_thread_id:
            print(f"Reusing existing thread: {current_thread_id}")
            try:
                # Verify thread exists before proceeding
                thread = openai.beta.threads.retrieve(current_thread_id)
            except Exception as thread_error:
                 print(f"Failed to retrieve thread {current_thread_id}, creating new one. Error: {thread_error}")
                 current_thread_id = None # Force creation
        if not current_thread_id:
            thread_object = openai.beta.threads.create()
            current_thread_id = thread_object.id
            print(f"Created new thread: {current_thread_id}")
        # -----------------------------

        openai.beta.threads.messages.create(
            thread_id=current_thread_id, role="user", content=user_input
        )
        run = openai.beta.threads.runs.create(
            thread_id=current_thread_id, assistant_id=assistant.id
        )

        # Wait loop (consider adding a maximum timeout)
        max_wait_time = 60 # seconds
        start_time = time.time()
        while run.status in ["queued", "in_progress", "cancelling"]:
            if time.time() - start_time > max_wait_time:
                 print("Run timed out.")
                 # Try to cancel the run
                 try: openai.beta.threads.runs.cancel(thread_id=current_thread_id, run_id=run.id)
                 except: pass # Ignore cancel error if already finished/failed
                 return {"answer": "Sorry, the request took too long to process.", "thread_id": current_thread_id}

            time.sleep(1)
            run = openai.beta.threads.runs.retrieve(thread_id=current_thread_id, run_id=run.id)
            print(f"Run status: {run.status}")

        # Handle Tool Calls
        if run.status == "requires_action":
            print("Run requires action...")
            tool_outputs = []
            if run.required_action and run.required_action.type == "submit_tool_outputs":
                for tool_call in run.required_action.submit_tool_outputs.tool_calls:
                    function_args = json.loads(tool_call.function.arguments) if tool_call.function.arguments else {}
                    output = "Function not recognized"

                    # --- Call appropriate function based on name ---
                    if tool_call.function.name == "find_places_in_liepaja":
                        print("  Calling find_places_in_liepaja tool")
                        place_type = function_args.get("place_type", "")
                        area = function_args.get("area", "Liepāja")
                        output = find_places_in_liepaja(place_type=place_type, area=area)

                    elif tool_call.function.name == "get_place_details": 
                        print("  Calling get_place_details tool")
                        place_name = function_args.get("place_name", "")
                        address = function_args.get("address") 
                        output = get_place_details(place_name=place_name, address=address)

                    elif tool_call.function.name == "get_directions": 
                        print("  Calling get_directions tool")
                        origin = function_args.get("origin", "")
                        destination = function_args.get("destination", "")
                        mode = function_args.get("mode", "driving")
                        output = get_directions(origin=origin, destination=destination, mode=mode)

                    elif tool_call.function.name == "get_distance_time": 
                        print("  Calling get_distance_time tool")
                        origin = function_args.get("origin", "")
                        destination = function_args.get("destination", "")
                        mode = function_args.get("mode", "driving")
                        output = get_distance_time(origin=origin, destination=destination, mode=mode)

                    elif tool_call.function.name == "get_liepaja_events": 
                        print("  Calling get_liepaja_events tool")
                        date_range = function_args.get("date_range", "next_7_days") # Default if not specified by MI
                        category = function_args.get("category") 
                        output = get_liepaja_events(date_range=date_range, category=category)

                    else:
                        print(f"Unknown function call requested: {tool_call.function.name}")
                    # ------------------------------------------------

                    print(f"  Tool Output: {output[:200]}...")
                    tool_outputs.append({"tool_call_id": tool_call.id, "output": str(output)})

                # Submit outputs
                run = openai.beta.threads.runs.submit_tool_outputs(
                    thread_id=current_thread_id, run_id=run.id, tool_outputs=tool_outputs
                )
                # Wait again
                start_time = time.time() # Reset timeout start
                while run.status in ["queued", "in_progress", "cancelling"]:
                     if time.time() - start_time > max_wait_time:
                         print("Run timed out after tool submission.")
                         try: openai.beta.threads.runs.cancel(thread_id=current_thread_id, run_id=run.id)
                         except: pass
                         return {"answer": "Sorry, the request took too long after using a tool.", "thread_id": current_thread_id}
                     time.sleep(1)
                     run = openai.beta.threads.runs.retrieve(thread_id=current_thread_id, run_id=run.id)
                     print(f"Run status after tool submission: {run.status}")
            else:
                 print("Error: requires_action but no valid action found.")
                 return {"answer": "Error processing required action.", "thread_id": current_thread_id}

        # Final Response Check
        final_answer = "Sorry, an unexpected error occurred."
        if run.status == "completed":
            messages_response = openai.beta.threads.messages.list(thread_id=current_thread_id, order="desc", limit=1)
            if messages_response.data and messages_response.data[0].content:
                 content_item = messages_response.data[0].content[0]
                 if hasattr(content_item, 'text') and hasattr(content_item.text, 'value'):
                     final_answer = content_item.text.value
                 else: final_answer = "Received unexpected response format from AI."
            else: final_answer = "Could not retrieve response from AI."
        elif run.status == "failed":
            error_message = run.last_error.message if hasattr(run, 'last_error') and run.last_error else "Unknown failure reason."
            print(f"Run failed! Error: {error_message}")
            final_answer = f"Sorry, the request failed." # Keep user message simpler
        else:
            print(f"Run ended with unexpected status: {run.status}")
            final_answer = f"Sorry, the process ended unexpectedly."

        return {"answer": final_answer, "thread_id": current_thread_id}

    except Exception as e:
        print(f"An error occurred in handle_user_query_with_assistant: {e}")
        return {"answer": "An internal server error occurred while processing your request.", "thread_id": current_thread_id}


# ////////////////////////////// FASTAPI APP AND ENDPOINTS /////////////////////////////////

app = FastAPI()

# Request Body Model
class ChatRequest(BaseModel):
    message: str
    thread_id: str | None = None

# --- Send Message Endpoint ---
@app.post("/send-message/")
async def process_message_and_respond(request: ChatRequest):
    user_message = request.message
    received_thread_id = request.thread_id

    try:
        result = await asyncio.to_thread(handle_user_query_with_assistant, user_message, received_thread_id) # Run synchronous OpenAI calls in a threadpool
        # result = handle_user_query_with_assistant(user_message, received_thread_id) # If using OpenAI async client v1.0+

        assistant_response = result.get("answer", "Error: No answer found.")
        current_thread_id = result.get("thread_id")

        return {
            "thread_id": current_thread_id,
            "reply": assistant_response,
            "message_received": user_message
        }
    except Exception as e:
         print(f"Error in FastAPI endpoint /send-message/: {e}")
         # Return a generic error response
         raise HTTPException(status_code=500, detail="Internal Server Error processing message")


# --- Conversation History Endpoint ---
@app.get("/conversation-history/")
async def conversation_history(thread_id: str):
     # ... (Implement if needed using SQLite) ...
     return {"detail": "Not implemented yet"}



# --- Simple root endpoint for testing ---
@app.get("/")
async def root():
    return {"message": "Liepaja Chatbot Backend is running!"}
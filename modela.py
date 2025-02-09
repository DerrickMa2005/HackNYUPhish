import os
import time
import json
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from openai import OpenAI
from openai import OpenAIError, RateLimitError, APIConnectionError, APIError

# ------------------------------
# OpenAI Client Setup
# ------------------------------
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# ------------------------------
# MongoDB Connection Setup
# ------------------------------
# Using a connection URI for clarity.
mongo_uri = "mongodb+srv://Jigsawtemmy20:Password123@cluster0.vetz9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

try:
    # Set a short timeout for testing the connection
    mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    # Force a connection attempt by requesting server info.
    mongo_client.server_info()
    # Connect to the 'emails' database.
    db = mongo_client['emails']
    print("Connected to MongoDB. Collections found:", db.list_collection_names())
except ServerSelectionTimeoutError as err:
    print("Error: Unable to connect to MongoDB. Please make sure MongoDB is running on localhost:27017.")
    print(err)
    exit(1)  # Stop execution if the DB is not available

# Define your collections.
emails_collection = db['emails']
urls_collection = db['urls']
urls2_collection = db['urls2']

# ------------------------------
# Helper Functions
# ------------------------------
def fetch_random_document(collection):
    """
    Fetch a random document from the given collection.
    If the collection is empty, return an empty dict.
    """
    cursor = collection.aggregate([{"$sample": {"size": 1}}])
    doc = next(cursor, None)
    if doc is None:
        print(f"Warning: Collection '{collection.name}' is empty. Using default values.")
        return {}
    return doc

def generate_email_prompt(difficulty: str) -> str:
    """
    Builds a prompt for generating a phishing email using inspiration data from MongoDB.
    """
    # Get a random document from each collection.
    sample_email  = fetch_random_document(emails_collection)
    sample_url    = fetch_random_document(urls_collection)
    sample_target = fetch_random_document(urls2_collection)
    
    # Extract fields (ensure these keys match your MongoDB documents).
    sample_email_text  = sample_email.get("Email Text", "No sample text available")
    sample_email_type  = sample_email.get("Email Type", "Unknown")
    sample_url_text    = sample_url.get("URL", "http://example.com")
    sample_domain      = sample_url.get("Domain", "example.com")
    sample_target_name = sample_target.get("target", "Unknown Company")

    prompt = f"""
Using the following inspiration data, generate a phishing email with a subject, greeting, body, 
and a call-to-action that includes a link. The email should be under 200 words.

--- Inspiration Data ---
Phishing Email Example:
Email Text: "{sample_email_text}"
Email Type: "{sample_email_type}"

Phishing URL Data:
URL: "{sample_url_text}"
Domain: "{sample_domain}"

Phishtank Data:
Target (Company/Brand): "{sample_target_name}"

--- Email Difficulty Instructions ---
Difficulty Level: "{difficulty}"
Instructions:
- For "phishnoob": Generate an email with very obvious mistakes and red flags (e.g., poor grammar, 
  misspellings, and clumsily formatted links).
- For "phishmediate": Generate an email that is moderately deceptive. It should appear realistic 
  but include some subtle cues indicating it’s a phishing attempt.
- For "phishmaster": Generate a highly convincing email that closely mimics legitimate communications, 
  with only the slightest hints that it is a phishing attempt.

Please generate the phishing email now.
"""
    return prompt.strip()

def call_openai_chat(prompt: str, max_tokens: int, temperature: float) -> str:
    """
    Calls the OpenAI Chat API to generate text given a user prompt.
    Retries on certain errors.
    """
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo-0125",  # Change this model as needed.
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content.strip()
        except (RateLimitError, APIConnectionError) as e:
            print(f"Attempt {attempt + 1} failed with error: {e}")
            if attempt < max_attempts - 1:
                print("Retrying in 5 seconds...")
                time.sleep(5)
        except APIError as e:
            raise e
    raise RuntimeError("Failed to get response from OpenAI after multiple attempts.")

def generate_emails_for_difficulty(difficulty: str, num_emails: int = 10):
    """
    Generates phishing emails based on MongoDB inspiration data for a given difficulty.
    """
    settings = {
        "phishnoob":   {"max_tokens": 200, "temperature": 0.9},
        "phishmediate": {"max_tokens": 250, "temperature": 0.8},
        "phishmaster": {"max_tokens": 300, "temperature": 0.7},
    }
    config = settings.get(difficulty, {"max_tokens": 250, "temperature": 0.8})
    max_tokens = config["max_tokens"]
    temperature = config["temperature"]
    
    emails = []
    print(f"\nGenerating {num_emails} emails for difficulty: '{difficulty}'...\n")
    
    for i in range(num_emails):
        prompt = generate_email_prompt(difficulty)
        email_text = call_openai_chat(prompt, max_tokens, temperature)
        emails.append(email_text)
        print(f"=== Generated Email {i+1} for '{difficulty}' ===")
        print(email_text)
        print("=" * 60, "\n")
        time.sleep(1)  # Delay to reduce rapid API calls.
    
    return emails

# ------------------------------
# Main Execution
# ------------------------------
if __name__ == "__main__":
    phishnoob_emails   = generate_emails_for_difficulty("phishnoob", num_emails=10)
    phishmediate_emails = generate_emails_for_difficulty("phishmediate", num_emails=10)
    phishmaster_emails = generate_emails_for_difficulty("phishmaster", num_emails=10)

    # Combine all emails into a dictionary.
    all_emails = {
        "phishnoob":   phishnoob_emails,
        "phishmediate": phishmediate_emails,
        "phishmaster":  phishmaster_emails
    }
    
    # Save the generated emails to a JSON file.
    with open("generated_phishing_emails.json", "w", encoding="utf-8") as f:
        json.dump(all_emails, f, indent=4, ensure_ascii=False)
    
    print("All emails generated and saved to 'generated_phishing_emails.json'.")

import os
import time
import json
import random
import difflib
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from openai import OpenAI
from openai import RateLimitError, APIConnectionError, APIError

###############################################################################
#                          CONFIG & CONSTANTS
###############################################################################
NUM_EMAILS_PER_DIFFICULTY = 10

RECENT_CALL_TIMES = []

# We'll choose a random number (2-4) of phish emails per difficulty.
# The rest will be non-phish, up to a total of 10.
DIFFICULTY_PENALTIES = {
    "phishnoob":     ((5, 10), (1, 2)), 
    "phishdisciple": ((10, 15), (1, 3)),
    "phishmaster":   ((15, 25), (3, 5))
}

# GPT settings
GPT_MODEL = "gpt-4o-mini"
MAX_TOKENS = 2000  
TEMPERATURE = 0.7

###############################################################################
#                        SETUP OPENAI CLIENT
###############################################################################
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

###############################################################################
#                        SETUP MONGODB CONNECTION
###############################################################################
# Update the connection URI as needed.
mongo_uri = "mongodb+srv://Jigsawtemmy20:Password123@cluster0.vetz9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
try:
    mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    # Force a connection attempt.
    mongo_client.server_info()
    # Connect to the 'emails' database (update as needed).
    db = mongo_client['emails']
    print("Connected to MongoDB. Collections found:", db.list_collection_names())
except ServerSelectionTimeoutError as err:
    print("Error: Unable to connect to MongoDB. Please verify your connection settings.")
    print(err)
    exit(1)

# Define collections (ensure these names match your MongoDB collections).
emails_collection = db['emails']
urls_collection = db['urls']
urls2_collection = db['urls2']

###############################################################################
#                        HELPER FUNCTIONS
###############################################################################
def fetch_random_document(collection, filter_dict: dict = None) -> dict:
    """
    Fetch a random document from a collection.
    If a filter is provided, it is applied before sampling.
    Returns an empty dict if no document is found.
    """
    pipeline = []
    if filter_dict:
        pipeline.append({"$match": filter_dict})
    pipeline.append({"$sample": {"size": 1}})
    doc = next(collection.aggregate(pipeline), None)
    if doc is None:
        print(f"Warning: No document found in '{collection.name}' with filter {filter_dict}.")
        return {}
    return doc

def sample_df1_info() -> dict:
    """
    Sample a document from the URLs collection (formerly df1)
    and return a dictionary with URL-related fields.
    """
    row = fetch_random_document(urls_collection)
    info = {
        "url": row.get("URL", "http://example.com"),
        "domain": row.get("Domain", "example.com"),
        "tld": row.get("TLD", "com"),
        "is_https": row.get("IsHTTPS", 0),
        "has_obfuscation": row.get("HasObfuscation", 0),
        "pay_related": row.get("Pay", 0),
        "crypto_related": row.get("Crypto", 0),
        "label": row.get("label", 0)
    }
    return info

def sample_df2_info() -> dict:
    """
    Sample a document from the second URLs collection (formerly df2)
    and return a dictionary with target/verification details.
    """
    row = fetch_random_document(urls2_collection)
    info = {
        "target": row.get("target", "Unknown Brand"),
        "submission_time": row.get("submission_time", "Unknown Time"),
        "verified": row.get("verified", "false"),
        "online": row.get("online", "unknown"),
        "phish_detail_url": row.get("phish_detail_url", "http://phishtank.com/detail")
    }
    return info

###############################################################################
#                         PROMPT BUILDERS
###############################################################################
def generate_phish_prompt(difficulty: str) -> str:
    # Sample an email from the emails collection.
    sample_email = fetch_random_document(emails_collection)
    sample_text = sample_email.get("Email Text", "No sample text available")
    
    df1_info = sample_df1_info()
    df2_info = sample_df2_info()

    if difficulty == "phishnoob":
        style = "Obviously suspicious and easy to catch"
    elif difficulty == "phishdisciple":
        style = "Moderately deceptive with subtle cues"
    elif difficulty == "phishmaster":
        style = "Highly convincing, nearly legit, faint hints of phishing"
    else:
        style = "General phishing"

    if difficulty in DIFFICULTY_PENALTIES:
        phish_range = DIFFICULTY_PENALTIES[difficulty][0]
        lives_lost = random.randint(*phish_range)
    else:
        lives_lost = random.randint(10, 15)

    prompt = f"""
You are generating a single phishing (Phish) email for a "Phish Game" with difficulty: {difficulty}.
Style: {style}.

Aim for roughly 500 words total. 
**Return a single multiline string** with fields in the format:
topic: ...
sender_persona: ...
subject: ...
greeting: ...
body: ...
call_to_action: ...
phish_or_not: "Phish"
lives_lost_if_wrong: {lives_lost}

Inspiration:
Phishing snippet: "{sample_text}"
URL Data: {df1_info}
PhishTank: {df2_info}

Must have at least 2 emojis, suspicious call-to-action, no extra commentary beyond the lines listed above.
"""
    return prompt.strip()

def generate_non_phish_prompt(difficulty: str, raw_email_text: str) -> str:
    if difficulty in DIFFICULTY_PENALTIES:
        non_phish_range = DIFFICULTY_PENALTIES[difficulty][1]
        lives_lost = random.randint(*non_phish_range)
    else:
        lives_lost = random.randint(1, 3)

    df1_info = sample_df1_info()
    df2_info = sample_df2_info()

    prompt = f"""
We have a legitimate (non-phish) email for difficulty {difficulty}.
Return a single multiline string with fields:
topic: ...
sender_persona: ...
subject: ...
greeting: ...
body: ...
call_to_action: ...
phish_or_not: "Not Phish"
lives_lost_if_wrong: {lives_lost}

No suspicious cues. At least 2 emojis. About 500 words.
No extra commentary.

Original snippet:
\"\"\"{raw_email_text}\"\"\"

URL data: {df1_info}
PhishTank: {df2_info}
"""
    return prompt.strip()

###############################################################################
#                        GPT CALL WRAPPER
###############################################################################
def call_openai_chat(prompt: str) -> str:
    global RECENT_CALL_TIMES

    now = time.time()
    # Remove call timestamps older than 60 seconds
    RECENT_CALL_TIMES = [t for t in RECENT_CALL_TIMES if now - t < 60]

    # If already made 3 calls within last minute, wait until one expires
    if len(RECENT_CALL_TIMES) >= 3:
        wait_time = 60 - (now - RECENT_CALL_TIMES[0])
        time.sleep(wait_time)

    # Now proceed with the request
    response = client.chat.completions.create(
        model=GPT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
    )

    # Record the time of this call
    RECENT_CALL_TIMES.append(time.time())

    return response.choices[0].message.content.strip()

###############################################################################
#                          POST-PROCESSOR
###############################################################################
def parse_email_string(raw_text: str) -> dict:
    """
    Expects lines like:
    topic: ...
    sender_persona: ...
    subject: ...
    greeting: ...
    body: ...
    call_to_action: ...
    phish_or_not: ...
    lives_lost_if_wrong: ...
    
    Returns a dict with these keys; missing fields are set to a default.
    """
    result = {
        "topic": "",
        "sender_persona": "",
        "subject": "",
        "greeting": "",
        "body": "",
        "call_to_action": "",
        "phish_or_not": "",
        "lives_lost_if_wrong": 0
    }

    for line in raw_text.splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, val = line.split(":", 1)
        key = key.strip().lower()
        val = val.strip()
        if key in result:
            if key == "lives_lost_if_wrong":
                try:
                    result[key] = int(val)
                except ValueError:
                    result[key] = 0
            else:
                result[key] = val
    return result

###############################################################################
#         MAIN PER-DIFFICULTY (RANDOM PHISH, REST NON-PHISH) + POST-PARSE
###############################################################################
def generate_emails_for_difficulty(difficulty: str, num_emails: int = 10):
    phish_count = random.randint(2, 4)
    non_phish_count = num_emails - phish_count
    flags = [True] * phish_count + [False] * non_phish_count
    random.shuffle(flags)

    emails_output = []
    recent_texts = []

    # Retrieve non-phishing emails from MongoDB (only the "Email Text" field).
    non_phish_docs = list(emails_collection.find(
        {"Email Type": {"$not": {"$regex": "phishing", "$options": "i"}}},
        {"Email Text": 1, "_id": 0}
    ))
    non_phish_texts = [doc.get("Email Text") for doc in non_phish_docs if doc.get("Email Text")]

    print(f"\nGenerating {num_emails} emails for '{difficulty}': {phish_count} phish, {non_phish_count} non-phish\n")

    for i, is_phish in enumerate(flags, start=1):
        if is_phish:
            prompt = generate_phish_prompt(difficulty)
            raw_email = call_openai_chat(prompt)
        else:
            if not non_phish_texts:
                fallback_text = (
                    "Hello team,\n"
                    "We just wanted to remind you about the upcoming event. Please join us.\n"
                    "Feel free to bring friends and family. Thanks!"
                )
                prompt = generate_non_phish_prompt(difficulty, fallback_text)
                raw_email = call_openai_chat(prompt)
            else:
                chosen_raw_text = random.choice(non_phish_texts)
                prompt = generate_non_phish_prompt(difficulty, chosen_raw_text)
                raw_email = call_openai_chat(prompt)

        # Similarity check to avoid near-duplicate outputs.
        attempts_left = 2
        while is_too_similar(raw_email, recent_texts) and attempts_left > 0:
            print(f"Email {i} is too similar to a recent output. Regenerating...\n")
            raw_email = call_openai_chat(prompt)
            attempts_left -= 1

        # Post-process the raw text into a structured dict.
        parsed_email = parse_email_string(raw_email)

        emails_output.append(parsed_email)
        recent_texts.append(raw_email)

        print(f"=== Generated Email {i} for '{difficulty}' (Phish? {parsed_email.get('phish_or_not', '')}) ===")
        print(parsed_email)
        print("=" * 60, "\n")

        time.sleep(1)

    return emails_output

def is_too_similar(new_text: str, existing_texts: list, threshold: float = 0.85) -> bool:
    """
    Returns True if new_text is too similar to any string in existing_texts.
    """
    for text in existing_texts:
        ratio = difflib.SequenceMatcher(None, new_text, text).ratio()
        if ratio >= threshold:
            return True
    return False

###############################################################################
#                              MAIN EXECUTION
###############################################################################
if __name__ == "__main__":
    difficulties = ["phishnoob", "phishdisciple", "phishmaster"]
    all_emails = {}

    for diff in difficulties:
        emails_for_diff = generate_emails_for_difficulty(diff, NUM_EMAILS_PER_DIFFICULTY)
        all_emails[diff] = emails_for_diff

    with open("generated_phishing_emails.json", "w", encoding="utf-8") as f:
        json.dump(all_emails, f, indent=4, ensure_ascii=False)

    print("All emails generated, post-processed, and saved to 'generated_phishing_emails.json'.")

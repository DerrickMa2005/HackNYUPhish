import os
import time
import json
import random
import difflib
import pandas as pd

# OpenAI v1 imports
from openai import OpenAI
from openai import RateLimitError, APIConnectionError, APIError

###############################################################################
#                          CONFIG & CONSTANTS
###############################################################################
NUM_EMAILS_PER_DIFFICULTY = 10

# Removed fixed phishing email count; now we'll choose a random number between 2-4.
# PHISH_COUNT = 2
# NON_PHISH_COUNT = NUM_EMAILS_PER_DIFFICULTY - PHISH_COUNT

# Penalty (Lives Lost) Ranges per Difficulty
# (phish_range, non_phish_range)
DIFFICULTY_PENALTIES = {
    "phishnoob":     ((5, 10), (1, 2)),   # phish: 5–10, non-phish: 1–2
    "phishdisciple": ((10, 15), (1, 3)),  # phish: 10–15, non-phish: 1–3
    "phishmaster":   ((15, 25), (3, 5))   # phish: 15–25, non-phish: 3–5
}

# GPT model settings
GPT_MODEL = "gpt-3.5-turbo"
# For ~500 words (plus overhead), let's give plenty of room:
MAX_TOKENS = 2000
TEMPERATURE = 0.7

###############################################################################
#                           SETUP OPENAI CLIENT
###############################################################################
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

###############################################################################
#                           LOAD DATASETS
###############################################################################
df = pd.read_csv("Phishing_Email.csv")      # e.g., has "Email Text", "Email Type"
df1 = pd.read_csv("PhiUSIIL_Phishing_URL_Dataset.csv")
df2 = pd.read_csv("verified_online.csv")

# Filter out Non-Phish Emails from df
non_phish_df = df[df["Email Type"].str.lower() != "phishing"]

###############################################################################
#                         SIMILARITY CHECK
###############################################################################
def is_too_similar(new_text: str, existing_texts: list, threshold: float = 0.85) -> bool:
    """
    Returns True if `new_text` is ≥ `threshold` similar to any in `existing_texts`.
    Uses difflib for a quick ratio check.
    """
    for text in existing_texts:
        ratio = difflib.SequenceMatcher(None, new_text, text).ratio()
        if ratio >= threshold:
            return True
    return False

###############################################################################
#             HELPER: SAMPLE EXTENSIVE DATA FROM df1, df2 FOR PROMPTS
###############################################################################
def sample_df1_info() -> dict:
    """
    Sample a row from df1 (the phishing URL dataset) and extract some key columns
    to feed into the prompt. Adjust or add columns as you wish.
    """
    row = df1.sample(1).iloc[0]
    info = {
        "url": row.get("URL", "http://example.com"),
        "domain": row.get("Domain", "example.com"),
        "tld": row.get("TLD", "com"),
        "is_https": row.get("IsHTTPS", 0),
        "has_obfuscation": row.get("HasObfuscation", 0),
        "pay_related": row.get("Pay", 0),
        "crypto_related": row.get("Crypto", 0),
        "label": row.get("label", 0)  # might be 0 or 1
    }
    return info

def sample_df2_info() -> dict:
    """
    Sample a row from df2 (PhishTank) and pull some columns like target, submission_time, verified, online.
    """
    row = df2.sample(1).iloc[0]
    info = {
        "target": row.get("target", "Unknown Brand"),
        "submission_time": row.get("submission_time", "Unknown Time"),
        "verified": row.get("verified", "false"),
        "online": row.get("online", "unknown"),
        "phish_detail_url": row.get("phish_detail_url", "http://phishtank.com/detail"),
    }
    return info

###############################################################################
#                      BUILD PHISH PROMPT
###############################################################################
def generate_phish_prompt(difficulty: str) -> str:
    """Build a user message for ChatCompletion specifically for a PHISH email,
       referencing data from df, df1, df2."""
    # 1) Sample from df (Phishing_Email)
    sample_email = df.sample(1).iloc[0]
    sample_text = sample_email.get("Email Text", "No sample text available")

    # 2) Sample from df1
    df1_info = sample_df1_info()

    # 3) Sample from df2
    df2_info = sample_df2_info()

    # 4) Difficulty style
    if difficulty == "phishnoob":
        difficulty_style = "Obviously suspicious and easy to catch"
    elif difficulty == "phishdisciple":
        difficulty_style = "Moderately deceptive with some subtle cues"
    elif difficulty == "phishmaster":
        difficulty_style = "Highly convincing, nearly legit, only faint hints of phishing"
    else:
        difficulty_style = "General phishing"

    # 5) Penalty
    if difficulty in DIFFICULTY_PENALTIES:
        phish_range = DIFFICULTY_PENALTIES[difficulty][0]
        lives_lost = random.randint(*phish_range)
    else:
        lives_lost = random.randint(10, 15)

    # 6) Build the prompt, asking for ~500 words
    prompt = f"""
You are generating a single phishing (Phish) email for a "Phish Game" with difficulty: {difficulty}.

- Style: {difficulty_style}.
- Aim for roughly 500 words total (you may go a bit under or over).
- Return valid JSON ONLY, with these fields:
{{
  "topic": "...",
  "sender_persona": "...",
  "subject": "...",
  "greeting": "...",
  "body": "...",
  "call_to_action": "...",
  "phish_or_not": "Phish",
  "lives_lost_if_wrong": ...
}}

Here are some data points from your datasets, incorporate them creatively and realistically into the email:

Phishing Email (df) sample:
 - Text snippet: "{sample_text}"

Phishing URL Dataset (df1) sample:
 - URL: "{df1_info['url']}"
 - Domain: "{df1_info['domain']}"
 - TLD: "{df1_info['tld']}"
 - is_https: "{df1_info['is_https']}"
 - has_obfuscation: "{df1_info['has_obfuscation']}"
 - pay_related: "{df1_info['pay_related']}"
 - crypto_related: "{df1_info['crypto_related']}"
 - label: "{df1_info['label']}"

PhishTank (df2) sample:
 - target: "{df2_info['target']}"
 - submission_time: "{df2_info['submission_time']}"
 - verified: "{df2_info['verified']}"
 - online: "{df2_info['online']}"
 - phish_detail_url: "{df2_info['phish_detail_url']}"

Lives lost if misclassified: {lives_lost}

Instructions:
1) "phish_or_not" must be "Phish".
2) Include at least 2 emojis somewhere in the subject/body.
3) The email can reference the above data (URL, domain, TLD, target brand, etc.) to make it look more credible or suspicious.
4) Provide a suspicious call-to-action referencing the data if appropriate.
5) Return exactly the JSON with no extra commentary.
6) "lives_lost_if_wrong" = {lives_lost}.
7) ~500 words total.
"""
    return prompt.strip()

###############################################################################
#                  BUILD NON-PHISH PROMPT
###############################################################################
def generate_non_phish_prompt(difficulty: str, raw_email_text: str) -> str:
    """
    Feeds the raw non-phish email text from your dataset to GPT,
    instructing it to guess/infer the topic, persona, subject, greeting, etc.
    Must output valid JSON with "phish_or_not": "Not Phish" and incorporate references
    from df1 & df2 to add realism (but remain legitimate).
    """
    # Difficulty-based penalty for non-phish
    if difficulty in DIFFICULTY_PENALTIES:
        non_phish_range = DIFFICULTY_PENALTIES[difficulty][1]
        lives_lost = random.randint(*non_phish_range)
    else:
        lives_lost = random.randint(1, 3)

    # Sample df1 & df2 data
    df1_info = sample_df1_info()
    df2_info = sample_df2_info()

    prompt = f"""
We have the following legitimate (non-phish) email text from our dataset (~500 words total, or near that):

\"\"\"{raw_email_text}\"\"\"

Your task:
- Return only valid JSON with these fields:
{{
  "topic": "...",
  "sender_persona": "...",
  "subject": "...",
  "greeting": "...",
  "body": "...",
  "call_to_action": "...",
  "phish_or_not": "Not Phish",
  "lives_lost_if_wrong": ...
}}

Incorporate the following data points from our URL and PhishTank datasets to make it more realistic (but still legitimate):
- (df1)
   URL: "{df1_info['url']}"
   Domain: "{df1_info['domain']}"
   TLD: "{df1_info['tld']}"
   label: "{df1_info['label']}"
- (df2)
   target: "{df2_info['target']}"
   submission_time: "{df2_info['submission_time']}"
   verified: "{df2_info['verified']}"
   online: "{df2_info['online']}"

You can reference these details in a normal, legitimate way (e.g., disclaimers, helpful link, brand mention).
Add at least 2 emojis in subject or body (for style).

"Lives lost if misclassified" is {lives_lost}. 
This email must remain "Not Phish" and appear legitimate. 
Return exactly the JSON, no extra commentary.
Aim for ~500 words total.
"""
    return prompt.strip()

###############################################################################
#               GPT CALL WRAPPER
###############################################################################
def call_openai_chat(prompt: str) -> str:
    """
    Calls the GPT model to generate text given a user prompt.
    Retries on transient errors. Returns the model output as a string.
    """
    max_attempts = 3
    attempt = 0

    while attempt < max_attempts:
        attempt += 1
        try:
            response = client.chat.completions.create(
                model=GPT_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=MAX_TOKENS,
                temperature=TEMPERATURE,
            )
            return response.choices[0].message.content.strip()

        except (RateLimitError, APIConnectionError) as e:
            print(f"Attempt {attempt} - transient error: {e}")
            if attempt < max_attempts:
                print("Retrying in 5 seconds...")
                time.sleep(5)
        except APIError as e:
            print(f"API Error: {e}")
            raise e

    raise RuntimeError("Failed to get response from OpenAI after multiple attempts.")

###############################################################################
#                  MAIN PER-DIFFICULTY GENERATION
###############################################################################
def generate_emails_for_difficulty(difficulty: str, num_emails: int = 10):
    """
    Generates `num_emails` for the given difficulty:
      - A random number (between 2 and 4) of phish emails,
      - The rest are non-phish emails.
    Each tries to incorporate columns from df1, df2, and references from df (phish or not).
    """
    # Randomly determine the number of phish emails (between 2 and 4)
    phish_count = random.randint(2, 4)
    non_phish_count = num_emails - phish_count
    phish_flags = [True] * phish_count + [False] * non_phish_count
    random.shuffle(phish_flags)

    emails_output = []
    recent_texts = []

    # Gather all possible non-phish texts from df
    non_phish_texts = non_phish_df["Email Text"].dropna().tolist()

    print(f"\nGenerating {num_emails} emails for '{difficulty}' difficulty.\n"
          f" -> {phish_count} phish, {non_phish_count} non-phish\n")

    for i, is_phish in enumerate(phish_flags, start=1):
        if is_phish:
            # Build phish prompt
            prompt = generate_phish_prompt(difficulty)
            email_text = call_openai_chat(prompt)
        else:
            # For non-phish, pick a random raw text and feed it to GPT with extra references
            if not non_phish_texts:
                # fallback if there's no non-phish text
                fallback_text = (
                    "Hello team,\n"
                    "We just wanted to remind you about the upcoming event. Please join us. "
                    "Feel free to bring friends and family. Thanks!"
                )
                prompt = generate_non_phish_prompt(difficulty, fallback_text)
            else:
                chosen_raw_text = random.choice(non_phish_texts)
                prompt = generate_non_phish_prompt(difficulty, chosen_raw_text)

            email_text = call_openai_chat(prompt)

        # Check repetitiveness
        attempts_left = 2
        while is_too_similar(email_text, recent_texts) and attempts_left > 0:
            print(f"Email {i} is too similar to a recent output. Regenerating...\n")
            if is_phish:
                email_text = call_openai_chat(prompt)
            else:
                # Try a different random sample for non-phish
                if non_phish_texts:
                    chosen_raw_text = random.choice(non_phish_texts)
                    prompt = generate_non_phish_prompt(difficulty, chosen_raw_text)
                    email_text = call_openai_chat(prompt)
                else:
                    email_text = call_openai_chat(prompt)
            attempts_left -= 1

        emails_output.append(email_text)
        recent_texts.append(email_text)
        if len(recent_texts) > 5:
            recent_texts.pop(0)

        print(f"=== Generated Email {i} for '{difficulty}' (Phish? {is_phish}) ===")
        print(email_text)
        print("=" * 60, "\n")

        # Delay to reduce rate-limit issues
        time.sleep(1)

    return emails_output

if __name__ == "__main__":
    difficulties = ["phishnoob", "phishdisciple", "phishmaster"]
    all_emails = {}

    for diff in difficulties:
        emails_for_diff = generate_emails_for_difficulty(diff, NUM_EMAILS_PER_DIFFICULTY)
        all_emails[diff] = emails_for_diff

    # Save everything to JSON
    with open("generated_phishing_emails1.json", "w", encoding="utf-8") as f:
        json.dump(all_emails, f, indent=4, ensure_ascii=False)

    print("All emails generated and saved to 'generated_phishing_emails.json'.")

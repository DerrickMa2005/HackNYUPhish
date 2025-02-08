import os
import time
import json
import random
import pandas as pd

# IMPORTANT: Import the new `OpenAI` client from v1
from openai import OpenAI
from openai import OpenAIError, RateLimitError, APIConnectionError, APIError

# 1. Instantiate the OpenAI client
# If you have your API key set in the OPENAI_API_KEY environment variable,
# you can omit the `api_key` argument and just do `client = OpenAI()`.
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),  # or "YOUR_OPENAI_API_KEY"
    # Optionally set any other config like:
    # base_url="https://api.openai.com/v1", 
    # max_retries=2,
    # timeout=120.0,
)


# 2. Load the Datasets
df = pd.read_csv("Phishing_Email.csv")
df1 = pd.read_csv("PhiUSIIL_Phishing_URL_Dataset.csv")
df2 = pd.read_csv("verified_online.csv")


def generate_email_prompt(difficulty: str) -> str:
    """
    Builds a user message for the ChatCompletion request by sampling from your three datasets.
    This prompt instructs the model to create a phishing email at a specified difficulty level.
    """
    # Sample a row from the phishing email dataset (df)
    sample_email = df.sample(1).iloc[0]
    sample_email_text = sample_email.get("Email Text", "No sample text available")
    sample_email_type = sample_email.get("Email Type", "Unknown")

    # Sample a row from the phishing URL dataset (df1)
    sample_url_row = df1.sample(1).iloc[0]
    sample_url = sample_url_row.get("URL", "http://example.com")
    sample_domain = sample_url_row.get("Domain", "example.com")

    # Sample a row from the PhishTank dataset (df2)
    sample_phishtank = df2.sample(1).iloc[0]
    sample_target = sample_phishtank.get("target", "Unknown Company")

    # Build a prompt that includes these samples plus instructions
    prompt = f"""
Using the following inspiration data, generate a phishing email with a subject, greeting, body, 
and a call-to-action that includes a link. The email should be under 200 words.

--- Inspiration Data ---
Phishing Email Example:
Email Text: "{sample_email_text}"
Email Type: "{sample_email_type}"

Phishing URL Data:
URL: "{sample_url}"
Domain: "{sample_domain}"

Phishtank Data:
Target (Company/Brand): "{sample_target}"

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
    Retries the request if we hit rate limits or transient errors.
    """
    # We'll try up to 3 times if we hit certain errors
    max_attempts = 3
    attempt = 0

    while attempt < max_attempts:
        attempt += 1
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # or "gpt-3.5-turbo", or any supported model
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            # Return the generated message text
            return response.choices[0].message.content.strip()

        except (RateLimitError, APIConnectionError) as e:
            print(f"Attempt {attempt}: {e}")
            if attempt < max_attempts:
                print("Retrying in 5 seconds...")
                time.sleep(5)
        except APIError as e:
            print(f"API Error: {e}")
            # If it's a 4XX or other API error, re-raise so we don't get stuck in a loop
            raise e

    raise RuntimeError("Failed to get response from OpenAI after multiple attempts.")


def generate_emails_for_difficulty(difficulty: str, num_emails: int = 10):
    """
    Creates `num_emails` phishing emails for the given difficulty level. 
    Returns a list of generated email strings.
    """
    # You can tweak these per difficulty, or set them the same if you want.
    if difficulty == "phishnoob":
        max_tokens = 200
        temperature = 0.9
    elif difficulty == "phishmediate":
        max_tokens = 250
        temperature = 0.8
    elif difficulty == "phishmaster":
        max_tokens = 300
        temperature = 0.7
    else:
        # Default fallback
        max_tokens = 250
        temperature = 0.8

    emails = []
    print(f"\nGenerating {num_emails} emails for difficulty: {difficulty}...\n")

    for i in range(num_emails):
        prompt = generate_email_prompt(difficulty)
        email_text = call_openai_chat(prompt, max_tokens, temperature)
        emails.append(email_text)

        # Print each email right away
        print(f"=== Generated Email {i+1} for '{difficulty}' ===")
        print(email_text)
        print("=" * 60, "\n")
        
        # Delay to help prevent hitting rate limits or ensure variety in generation
        time.sleep(1)

    return emails


if __name__ == "__main__":
    # Generate and collect emails for each difficulty
    phishnoob_emails = generate_emails_for_difficulty("phishnoob", num_emails=10)
    phishmediate_emails = generate_emails_for_difficulty("phishmediate", num_emails=10)
    phishmaster_emails = generate_emails_for_difficulty("phishmaster", num_emails=10)

    # Combine all results into a dict
    all_emails = {
        "phishnoob": phishnoob_emails,
        "phishmediate": phishmediate_emails,
        "phishmaster": phishmaster_emails
    }

    # Save the generated emails to a JSON file
    with open("generated_phishing_emails.json", "w", encoding="utf-8") as f:
        json.dump(all_emails, f, indent=4, ensure_ascii=False)

    print("All emails generated and saved to 'generated_phishing_emails.json'.")

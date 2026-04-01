import os
import json
import re
import base64
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")

def _extract_json(text: str) -> dict:
    """Robustly extract a JSON object from an LLM response string."""
    # Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Try to find the first {...} block
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from model response: {text[:300]}")


def map_text_to_json(raw_text: str, filename: str, base64_image: str = None) -> dict:
    """
    Takes the compiled text from OCR engines and/or a base64 image,
    and uses the Groq Vision-LLM to semantically map it into a standardized JSON structure.
    """
    prompt = f"""You are an AI assistant that extracts student records from scanned documents.
The document may contain student names and scores in Amharic, English, or a mix of both.

Extracted raw text (filename: {filename}) as a hint:
---
{raw_text}
---

Carefully analyze the image (if provided) and the text above.

IMPORTANT RULES:
1. Identify whatever columns/subjects are actually present in the document — do NOT assume fixed subjects like math, english, or science.
2. Use EXACTLY the column/subject names as they appear (transliterate Amharic to Latin script if needed, e.g. "ሒሳብ" → "hisab").
3. Only include fields that actually exist in the document. Do not add null fields for missing subjects.
4. Each student object must have "first_name" and "last_name", then one key per subject that appears for that student.

Return ONLY a valid JSON object — no markdown, no explanation:
{{
    "columns": ["subject1", "subject2", ...],
    "students": [
        {{
            "first_name": "string",
            "last_name": "string",
            "subject1": number,
            "subject2": number
        }}
    ]
}}"""

    # Build message content
    content = [{"type": "text", "text": prompt}]

    if base64_image:
        # Strip data-uri prefix if present
        if "base64," in base64_image:
            base64_image = base64_image.split("base64,")[1]
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{base64_image}"
            }
        })

    try:
        print(f"  → Calling Groq model: {GROQ_MODEL}")
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": content}],
            temperature=0.1,
            max_tokens=2048,
        )

        result_text = response.choices[0].message.content
        print(f"  → Groq response received ({len(result_text)} chars)")
        return _extract_json(result_text)

    except Exception as e:
        print(f"Groq API Error: {e}")
        return {"error": "Failed to map data via Groq", "details": str(e)}

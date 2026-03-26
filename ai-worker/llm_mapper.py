import requests
import json

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5-vl:7b"

def map_text_to_json(raw_text: str, filename: str) -> dict:
    """
    Takes the compiled text from OCR engines and uses the local LLM
    to semantically map it into a standardized JSON structure.
    """
    prompt = f"""
    You are an AI assistant designed to extract student records from messy OCR data.
    The document in question contains student names, and their scores for different subjects, sometimes in Amharic (like "ሒሳብ" for Math).

    Here is the extracted raw text from the file {filename}:
    ---
    {raw_text}
    ---

    Extract the student information and return it STRICTLY as a valid JSON object matching this template:
    {{
        "students": [
            {{
                "first_name": "string",
                "last_name": "string",
                "math_score": number or null,
                "english_score": number or null,
                "science_score": number or null
            }}
        ]
    }}
    
    Do not return any explanations, markdown blocks, or extra text. ONLY return the final JSON.
    """

    data = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1 # Keep it deterministic for data extraction
        }
    }

    try:
        response = requests.post(OLLAMA_API_URL, json=data)
        response.raise_for_status()
        
        result_text = response.json().get("response", "")
        # Clean up potential markdown formatting if the model disobeys instructions
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        elif result_text.startswith("```"):
            result_text = result_text[3:-3]
            
        return json.loads(result_text.strip())
        
    except requests.exceptions.RequestException as e:
        print(f"Error calling Ollama API: {e}")
        return {"error": "Failed to connect to local LLM"}
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from LLM: {e}")
        return {"error": "LLM returned invalid JSON", "raw_response": result_text}

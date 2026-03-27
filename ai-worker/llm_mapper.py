import requests
import json
import re

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2:0.5b" # Temporarily using 0.5b with repair logic while 1.5b downloads

def repair_json(raw_response: str) -> str:
    """
    Cleans up common LLM output failures before parsing.
    """
    # 1. Remove markdown blocks
    raw_response = re.sub(r'```json\s*|```\s*', '', raw_response)
    
    # 2. Fix unquoted "number" or "null" placeholders that small models sometimes hallucinate
    raw_response = re.sub(r':\s*number\b', ': null', raw_response, flags=re.IGNORECASE)
    raw_response = re.sub(r':\s*NaN\b', ': null', raw_response, flags=re.IGNORECASE)
    
    # 3. Trim whitespace
    return raw_response.strip()

def map_text_to_json(raw_text: str, filename: str) -> dict:
    """
    Takes the compiled text from OCR engines and uses a simplified prompt
    to extract student data without requiring the LLM to generate complex JSON.
    """
    prompt = f"""
    You are an expert OCR parser. Convert the following text into a simple list.
    Rules:
    - List every student you find.
    - Format: First Name Last Name | Math | English | Science
    - Use '|' to separate columns.
    - If a score is missing, use 'null'.
    - Output only the list.
    
    TEXT:
    ---
    {raw_text}
    ---
    """

    # Check available models to auto-switch to 1.5b if ready
    prefer_model = "qwen2:1.5b"
    fallback_model = "qwen2:0.5b"
    
    try:
        models_resp = requests.get(f"{OLLAMA_API_URL.replace('/generate', '/tags')}")
        available = [m["name"] for m in models_resp.json().get("models", [])]
        current_model = prefer_model if any(prefer_model in name for name in available) else fallback_model
    except:
        current_model = fallback_model

    data = {
        "model": current_model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.1}
    }

    try:
        response = requests.post(OLLAMA_API_URL, json=data, timeout=30)
        response.raise_for_status()
        res_json = response.json()
        raw_response = res_json.get("response", "").strip()
        print(f"DEBUG: Using model {current_model}")
        print(f"DEBUG: Raw LLM Output:\n{raw_response}")
        raw_rows = raw_response.split("\n")
        
        students = []
        for line in raw_rows:
            line = line.strip()
            # Only skip pure markdown separators
            if not "|" in line or "---" in line:
                continue
            
            # Skip only if the row is a header (contains subjects but NO digits)
            if all(x in line for x in ["Math", "English", "Science"]) and not re.search(r"\d", line):
                continue
                
            parts = [p.strip() for p in line.split("|")]
            # Filter out empty strings from start/end of markdown pipes
            parts = [p for p in parts if p]
            
            if len(parts) >= 1:
                name_parts = parts[0].split()
                fname = name_parts[0] if name_parts else "Unknown"
                lname = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
                
                def extract_field(subject, full_line, pos_index):
                    # 1. Try search globally for "Subject: Number" anywhere in the line first
                    # This handles "Math: 95, English: null" format
                    pattern = rf"{subject}[:\s]*(\d+(\.\d+)?)"
                    match = re.search(pattern, full_line, re.IGNORECASE)
                    if match:
                        try: return float(match.group(1))
                        except: pass
                    
                    # 2. Fallback to positional pipe split if global search fails
                    # This handles "Name | 95 | 88 | 92" format
                    parts_raw = [p.strip() for p in full_line.split("|")]
                    parts_clean = [p for p in parts_raw if p]
                    if len(parts_clean) > pos_index:
                        val = parts_clean[pos_index]
                        clean_match = re.search(r"(\d+(\.\d+)?)", val)
                        if clean_match:
                            try: return float(clean_match.group(1))
                            except: return None
                    return None

                students.append({
                    "first_name": fname,
                    "last_name": lname,
                    "math_score": extract_field("Math", line, 1),
                    "english_score": extract_field("English", line, 2),
                    "science_score": extract_field("Science", line, 3)
                })
        
        result = {"students": students}
        print(f"DEBUG: Final Processed Result: {json.dumps(result, indent=2)}")
        return result
        
    except Exception as e:
        print(f"Extraction Error: {e}")
        return {"error": str(e)}

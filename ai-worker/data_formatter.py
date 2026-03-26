import pandas as pd
import io

def format_to_csv(json_data: dict) -> bytes:
    """
    Takes the structured JSON data returned by the LLM
    and converts it into a valid CSV byte stream.
    """
    if "students" not in json_data:
        return b""
        
    df = pd.DataFrame(json_data["students"])
    
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    
    return csv_buffer.getvalue().encode('utf-8')

def format_to_excel(json_data: dict) -> bytes:
    """
    Takes the structured JSON data and converts it into
    an Excel file byte stream.
    """
    if "students" not in json_data:
        return b""
        
    df = pd.DataFrame(json_data["students"])
    
    excel_buffer = io.BytesIO()
    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Students')
        
    return excel_buffer.getvalue()

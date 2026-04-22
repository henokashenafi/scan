"""
Deterministic table parser for Surya OCR output.
Groups text lines into rows by Y-axis proximity, sorts by X,
then maps to structured student records.
"""

ROW_TOLERANCE = 6       # pixels — lines within this vertical distance are the same row
MIN_ROW_HEIGHT = 10     # ignore text lines with y_center below this (noise at top)
MIN_ROW_CELLS = 3       # ignore rows with fewer than this many cells (junk/title rows)


def parse_table(text_lines) -> dict:
    if not text_lines:
        return {"columns": [], "students": []}

    # Build items, filter top-edge noise only
    items = []
    for line in text_lines:
        bbox = line.bbox
        y_center = (bbox[1] + bbox[3]) / 2
        if y_center < MIN_ROW_HEIGHT:
            continue
        items.append({
            "text": line.text.strip(),
            "x": bbox[0],
            "y_center": y_center
        })

    if not items:
        return {"columns": [], "students": []}

    items.sort(key=lambda i: i["y_center"])

    # Group into rows by Y proximity using rolling average anchor
    rows = []
    current_row = [items[0]]
    for item in items[1:]:
        row_y_avg = sum(c["y_center"] for c in current_row) / len(current_row)
        if abs(item["y_center"] - row_y_avg) <= ROW_TOLERANCE:
            current_row.append(item)
        else:
            rows.append(current_row)
            current_row = [item]
    rows.append(current_row)

    # Sort each row left-to-right
    for row in rows:
        row.sort(key=lambda i: i["x"])

    # Filter junk rows
    rows = [r for r in rows if _is_valid_row(r)]

    print(f"Parsed {len(rows)} rows after filtering")
    for i, row in enumerate(rows):
        print(f"  Row {i}: {[c['text'] for c in row]}")

    if len(rows) < 2:
        return {"columns": [], "students": []}

    # Find the real header row — the one with the most non-numeric cells
    header_idx = _find_header_row(rows)
    header_row = rows[header_idx]
    data_rows = rows[header_idx + 1:]

    if not data_rows:
        return {"columns": [], "students": []}

    raw_headers = [cell["text"] for cell in header_row]

    # If header has more columns than data rows, check if first column is a row-counter    
    if data_rows:
        max_data_cols = max(len(r) for r in data_rows)
        if len(raw_headers) > max_data_cols:
            raw_headers = raw_headers[len(raw_headers) - max_data_cols:]

    # Deduplicate headers
    seen = {}
    unique_headers = []
    for h in raw_headers:
        key = _sanitize_key(h)
        if key in seen:
            seen[key] += 1
            key = f"{key}_{seen[key]}"
        else:
            seen[key] = 0
        unique_headers.append(key)

    # Detect name columns
    name_col_count = _detect_name_columns(data_rows, len(unique_headers))
    subject_keys = unique_headers[name_col_count:]

    students = []
    for row in data_rows:
        cells = [cell["text"] for cell in row]
        cells = _expand_merged_cells(cells, len(unique_headers))
        while len(cells) < len(unique_headers):
            cells.append("")
        cells = cells[:len(unique_headers)]

        student = {}

        if name_col_count == 1:
            # Strip leading row number if present (e.g. "1 አስቴር ተፈራ" → "አስቴር ተፈራ")
            name = _strip_leading_number(cells[0])
            parts = name.split()
            student["first_name"] = parts[0] if parts else name
            student["last_name"] = " ".join(parts[1:]) if len(parts) > 1 else ""
        elif name_col_count == 2:
            student["first_name"] = _strip_leading_number(cells[0])
            student["last_name"] = cells[1]
        else:
            student["first_name"] = _strip_leading_number(cells[0]) if len(cells) > 0 else ""
            student["last_name"] = cells[1] if len(cells) > 1 else ""

        for i, key in enumerate(subject_keys):
            raw = cells[name_col_count + i] if (name_col_count + i) < len(cells) else ""
            student[key] = _parse_score(raw)

        students.append(student)

    return {"columns": subject_keys, "students": students}


def _find_header_row(rows) -> int:
    """
    Returns the index of the most likely header row.
    Header row = row with the highest ratio of non-numeric cells.
    """
    best_idx = 0
    best_score = -1
    for i, row in enumerate(rows):
        texts = [c["text"] for c in row]
        non_numeric = sum(1 for t in texts if _parse_score(t) is None and t.strip())
        score = non_numeric / max(len(texts), 1)
        if score > best_score:
            best_score = score
            best_idx = i
    return best_idx


def _is_valid_row(row) -> bool:
    if len(row) < MIN_ROW_CELLS:
        return False
    combined = " ".join(c["text"] for c in row).replace(".", "").replace(" ", "").replace("-", "")
    return len(combined) >= 3


def _expand_merged_cells(cells: list, expected_count: int) -> list:
    if len(cells) >= expected_count:
        return cells
    result = []
    for cell in cells:
        parts = cell.split()
        if (len(parts) == 2
                and _parse_score(parts[0]) is not None
                and _parse_score(parts[1]) is not None):
            result.extend(parts)
        else:
            result.append(cell)
    return result


def _strip_leading_number(text: str) -> str:
    """Remove leading row number from merged name cells like '1 አስቴር ተፈራ'."""
    import re
    return re.sub(r"^\d+\s+", "", text.strip())


def _detect_name_columns(data_rows, total_cols) -> int:
    if not data_rows or total_cols == 0:
        return 1
    first = [cell["text"] for cell in data_rows[0]]
    count = 0
    for cell in first:
        cleaned = _strip_leading_number(cell)
        if _parse_score(cleaned) is None and cleaned.strip():
            count += 1
        else:
            break
    return max(1, min(count, 3))


def _sanitize_key(text: str) -> str:
    import re
    text = re.sub(r"<[^>]+>", "", text)
    return text.strip().lower().replace(" ", "_").replace("/", "_")


def _parse_score(text: str):
    try:
        t = text.strip()
        return float(t) if "." in t else int(t)
    except (ValueError, AttributeError):
        return None

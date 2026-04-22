import cv2
import numpy as np

def detect_boxes(image):
    """
    Detects boxes/cells in a table template using OpenCV.
    Returns a list of (x, y, w, h) coordinates for each cell.
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # Thresholding
    thresh = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

    # Detect horizontal lines
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
    detect_horizontal = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    
    # Detect vertical lines
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
    detect_vertical = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel, iterations=2)

    # Combine
    table_mask = cv2.add(detect_horizontal, detect_vertical)

    # Find contours
    cnts = cv2.findContours(table_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cnts[0] if len(cnts) == 2 else cnts[1]

    boxes = []
    for c in cnts:
        x, y, w, h = cv2.boundingRect(c)
        # Filter by size to avoid noise
        if w > 20 and h > 20 and w < 1000 and h < 500:
            boxes.append((x, y, w, h))
            
    # Sort boxes: Top to Bottom, then Left to Right
    boxes = sorted(boxes, key=lambda b: (b[1], b[0]))
    
    return boxes

def extract_cell_image(image, box):
    x, y, w, h = box
    return image[y:y+h, x:x+w]

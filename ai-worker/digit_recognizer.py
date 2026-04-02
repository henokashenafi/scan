import cv2
import numpy as np
import paddle
import os

# Path to the pre-trained model (in Paddle format)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "digit_cnn_v1.pdparams")

class DigitRecognizer:
    def __init__(self):
        self.model = None
        if os.path.exists(MODEL_PATH):
            # Example Paddle model loading (assuming a simple Sequential model)
            # self.model = MyDigitModel()
            # state_dict = paddle.load(MODEL_PATH)
            # self.model.set_state_dict(state_dict)
            # self.model.eval()
            print("Digit Paddle Model detected.")
        else:
            print(f"Note: Digit Paddle Model not found at {MODEL_PATH}. Using fallback OCR.")

    def preprocess(self, char_img):
        """
        Preprocess a single character image for the Paddle model.
        """
        gray = cv2.cvtColor(char_img, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray, (28, 28))
        normalized = resized.astype("float32") / 255.0
        return paddle.to_tensor(normalized.reshape(1, 1, 28, 28))

    def predict(self, char_img):
        """
        Predict the digit in the image.
        """
        if self.model:
            with paddle.no_grad():
                preprocessed = self.preprocess(char_img)
                prediction = self.model(preprocessed)
                return paddle.argmax(prediction).item()
        return None # Fallback to other OCR methods

# Global instance
recognizer = DigitRecognizer()

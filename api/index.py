import base64
import io
import os
import re
from flask import Flask, jsonify, request
from openai import OpenAI
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__)


def generate_meme_captions(client, image_data_url):
  prompt = (
      "Analyze this image and generate exactly 6 distinct, short, hilarious"
      " meme captions specifically tailored to what is happening in the image."
      " Provide ONLY the 6 captions as a numbered list (1 to 6), without any"
      " extra conversational filler or introduction."
  )

  response = client.chat.completions.create(
      model="gpt-4o-mini",
      messages=[{
          "role":
              "user",
          "content": [
              {"type": "text", "text": prompt},
              {"type": "image_url", "image_url": {"url": image_data_url}},
          ],
      }],
      max_tokens=400,
  )

  content = response.choices[0].message.content
  lines = content.strip().split("\n")
  captions = []
  for line in lines:
    cleaned = re.sub(r"^[\d]+[\.\)]\s*", "", line.strip())
    if cleaned:
      captions.append(cleaned)

  if len(captions) < 6:
    captions = [l.strip() for l in lines if l.strip()][:6]

  return captions[:6]


def overlay_caption_to_base64(image_bytes, caption):
  img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
  draw = ImageDraw.Draw(img)
  width, height = img.size

  try:
    font = ImageFont.load_default()
  except IOError:
    font = ImageFont.load_default()

  words = caption.split()
  lines = []
  current_line = []
  for word in words:
    test_line = " ".join(current_line + [word])
    bbox = draw.textbbox((0, 0), test_line, font=font)
    text_width = bbox[2] - bbox[0]
    if text_width <= width - 40:
      current_line.append(word)
    else:
      if current_line:
        lines.append(" ".join(current_line))
      current_line = [word]
  if current_line:
    lines.append(" ".join(current_line))

  total_text_height = len(lines) * 20
  start_y = height - total_text_height - 30

  for i, line in enumerate(lines):
    bbox = draw.textbbox((0, 0), line, font=font)
    text_width = bbox[2] - bbox[0]
    start_x = (width - text_width) / 2
    y_pos = start_y + i * 20

    stroke_range = 2
    for x_offset in range(-stroke_range, stroke_range + 1):
      for y_offset in range(-stroke_range, stroke_range + 1):
        if x_offset != 0 or y_offset != 0:
          draw.text(
              (start_x + x_offset, y_pos + y_offset),
              line,
              font=font,
              fill="black",
          )

    draw.text((start_x, y_pos), line, font=font, fill="white")

  output_io = io.BytesIO()
  img.save(output_io, format="JPEG")
  encoded = base64.b64encode(output_io.getvalue()).decode("utf-8")
  return f"data:image/jpeg;base64,{encoded}"


@app.route("/api/generate", methods=["POST"])
def generate_memes():
  try:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
      return jsonify({"error": "OPENAI_API_KEY is not configured."}), 500

    client = OpenAI(api_key=api_key)

    if "image" not in request.files:
      return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    image_bytes = file.read()

    encoded_original = base64.b64encode(image_bytes).decode("utf-8")
    image_data_url = f"data:image/jpeg;base64,{encoded_original}"

    captions = generate_meme_captions(client, image_data_url)

    meme_images = []
    for cap in captions:
      meme_b64 = overlay_caption_to_base64(image_bytes, cap)
      meme_images.append({"caption": cap, "image": meme_b64})

    return jsonify({"success": True, "memes": meme_images})
  except Exception as e:
    return jsonify({"error": str(e)}), 500
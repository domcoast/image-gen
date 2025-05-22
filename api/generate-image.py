from flask import Flask, request, send_file, jsonify
from PIL import Image, ImageDraw, ImageFont
import io
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({'status': 'Image generator is running!'}), 200

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    data = request.get_json()
    if not data or 'id' not in data or 'body' not in data:
        return jsonify({'error': 'Invalid input format'}), 400

    rows = data['body']
    image_id = data['id']

    # Load background image
    try:
        image_path = os.path.join(os.path.dirname(__file__), '../data_domcoast.png')
        image = Image.open(image_path)
    except FileNotFoundError:
        return jsonify({'error': 'Background image not found'}), 500

    draw = ImageDraw.Draw(image)

    # Load fonts with absolute paths
    try:
        font_path_regular = os.path.join(os.path.dirname(__file__), 'arial.ttf')
        font_path_bold = os.path.join(os.path.dirname(__file__), 'arialbd.ttf')
        font_regular = ImageFont.truetype(font_path_regular, 16)
        font_bold = ImageFont.truetype(font_path_bold, 24)
    except Exception as e:
        print("Font loading error:", e)
        font_regular = ImageFont.load_default()
        font_bold = ImageFont.load_default()

    # Draw ID (just the value, no 'ID:') at top
    draw.text((30, 35), f"{image_id}", fill="black", font=font_bold)

    # Table column positions
    x_referring = 30
    x_rating_center = 400
    x_backlinks_center = 650
    start_y = 135
    row_height = 30
    row_width = 720
    margin_left = 40
    padding_top = 8

    # Draw table rows
    for idx, row in enumerate(rows):
        y = start_y + idx * row_height
        draw.line([(margin_left - 20, y + row_height), (margin_left + row_width, y + row_height)], fill="#CCCCCC", width=1)

        draw.text((x_referring, y + padding_top), str(row['referring_domains']), fill="black", font=font_regular)

        rating_text = str(row['domain_rating'])
        w_rating = draw.textlength(rating_text, font=font_regular)
        draw.text((x_rating_center - w_rating // 2, y + padding_top), rating_text, fill="black", font=font_regular)

        backlink_text = str(row['backlinks'])
        w_backlinks = draw.textlength(backlink_text, font=font_regular)
        draw.text((x_backlinks_center - w_backlinks // 2, y + padding_top), backlink_text, fill="black", font=font_regular)

    # Convert image to BytesIO
    img_bytes = io.BytesIO()
    image.save(img_bytes, format='PNG')
    img_bytes.seek(0)

    return send_file(img_bytes, mimetype='image/png', download_name=f"{image_id}.png")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)

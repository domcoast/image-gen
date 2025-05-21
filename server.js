const express = require('express');
const bodyParser = require('body-parser');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Register font (optional, use your font path)
try {
  registerFont(path.join(__dirname, 'arial.ttf'), { family: 'Arial' });
} catch (e) {
  console.warn('Arial font not found, using default system font');
}

const backgroundImageFile = path.join(__dirname, 'data_domcoast.png');

// Mark the handler async to use await inside
app.post('/generate-image', async (req, res) => {
  const { id, body } = req.body;

  if (!id || !Array.isArray(body) || body.length === 0) {
    return res.status(400).json({ error: 'Missing one or more required fields: id, body (array)' });
  }

  for (const row of body) {
    if (
      row.referring_domains === undefined ||
      row.domain_rating === undefined ||
      row.backlinks === undefined
    ) {
      return res.status(400).json({
        error: 'Missing one or more required fields inside body: referring_domains, domain_rating, backlinks',
      });
    }
  }

  try {
    const image = await loadImage(backgroundImageFile);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0);

    const fontSize = 16;
    const fontFamily = 'Arial';
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'top';

    const x_referring = 30;
    const x_rating_center = 400;
    const x_backlinks_center = 650;
    const start_y = 135;
    const row_height = 30;
    const margin_left = 40;
    const row_width = 720;
    const padding_top = 8;

    // Draw the id on top (or wherever you want)
    ctx.font = `bold 24px ${fontFamily}`;
    ctx.fillText(id, 30, 30);

// Reset font for the rest of the text
    ctx.font = `${fontSize}px ${fontFamily}`;


    body.slice(0, 5).forEach((row, idx) => {
      const y = start_y + idx * row_height;

      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin_left - 20, y + row_height);
      ctx.lineTo(margin_left + row_width, y + row_height);
      ctx.stroke();

      ctx.fillText(String(row.referring_domains), x_referring, y + padding_top);

      const ratingText = String(row.domain_rating);
      const ratingWidth = ctx.measureText(ratingText).width;
      ctx.fillText(ratingText, x_rating_center - ratingWidth / 2, y + padding_top);

      const backlinksText = String(row.backlinks);
      const backlinksWidth = ctx.measureText(backlinksText).width;
      ctx.fillText(backlinksText, x_backlinks_center - backlinksWidth / 2, y + padding_top);
    });

    const buffer = canvas.toBuffer('image/png');

    res.set('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

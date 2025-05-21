const PImage = require('pureimage');
const fs = require('fs');
const path = require('path');

// Register font
const fontPath = path.join(__dirname, '../arial.ttf');
if (fs.existsSync(fontPath)) {
  PImage.registerFont(fontPath, 'Arial').loadSync();
} else {
  console.warn('Arial font not found, using default font');
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { id, body } = JSON.parse(event.body);

    if (!id || !Array.isArray(body) || body.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    for (const row of body) {
      if (
        row.referring_domains === undefined ||
        row.domain_rating === undefined ||
        row.backlinks === undefined
      ) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Each row must include referring_domains, domain_rating, backlinks',
          }),
        };
      }
    }

    // Create canvas (adjust size to match your design)
    const width = 800;
    const height = 600;
    const img = PImage.make(width, height);
    const ctx = img.getContext('2d');

    // Background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = 'black';
    ctx.font = "24pt Arial";
    ctx.fillText(`ID: ${id}`, 30, 30);

    // Table data
    ctx.font = "16pt Arial";

    const x_referring = 30;
    const x_rating_center = 400;
    const x_backlinks_center = 650;
    const start_y = 100;
    const row_height = 40;
    const padding_top = 10;

    body.slice(0, 5).forEach((row, idx) => {
      const y = start_y + idx * row_height;

      // Separator line
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, y + row_height);
      ctx.lineTo(width - 10, y + row_height);
      ctx.stroke();

      ctx.fillStyle = 'black';
      ctx.fillText(String(row.referring_domains), x_referring, y + padding_top);

      const ratingText = String(row.domain_rating);
      const ratingWidth = ctx.measureText(ratingText).width;
      ctx.fillText(ratingText, x_rating_center - ratingWidth / 2, y + padding_top);

      const backlinksText = String(row.backlinks);
      const backlinksWidth = ctx.measureText(backlinksText).width;
      ctx.fillText(backlinksText, x_backlinks_center - backlinksWidth / 2, y + padding_top);
    });

    // Encode to buffer
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    await PImage.encodePNGToStream(img, bufferStream);

    const chunks = [];
    for await (const chunk of bufferStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/png' },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server Error' }),
    };
  }
};

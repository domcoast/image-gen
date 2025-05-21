import express from 'express';
import generateImage from './api/generate-image.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.post('/api/generate-image', generateImage);

app.get('/', (req, res) => {
  res.send('Image generation API is running!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

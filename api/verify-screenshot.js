export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, mediaType } = req.body;
  if (!image) return res.status(400).json({ isValid: false, viewCount: 0, reason: 'No image provided.' });

  try {
    const params = new URLSearchParams();
    params.append('apikey', process.env.OCR_SPACE_API_KEY);
    params.append('base64Image', `data:${mediaType || 'image/jpeg'};base64,${image}`);
    params.append('OCREngine', '2');
    params.append('scale', 'true');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      const msg = Array.isArray(data.ErrorMessage) ? data.ErrorMessage[0] : data.ErrorMessage;
      return res.status(200).json({ isValid: false, viewCount: 0, reason: msg || 'Could not read this image. Please try a clearer screenshot.' });
    }

    const text = (data.ParsedResults || []).map(r => r.ParsedText).join(' ');
    const numbers = (text.match(/\b\d{1,5}\b/g) || []).map(n => parseInt(n, 10)).filter(n => n > 0);

    if (!numbers.length) {
      return res.status(200).json({ isValid: false, viewCount: 0, reason: 'No numbers were detected in this screenshot. Please upload a clearer image showing your viewer count.' });
    }

    // Heuristic only — OCR can't confirm this is actually a WhatsApp viewers screen.
    // We take the largest detected number as the best guess; the user confirms/corrects it client-side.
    const viewCount = Math.max(...numbers);

    return res.status(200).json({ isValid: true, viewCount, reason: 'Detected from screenshot text — please confirm this number is correct.' });

  } catch (err) {
    console.error('OCR error:', err.message);
    return res.status(500).json({ isValid: false, viewCount: 0, reason: 'Scanning service error. Please try again.' });
  }
}

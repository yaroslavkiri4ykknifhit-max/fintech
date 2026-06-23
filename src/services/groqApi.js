// src/services/groqApi.js

const GROQ_API_KEY = localStorage.getItem('override_groq_api_key') || import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = localStorage.getItem('override_groq_model') || import.meta.env.VITE_GROQ_MODEL || 'llama-3.2-11b-vision-preview';

/**
 * Utility to convert file to base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Scan a receipt image via Groq Vision API
 * @param {string} base64Image - Base64 data URL of the image
 */
export const scanReceipt = async (base64Image) => {
  if (!GROQ_API_KEY) {
    console.log('Groq API Key not found. Simulating receipt scan (Mock Mode)...');
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Array of fun mock receipt results for testing
    const mockReceipts = [
      { amount: 50.00, merchant: 'Food Market', date: new Date().toISOString().split('T')[0], category: 'Food' },
      { amount: 145.00, merchant: 'Dribbble Pro', date: new Date().toISOString().split('T')[0], category: 'Entertainment' },
      { amount: 10.00, merchant: 'GitHub Inc', date: new Date().toISOString().split('T')[0], category: 'Shopping' },
      { amount: 60.00, merchant: 'YouTube Premium', date: new Date().toISOString().split('T')[0], category: 'Entertainment' },
      { amount: 120.50, merchant: 'Supermarket Express', date: new Date().toISOString().split('T')[0], category: 'Food' }
    ];

    const randomReceipt = mockReceipts[Math.floor(Math.random() * mockReceipts.length)];
    return {
      success: true,
      data: randomReceipt,
      mock: true
    };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this receipt image. Extract the total purchase amount, merchant name (store name), and date.
                Return ONLY a JSON object with this format. Do not write markdown tags.
                {
                  "amount": 0.00, // Total cost as a float number
                  "merchant": "Name of Store", // String
                  "date": "YYYY-MM-DD", // Date format, or current date if not found
                  "category": "Food" // Choose one: 'Food', 'Shopping', 'Entertainment', 'Subscription', 'Other'
                }`
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq API returned HTTP ${response.status}: ${errBody}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from Groq API');
    }

    const parsedData = JSON.parse(content);
    return {
      success: true,
      data: {
        amount: parseFloat(parsedData.amount) || 0.0,
        merchant: parsedData.merchant || 'Unknown Merchant',
        date: parsedData.date || new Date().toISOString().split('T')[0],
        category: parsedData.category || 'Other'
      },
      mock: false
    };

  } catch (error) {
    console.error('Groq Scan Error:', error);
    throw error;
  }
};

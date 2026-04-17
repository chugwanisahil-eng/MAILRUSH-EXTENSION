const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;
console.log('Key length:', key ? key.length : 0);
console.log('Key start:', key ? key.substring(0, 5) : 'NONE');

async function run() {
    const genAI = new GoogleGenerativeAI(key);
    try {
        console.log('Trying gemini-1.5-flash...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Hi');
        console.log('Success:', result.response.text());
    } catch (e) {
        console.error('Flash Error:', e.message);
    }

    try {
        console.log('Trying gemini-pro...');
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Hi');
        console.log('Success:', result.response.text());
    } catch (e) {
        console.error('Pro Error:', e.message);
    }
}
run();

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Using API Key:', process.env.GEMINI_API_KEY ? 'CONFIGURED (' + process.env.GEMINI_API_KEY.substring(0, 8) + '...)' : 'MISSING');

    try {
        // There isn't a direct listModels method on the client instance in some versions, 
        // but let's try a simple generation to see if we get a more descriptive error, or try accessing a model.
        // Actually, the best way to test connectivity is to run a simple prompt.

        console.log('Testing gemini-1.5-flash...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Hello');
        console.log('Success! Response:', result.response.text());

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('StatusText:', error.response.statusText);
        }
    }
}

listModels();

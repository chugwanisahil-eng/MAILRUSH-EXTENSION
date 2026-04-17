const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;

console.log('--- API DIAGNOSTIC ---');
console.log('Key Status:', key ? 'Present' : 'Missing');
if (key) {
    console.log('Key Prefix:', key.substring(0, 5) + '...');
    console.log('Key Length:', key.length);
}

const genAI = new GoogleGenerativeAI(key || '');

async function testModel(modelName) {
    console.log(`\nTesting Model: ${modelName}`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Test.');
        console.log(`✅ SUCCESS working with ${modelName}`);
        console.log('Response:', result.response.text());
        return true;
    } catch (e) {
        console.log(`❌ FAILED with ${modelName}`);
        console.log('Error Message:', e.message);
        return false;
    }
}

async function run() {
    console.log('\nRunning tests...');

    const flashWorking = await testModel('gemini-1.5-flash');
    const proWorking = await testModel('gemini-pro');

    if (!flashWorking && !proWorking) {
        console.log('\n!!! BOTH MODELS FAILED !!!');
        console.log('Possible causes:');
        console.log('1. API Key is invalid.');
        console.log('2. "Google Generative AI API" is not enabled in Google Cloud Console.');
        console.log('3. Billing is not enabled (for paid plans).');
        console.log('4. Region restrictions (if you are in Europe/UK, you might need a different setup).');
    }
}

run();

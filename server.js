// Gmail Polish Backend Server
// Express server that uses OpenRouter (Gemini/GPT/etc) to polish email content

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Gmail Polish API is running (OpenRouter)' });
});

// Polish email endpoint
app.post('/api/polish', async (req, res) => {
    try {
        const { emailContent, tone } = req.body;

        // ... validation ...
        if (!emailContent || typeof emailContent !== 'string' || emailContent.trim().length === 0) {
            return res.status(400).json({ error: 'Email content is required.' });
        }

        let toneInstruction = "Make the tone more professional but not overly formal";
        if (tone === 'Visual') toneInstruction = "Make the tone casual and relaxed"; // 'Visual' seems to be a typo in the UI or my memory, checking sidepanel.html next to be sure, assuming 'Casual'
        if (tone === 'Casual') toneInstruction = "Make the tone casual, relaxed, and conversational";
        if (tone === 'Friendly') toneInstruction = "Make the tone warm, friendly, and approachable";
        if (tone === 'Formal') toneInstruction = "Make the tone strictly professional, respectful, and formal";
        if (tone === 'Concise') toneInstruction = "Make the content extremely concise, direct, and to the point. Remove unnecessary words.";

        if (emailContent.length > 10000) {
            return res.status(400).json({
                error: 'Email content is too long. Maximum 10,000 characters.'
            });
        }

        const wordCount = emailContent.trim().split(/\s+/).length;
        if (wordCount < 10) {
            return res.status(400).json({
                error: `Please write minimum 10 words. You have written ${wordCount} words.`
            });
        }

        // Check if API key is configured
        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(500).json({
                error: 'Server configuration error: OPENROUTER_API_KEY not set.'
            });
        }

        console.log('Polishing email content...');
        console.log('Original length:', emailContent.length);

        // Create the prompt for polishing
        const prompt = `You are an expert email writing assistant. Your task is to polish and improve the following email draft to make it more professional, clear, and well-structured while maintaining the original intent and tone.

Guidelines:
- **TONE REQUIREMENT: ${toneInstruction}**
- Fix grammar, spelling, and punctuation errors
- Improve sentence structure and clarity
- Keep the same general length (unless "Concise" is requested)
- Preserve the original meaning and key points
- Don't add new information or change the core message

Email draft to polish:
"""
${emailContent}
"""

OUTPUT FORMAT:
Return the result strictly as valid JSON with two fields:
{
  "subject": "The polished subject line (create a new one if missing)",
  "body": "The polished email body (plaintext, no markdown signatures)"
}
Do not include any explanation, markdown formatting blocks (like \`\`\`json), or other text. ONLY the raw JSON string.`;

        // Call OpenRouter API
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "http://localhost:3000", // Optional, for including your app on openrouter.ai rankings.
                "X-Title": "MailRush Extension", // Optional. Shows in rankings on openrouter.ai.
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "openai/gpt-3.5-turbo", // Free tier model, very fast
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
            throw new Error('No content received from OpenRouter.');
        }

        let rawContent = data.choices[0].message.content.trim();

        // Cleanup if the AI wrapped it in markdown code blocks despite instructions
        rawContent = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        let parsedResult;
        try {
            parsedResult = JSON.parse(rawContent);
        } catch (e) {
            console.error('Failed to parse JSON response:', rawContent);
            // Fallback: treat entire content as body if parsing fails
            parsedResult = { subject: "Re: " + emailContent.substring(0, 30) + "...", body: rawContent };
        }

        console.log('Polished length:', parsedResult.body.length);
        console.log('Polish completed successfully');

        // Return the polished content
        res.json({
            polishedSubject: parsedResult.subject,
            polishedContent: parsedResult.body, // keeping key 'polishedContent' compatible-ish for now
            originalLength: emailContent.length
        });

    } catch (error) {
        console.error('Error polishing email:', error);

        res.status(500).json({
            error: 'Failed to polish email. Please try again.',
            details: error.message || error.toString()
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('📧 Gmail Polish API Server (OpenRouter)');
    console.log('='.repeat(50));
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log(`✓ Polish endpoint: http://localhost:${PORT}/api/polish`);
    console.log('='.repeat(50));

    if (!process.env.OPENROUTER_API_KEY) {
        console.warn('⚠️  WARNING: OPENROUTER_API_KEY is not set!');
        console.warn('   Please create a .env file with your API key.');
    } else {
        console.log('✓ OpenRouter API key configured');
    }

    console.log('\nPress Ctrl+C to stop the server\n');
});

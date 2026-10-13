# MAILRUSH - AI Email Enhancer
MY FIRST EXTENSION
A Chrome extension that integrates with Gmail to help you polish your email drafts using Google's Gemini AI. Transform casual or rough email drafts into professional, well-structured messages with just one click!

## ✨ Features

- **One-Click Polish**: Add a "Polish with AI" button directly in Gmail's compose interface
- **AI-Powered Enhancement**: Uses Google Gemini AI to improve grammar, clarity, and professionalism
- **Preserves Intent**: Maintains your original message while making it more polished
- **Real-time Processing**: Get polished emails in seconds
- **Beautiful UI**: Modern, gradient-based design that integrates seamlessly with Gmail
- **Configurable**: Customize API endpoint and settings through the extension popup

## 🚀 Quick Start

### Prerequisites

- Google Chrome browser
- Node.js (v14 or higher)
- A Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

#### 1. Set Up the Backend Server

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_actual_api_key_here

# Start the server
npm start
```

The server will start on `http://localhost:3000`

#### 2. Load the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension1` folder (the root folder, not the server folder)
5. The extension should now appear in your extensions list

#### 3. Use the Extension

1. Go to [Gmail](https://mail.google.com)
2. Click **Compose** to start a new email
3. Write your draft email (can be casual or rough)
4. Look for the **"Polish with AI"** button in the compose toolbar
5. Click it and watch your email transform!

## 📁 Project Structure

```
extension1/
├── manifest.json          # Chrome extension configuration
├── content.js            # Gmail integration script
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── styles.css            # Extension styles
├── icon16.png            # Extension icon (16x16)
├── icon48.png            # Extension icon (48x48)
├── icon128.png           # Extension icon (128x128)
├── server/               # Backend API server
│   ├── server.js         # Express server with Gemini AI
│   ├── package.json      # Node.js dependencies
│   ├── .env.example      # Environment variables template
│   └── .gitignore        # Git ignore rules
└── README.md             # This file
```

## 🔧 Configuration

### Backend Configuration

Edit `server/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

### Extension Configuration

Click the extension icon in Chrome to open the popup, where you can:
- View extension status
- Configure the backend API URL
- Read usage instructions

## 🎯 How It Works

1. **Content Script Injection**: The extension injects a content script into Gmail pages
2. **Button Integration**: A "Polish with AI" button is added to the compose toolbar
3. **Content Extraction**: When clicked, the extension extracts your draft email text
4. **API Call**: The content is sent to the backend server
5. **AI Processing**: The server uses Gemini AI to polish the email
6. **Content Replacement**: The polished version replaces your draft

## 🛠️ Development

### Running in Development Mode

```bash
# Backend (with auto-reload if using nodemon)
cd server
npm run dev

# For the extension, use Chrome's extension reload button
# or press Ctrl+R on chrome://extensions/
```

### API Endpoints

- **GET** `/health` - Health check endpoint
- **POST** `/api/polish` - Polish email content
  ```json
  {
    "emailContent": "your email draft here"
  }
  ```

## 🔒 Security Notes

- Never commit your `.env` file with real API keys
- The API key is stored server-side for security
- CORS is configured to accept requests from the extension
- Input validation prevents malicious content

## 🐛 Troubleshooting

### Extension not working?

1. **Check if the backend is running**: Visit `http://localhost:3000/health`
2. **Check browser console**: Open DevTools (F12) and look for errors
3. **Reload the extension**: Go to `chrome://extensions/` and click the reload icon
4. **Check permissions**: Make sure the extension has permission to access Gmail

### Backend errors?

1. **API Key**: Ensure `GEMINI_API_KEY` is set correctly in `.env`
2. **Dependencies**: Run `npm install` in the server directory
3. **Port conflict**: Change `PORT` in `.env` if 3000 is already in use
4. **Check logs**: The server logs detailed error messages to the console

### Button not appearing?

1. **Refresh Gmail**: Press F5 to reload the page
2. **Check Gmail URL**: Extension only works on `mail.google.com`
3. **Open compose window**: The button only appears when composing

## 📝 Usage Tips

- **Be specific**: The more context in your draft, the better the AI can polish it
- **Review output**: Always review the polished version before sending
- **Iterate**: You can click "Polish with AI" multiple times to refine further
- **Keep it reasonable**: Very long emails may take longer to process

## 🌟 Features Roadmap

- [ ] Support for multiple AI models
- [ ] Tone selection (formal, casual, friendly)
- [ ] Custom polish instructions
- [ ] Undo/redo functionality
- [ ] Side-by-side comparison view
- [ ] Support for other email clients

## 📄 License

MIT License - feel free to use and modify as needed!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 💡 Credits

Built with:
- [Google Gemini AI](https://ai.google.dev/)
- [Express.js](https://expressjs.com/)
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)

---

Made with ❤️ for better email communication

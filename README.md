<p align="center"><img src="public/apple-touch-icon.png" alt="ScrobbleDeck Logo" width="114"></p>
<h1 align="center">ScrobbleDeck</h1>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Vite-B73BFE?logo=vite&logoColor=FFD62E" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Cloudflare_Pages-F38020?logo=cloudflare&logoColor=white" alt="Deployed on Cloudflare Pages">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License MIT">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<p align="center">The ultimate aesthetic <a href="https://scrobbledeck.abdi.cc/" target="_blank">Last.fm widget generator</a>. Create beautiful, customizable, and real-time Last.fm widgets for your Notion workspace, GitHub Readme, or personal website. No coding required.</p>

## ✨ Features

- ⚡ **Real-Time Sync**: Syncs directly with the Last.fm API to show exactly what you are listening to, the moment you are listening to it.
- 🎨 **Aesthetic Presets**: Comes with stunning layouts including Apple Music, Spotify, Vinyl interfaces, and retro styles.
- 🛠️ **Limitless Customization**: Full control over colors, gradients, rounded corners, data limits, and text formatting.
- 🌐 **Universal Embed**: Generates a standard `<iframe>` or URL that can be dropped into Notion, GitHub Readmes, Obsidian, or any custom website.
- 💸 **100% Free**: No hidden fees, no subscriptions, no paywalls. Completely free forever.

## Table of Contents

- [Features](#-features)
- [Getting Started](#-getting-started)
  - [Requirements](#requirements)
  - [Installation](#installation)
- [Usage Examples](#-usage-examples)
- [Contributing](#-contributing)
- [Support](#-support)
- [License & Disclaimer](#%EF%B8%8F-license)

## 🚀 Getting Started

### Requirements

- Node.js v18 or higher
- npm, pnpm, or yarn

### Installation

1. Clone the repository to your local machine:

   ```bash
   git clone https://github.com/abdipr/scrobbledeck.git
   cd scrobbledeck
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. **Local Development**:
   Start the development server:

   ```bash
   npm run dev
   ```

   Navigate to `http://localhost:5173` to view the app.

4. **Deploy to Vercel**:
   Deploying is simple. Click the button below to deploy this repository directly to your Vercel account.<br>
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fabdipr%2Fscrobbledeck%2F&redirect-url=https%3A%2F%2Fgithub.com%2Fabdipr%2Fscrobbledeck%2F)

## 🌐 Usage Examples

ScrobbleDeck does not require you to host anything yourself! Just visit the [Live App](https://scrobbledeck.abdi.cc/), type your Last.fm username, configure the style, and copy the embed code.

### Example 1: Notion Workspace

1. Copy the generated URL from ScrobbleDeck.
2. In Notion, type `/embed` and paste the URL.
3. Resize the block to perfectly fit your new widget.

### Example 2: GitHub Readme

Use the generated markdown format:

```md
[![My Last.fm Widget](https://scrobbledeck.abdi.cc/widget?username=YOUR_USERNAME&theme=dark)](https://last.fm/user/YOUR_USERNAME)
```

_(Note: Interactive layouts like the spinning vinyl require iframe support, which GitHub Readmes do not natively support. For GitHub, use our image-safe themes)._

### Example 3: Personal Website / HTML

Copy the generated `<iframe>` code directly into your HTML:

```html
<iframe
  src="https://scrobbledeck.abdi.cc/widget?username=YOUR_USERNAME&theme=dark"
  width="100%"
  height="200"
  frameborder="0"
></iframe>
```

## 🌱 Contributing

Contributions are welcome! If you want to add a new aesthetic layout, PRs are wide open. To contribute:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Submit a pull request.

## ✨ Support

If you like this project, please star on this repository, thank you ⭐<br>
You can support me by:<br>
<a href="https://trakteer.id/abdipr" target="_blank"><img id="wse-buttons-preview" src="https://cdn.trakteer.id/images/embed/trbtn-red-1.png?date=18-11-2023" height="40" style="border: 0px; height: 40px;" alt="Trakteer Saya"></a>
<a href="https://saweria.co/abdipr" target="_blank"><img height="42" src="https://files.catbox.moe/fwpsve.png"></a>
<a href="https://www.buymeacoffee.com/abdipr" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 40px !important;width: auto !important;" ></a>

## ⚖️ License

This project is licensed under the `MIT License`. See the [LICENSE](https://github.com/abdipr/scrobbledeck/blob/main/LICENSE) file for more information.

## ⚠️ Disclaimer

This is an unofficial project. "Last.fm" and its logos are trademarks of CBS Interactive. This project is not affiliated with or endorsed by Last.fm. Developers using this widget must follow the applicable API regulations by Last.fm and are prohibited from abusing this project for personal benefits.

[⬆️ Back to Top](#scrobbledeck)

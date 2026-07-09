# NoteSphere 3D 🌌

> A futuristic, interactive 3D spatial workspace designed to redefine how you organize ideas, structure workflows, and spark creativity in three dimensions.

NoteSphere 3D breaks the barrier of flat, two-dimensional interfaces by offering a spatial, glassmorphic canvas where ideas can float, cluster, and crystallize. Equipped with seamless Google Cloud Sync and state-of-the-art server-side Gemini AI integration, it serves as your ultimate interactive brainstorming playground.

---

## ✨ Key Features

### 🌌 1. Spatial 3D Workspace
* **Dynamic Canvas:** Arrange, spin, and depth-adjust elegant, semi-transparent glass sticky notes in high-performance interactive space.
* **Orbit Navigation:** Rotate the camera freely to observe your system of thoughts from any perspective.
* **Spheres of Thought:** Group notes by focus category or "spheres" and easily filter your view.

### 🧠 2. Gemini AI Brainstorming
* **Instant Ideation:** Stuck on an idea? Prompt the integrated server-side Google Gemini assistant to populate new thoughts directly onto your active canvas.
* **Aesthetic Placement:** Let the AI spawn coordinates organically in space so you can expand your brainstorming clusters.

### ☁️ 3. Secure Firebase Cloud Sync
* **Durable Persistence:** Securely back up your notes, coordinates, pinned states, and color selections to Cloud Firestore in real-time.
* **Google Authentication:** Connect using Google Sign-In with strict privacy guardrails.
* **Interactive Terms of Service:** Integrated clear user consent and agreement flow directly during the connection setup.

### 🎨 4. Exquisite Premium UI & Responsive Form
* **Glassmorphism Design:** Styled with carefully designed blurred backdrops, rich borders, and elegant negative space.
* **Dynamic Modals:** Responsive **About note-sphere** panel with usage tips and deep spatial capabilities guides.
* **High Contrast Accessibility:** Enhanced typographic contrast and clean light/dark styles suitable for deep, late-night thinking sessions.

---

## 🎮 Spatial Controls & Navigation

| Action | Control Shortcut | Description |
| :--- | :--- | :--- |
| **Orbit Camera** | `Right-Click + Drag` or `Ctrl + Left-Click + Drag` | Rotates the 3D grid and notes space. |
| **Pan Camera** | `Shift + Right-Click + Drag` | Moves the viewpoint left, right, up, or down. |
| **Zoom / Focus Depth** | `Scroll Wheel` or `Two-finger Pinch` | Zooms into or out of your active thought cluster. |
| **Move Note** | `Left-Click Note + Drag` | Drags notes around the active horizontal plane. |
| **Configure Note** | `Single Left-Click` | Opens the premium editor to alter colors, spheres, tags, or to pin/favorite thoughts. |

---

## 🛠️ Technology Stack

NoteSphere 3D is built on high-performance, industry-leading technologies:
* **Frontend:** React 18+, Vite, TypeScript, Tailwind CSS
* **Animations:** Motion (Framer Motion)
* **Backend & Sync:** Firebase (Authentication, Cloud Firestore)
* **Intelligence:** Server-side Google Gemini API (`@google/genai` SDK)
* **Icons:** Lucide React

---

## 🚀 Getting Started

Follow these steps to run NoteSphere 3D locally or configure it for production deployment.

### 📋 Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18 or higher)
* [npm](https://www.npmjs.com/) or yarn

### 📥 1. Installation
Clone the repository and install all project dependencies:
```bash
# Clone the repository
git clone <your-repository-url>
cd notesphere-3d

# Install packages
npm install
```

### ⚙️ 2. Environment Variables Configuration
Create a `.env` file in the root directory (based on `.env.example`) and fill in your secure API keys and Firestore credentials:
```env
# Google Gemini API Key (Server-Side Only)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web Application Client Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 💻 3. Development Server
Boot up the fast local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to experience NoteSphere 3D.

### 🏗️ 4. Build for Production
To bundle a production-ready build:
```bash
npm run build
```
The static, fully optimized production assets will be generated inside the `/dist` directory.

---

## ☁️ Deploying to Production

This workspace is designed to be easily deployed on standard cloud platforms:

### 🐋 Deploying to Google Cloud Run (Recommended)
NoteSphere 3D is pre-configured to build and deploy effortlessly using Google Cloud Run:
1. Ensure your container port is configured to run on `3000`.
2. Deploy the container and inject your secret `GEMINI_API_KEY` environment variable.

### 📦 Static Hosting (Vercel, Netlify, or GitHub Pages)
Because NoteSphere 3D compiles to an ultra-fast SPA (Single Page Application):
1. Connect your repository to **Vercel** or **Netlify**.
2. Configure the build command as `npm run build` and output directory as `dist`.
3. Add your `VITE_` Firebase public variables inside the hosting dashboard.

---

## 🔒 Privacy & License

NoteSphere 3D respects your absolute ownership over your thoughts. All brainstorming notes are stored in your secure private database. 

*Crafted for perfect, fluid productivity. Organize your universe of ideas in 3D.*

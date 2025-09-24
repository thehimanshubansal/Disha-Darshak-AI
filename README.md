# Disha Darshak AI 🚀

### Your AI-Powered Career Co-pilot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MVP Link](https://img.shields.io/badge/MVP-Live-green)](https://disha-darshak-ai--disha-darshak.us-central1.hosted.app/)
[![YouTube](https://img.shields.io/badge/You-Tube-red)](https://youtu.be/rANgOXT7_Y0)

**Disha Darshak AI** is a comprehensive, AI-driven web application designed to guide students and early-career professionals through the complexities of career planning. It transforms overwhelming choices into a clear, personalized, and actionable journey, leveraging the power of Google's Vertex AI to provide expert-level guidance at scale.

![Disha Darshak AI Project Banner](https://placehold.co/1200x600/1e1e2e/7f5af0?text=Disha+Darshak+AI)


---

## 📍 Table of Contents

- [The Problem We Solve](#-the-problem-we-solve)
- [Key Features](#-key-features)
- [Live Demo](#-live-demo)
- [Screenshots](#-screenshots)
- [Technology Stack](#-technology-stack)
- [🧠 AI & Genkit Integration](#-ai--genkit-integration)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
- [Project Structure](#-project-structure)
- [Future Roadmap](#-future-roadmap)
- [License](#-license)
- [Contact](#-contact)

---

## 🧩 The Problem We Solve

Navigating the early stages of a career is often a confusing and stressful experience. Young professionals face a flood of information, unclear career paths, and immense pressure to make the "right" decisions. Disha Darshak AI addresses these pain points by providing a centralized platform that offers:

-   **Clarity over Confusion:** Replacing guesswork with data-driven, personalized recommendations.
-   **Personalization:** Using Generative AI to deliver guidance tailored to each user's unique profile.
-   **Confidence Building:** Offering tools to practice and prepare for real-world challenges like interviews.
-   **Actionable Guidance:** Moving beyond simple advice to provide structured, step-by-step roadmaps.

---

## ✨ Key Features

-   **📝 AI Skill-set Finder:** A multi-step assessment that analyzes a user's skills and interests to recommend the top 3 career paths. It then generates a detailed, personalized roadmap for the user's chosen role, including skills to develop, learning resources, and project ideas.

-   **🔥 TorchMyResume (Rank & Roast):**
    -   **Rank:** Upload a resume and get an instant, AI-generated score on its effectiveness for a specific job role, complete with strengths, weaknesses, and missing keywords.
    -   **Roast:** Get brutally honest, humorous, and surprisingly insightful feedback to make your resume unforgettable.

-   **🤖 AI Mock Interview:** A realistic voice-enabled interview simulation tailored to a specific job role and difficulty level. After the session, the user receives a comprehensive evaluation of their performance, including a soft-skill score and detailed feedback.

-   **💬 AI Career Advisor Chat:** A context-aware chatbot that uses the user's saved resume and profile data to provide personalized advice on demand.

-   **📊 Live Job Trends:** Fetches and displays real-time job market data using the Adzuna API, helping users understand which career fields are currently in high demand.

-   **👥 Community Platform:** A dedicated social space for users to create posts, share professional insights, follow peers, and build a supportive network.

-   **🎙️ Disha Talks:** An curated content hub featuring inspirational articles and mock podcasts (success stories, expert interviews) on career growth and industry trends.

-   **👤 Comprehensive User Profile:** A central dashboard that stores a user's personal details, chosen career path, and a complete history of all their assessments, resume reviews, and mock interviews, creating a persistent record of their career journey.

---

## 🌐 Live Demo

Check out the live, deployed version of the application here:
**[Disha-Darshak-AI](https://disha-darshak-ai--disha-darshak.us-central1.hosted.app/)**

---

## 🛠️ Technology Stack

This project is built with a modern, scalable, and type-safe technology stack.

-   **Frontend:**
    -   **Framework:** [Next.js](https://nextjs.org/) 14 (with App Router)
    -   **Language:** [TypeScript](https://www.typescriptlang.org/)
    -   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
    -   **State Management:** React Context API
    -   **Animation:** [Framer Motion](https://www.framer.com/motion/)

-   **Backend & AI Integration:**
    -   **AI Framework:** [Genkit (Google's Open Source Framework)](https://firebase.google.com/docs/genkit)
    -   **Generative AI Model:** [Google Gemini 2.5 Pro, 2.5 Flash, Generative AI TTS](https://deepmind.google/technologies/gemini/)
    -   **Server Environment:** Node.js
    -   **API:** Next.js API Routes

-   **Database & Authentication:**
    -   **Database:** [Firebase Realtime Database](https://firebase.google.com/docs/database) (for user profiles, chat history, and evaluation results)
    -   **Authentication:** [Firebase Authentication](https://firebase.google.com/docs/auth)

-   **Deployment:**
    -   **Hosting:** [Firebase Hosting](https://firebase.google.com/docs/hosting)

---

## 🧠 AI & Genkit Integration

The core intelligence of this application is powered by **Genkit**, which orchestrates calls to the **Google Gemini Pro** model. Each AI feature is implemented as a distinct, type-safe "flow."

-   **`path-finder.ts`:**
    -   `geminiExplainFull`: Analyzes quiz answers to generate the initial top 3 detailed career recommendations.
    -   `geminiGenerateRoadmap`: Takes a user's chosen role and profile to create the comprehensive, step-by-step career roadmap.

-   **`rank-resume.ts` & `roast-resume.ts`:**
    -   These flows utilize Gemini's multi-modal capabilities to process an uploaded PDF resume. They analyze the document's content against a target job role to generate structured JSON feedback for ranking and roasting.

-   **`mock-interview-flow.ts`:**
    -   Manages a multi-turn conversational interview. It maintains the history of the conversation and uses the user's resume context to ask relevant questions. At the end of the interview, it generates a final, structured JSON evaluation of the user's performance.

-   **`career-advice-chatbot.ts`:**
    -   A straightforward flow that takes a user's question and resume text to provide a context-aware, personalized response.

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Git](https://git-scm.com/)
-   A Firebase project with Authentication and Realtime Database enabled.

### Local Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/thehimanshubansal/Disha-Darshak-AI.git
    cd Disha-Darshak-AI
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    -   Create a file named `.env` in the root of the project.
    -   Add the following keys, filling in your own credentials from your Firebase and Adzuna projects.
    ```env
    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
    NEXT_PUBLIC_FIREBASE_APP_ID=
    NEXT_PUBLIC_FIREBASE_DATABASE_URL=

    # Adzuna API (for Job Trends)
    ADZUNA_APP_ID=
    ADZUNA_APP_KEY=

    # Google Cloud (for local Genkit development)
    GOOGLE_CLOUD_PROJECT_ID=
    GOOGLE_CLOUD_LOCATION=
    ```

4.  **Set up Google Cloud Credentials for Genkit:**
    -   Create a service account in your Google Cloud project and download the JSON key file.
    -   Place this file in the root of the project and name it `secret-account-key.json`.
    -   **Important:** Ensure your `.gitignore` file includes `secret-account-key.json` to prevent committing secrets.

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) to view it in the browser.

---

## 📂 Project Structure

The project follows a standard Next.js App Router structure, with a clear separation of concerns.

```
Disha-Darshak-AI/
├── src/
│   ├── ai/                 # All Genkit flows and AI logic
│   │   ├── flows/          # Individual AI features (ranking interview, etc.)
│   │   └── prompts/        # Markdown prompts for the AI models
│   ├── app/                # Next.js App Router pages and API routes
│   ├── components/         # Reusable React components
│   │   ├── career-compass/ # Core feature components
│   │   └── ui/             # Reusable UI elements from Shadcn
│   ├── contexts/           # Global state management (React Context)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions, constants, Firebase config
│   └── types/              # Global TypeScript types
├── docs/                   # Project documentation (e.g., blueprint.md)
├── public/                 # Static assets
└── ...                     # Config files (next.config.js, tailwind.config.ts, etc.)
```

---

## 🗺️ Future Roadmap

This project has a strong foundation with many possibilities for future expansion:

-   [ ] **Deeper Profile Analytics:** Create a dedicated analytics page to visualize a user's progress over time based on their saved evaluations.
-   [ ] **Expanded Community Features:** Implement post creation, following other users, and direct messaging to foster a professional network.
-   [ ] **Personalized Learning Paths:** Integrate with educational APIs to recommend specific courses based on a user's roadmap.
-   [ ] **Native Mobile App:** Develop a React Native or Flutter application for a seamless mobile experience.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📬 Team - Cipher Agents

1. Himanshu Bansal - [GitHub](https://github.com/thehimanshubansal)
2. Prasoon Sharma - [GitHub](https://github.com/Prof-chaos-5)
3. Sourav - [GitHub](https://github.com/Souraveng)
4. Swapn - - [GitHub](https://github.com/Swapn-Kumar)

📃 Project Link: [https://github.com/thehimanshubansal/Disha-Darshak-AI](https://github.com/thehimanshubansal/Disha-Darshak-AI)
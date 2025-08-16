# ThinkNote AI

The #1 AI Study & Learning Companion. Never cram blindly again.

## 🚀 Features

- **Voice Recording & Transcription** - Record lectures and get instant transcripts
- **AI-Powered Summaries** - Generate academic summaries and key concepts
- **Smart Archive** - Organize and search your study materials with tags
- **ThinkSpace** - Interactive study sessions with Socratic and Study modes
- **Voice Input/Output** - Natural conversation with AI using speech recognition and synthesis

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: PostgreSQL with Prisma ORM
- **AI Services**: OpenAI (Whisper, GPT-4)
- **File Storage**: AWS S3
- **Validation**: Zod
- **Utilities**: nanoid, pdfkit

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account
- OpenAI API key
- AWS S3 bucket

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ThinkNote-AI-1
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/thinknote_ai"

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

The application uses the following main models:

- **User** - Linked to Clerk authentication
- **Document** - Uploaded files with metadata
- **Transcript** - Processed audio/text content
- **Summary** - AI-generated summaries
- **StudySession** - ThinkSpace interactions
- **Tag** - Content organization system

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── upload/            # File upload page
│   ├── archive/           # Document archive
│   ├── thinkspace/        # AI study sessions
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── AppNav.tsx         # Navigation
│   └── RecordPanel.tsx    # Voice recording
├── lib/                   # Utility libraries
│   ├── prisma.ts          # Database client
│   ├── s3.ts             # AWS S3 operations
│   ├── openai.ts         # OpenAI API client
│   ├── validations.ts    # Zod schemas
│   └── utils.ts          # Helper functions
└── types/                 # TypeScript types
```

## 🔌 API Endpoints

- `POST /api/transcribe` - Audio transcription
- `POST /api/summarize` - Generate summaries
- `GET /api/archive` - List user documents
- `POST /api/archive/update` - Update document metadata
- `DELETE /api/archive/delete` - Delete documents

## 🎯 Key Features

### Voice Recording
- Browser-based audio recording using MediaRecorder API
- Support for multiple audio formats
- Real-time transcription with OpenAI Whisper

### AI Summarization
- Academic summaries with key concepts
- Bullet-point summaries for quick review
- Context-aware content analysis

### Smart Organization
- Tag-based content categorization
- Advanced search and filtering
- Automatic metadata extraction

### ThinkSpace
- Socratic mode for exploration
- Study mode for focused learning
- Voice input/output support
- Conversation history tracking

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

## 🔮 Roadmap

- [ ] PDF text extraction
- [ ] Collaborative study sessions
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Integration with learning management systems

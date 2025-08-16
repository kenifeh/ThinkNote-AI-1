-- CreateEnum
CREATE TYPE "private"."Role" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "private"."Strategy" AS ENUM ('ELENCHUS', 'APORIA', 'MAIEUTICS', 'DIALECTICAL', 'SYNTHESIS');

-- CreateEnum
CREATE TYPE "private"."ThinkMode" AS ENUM ('SOCRATIC', 'STUDY');

-- CreateTable
CREATE TABLE "private"."User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private"."Lecture" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audioUrl" TEXT,
    "audioExpiresAt" TIMESTAMP(3),
    "transcript" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private"."ThinkspaceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "mode" "private"."ThinkMode" NOT NULL DEFAULT 'SOCRATIC',
    "contextId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThinkspaceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private"."ThinkspaceMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "private"."Role" NOT NULL,
    "content" TEXT NOT NULL,
    "questionTier" INTEGER,
    "strategy" "private"."Strategy",
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThinkspaceMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private"."ThinkspaceFeedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messageId" TEXT,
    "rating" INTEGER NOT NULL,
    "tag" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThinkspaceFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "private"."User"("clerkId");

-- AddForeignKey
ALTER TABLE "private"."Lecture" ADD CONSTRAINT "Lecture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "private"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private"."ThinkspaceSession" ADD CONSTRAINT "ThinkspaceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "private"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private"."ThinkspaceMessage" ADD CONSTRAINT "ThinkspaceMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "private"."ThinkspaceSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private"."ThinkspaceFeedback" ADD CONSTRAINT "ThinkspaceFeedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "private"."ThinkspaceSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

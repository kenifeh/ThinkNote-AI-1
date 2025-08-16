/*
  Warnings:

  - You are about to drop the column `clerkId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Lecture` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ThinkspaceFeedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ThinkspaceMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ThinkspaceSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "private"."Lecture" DROP CONSTRAINT "Lecture_userId_fkey";

-- DropForeignKey
ALTER TABLE "private"."ThinkspaceFeedback" DROP CONSTRAINT "ThinkspaceFeedback_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "private"."ThinkspaceMessage" DROP CONSTRAINT "ThinkspaceMessage_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "private"."ThinkspaceSession" DROP CONSTRAINT "ThinkspaceSession_userId_fkey";

-- DropIndex
DROP INDEX "private"."User_clerkId_key";

-- AlterTable
ALTER TABLE "private"."User" DROP COLUMN "clerkId",
DROP COLUMN "updatedAt",
ADD COLUMN     "email" TEXT;

-- DropTable
DROP TABLE "private"."Lecture";

-- DropTable
DROP TABLE "private"."ThinkspaceFeedback";

-- DropTable
DROP TABLE "private"."ThinkspaceMessage";

-- DropTable
DROP TABLE "private"."ThinkspaceSession";

-- DropEnum
DROP TYPE "private"."Role";

-- DropEnum
DROP TYPE "private"."Strategy";

-- DropEnum
DROP TYPE "private"."ThinkMode";

-- CreateTable
CREATE TABLE "private"."ArchiveItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audioUrl" TEXT,
    "transcript" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "audioExpires" TIMESTAMP(3),

    CONSTRAINT "ArchiveItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "private"."ArchiveItem" ADD CONSTRAINT "ArchiveItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "private"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

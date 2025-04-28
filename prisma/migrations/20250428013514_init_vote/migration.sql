-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "participant" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

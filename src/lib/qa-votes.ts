import { prisma } from "@/lib/prisma";

export async function getVoteScore(answerId: string): Promise<number> {
  const result = await prisma.vote.aggregate({
    where: { answerId },
    _sum: { value: true },
  });
  return result._sum.value ?? 0;
}

export async function getVoteScores(
  answerIds: string[]
): Promise<Map<string, number>> {
  if (answerIds.length === 0) return new Map();

  const aggregates = await prisma.vote.groupBy({
    by: ["answerId"],
    where: { answerId: { in: answerIds } },
    _sum: { value: true },
  });

  return new Map(
    aggregates.map((row) => [row.answerId, row._sum.value ?? 0])
  );
}

export type AnswerSortItem = {
  id: string;
  isAccepted: boolean;
  isExpertVerified: boolean;
  voteCount: number;
  createdAt: string;
};

export function sortAnswers<T extends AnswerSortItem>(answers: T[]): T[] {
  return [...answers].sort((a, b) => {
    if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
    if (a.voteCount !== b.voteCount) return b.voteCount - a.voteCount;
    if (a.isExpertVerified !== b.isExpertVerified) {
      return a.isExpertVerified ? -1 : 1;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

import type { MarketContract } from "../wager/types";
import type { CourseContext } from "../wager/types";

/* =========================
   HELPERS
========================= */

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function computeCourseHandicap(
  handicapIndex: number,
  course: CourseContext
): number {
  const { slopeRating, courseRating, par } = course;

  return (
    handicapIndex * (slopeRating / 113) +
    (courseRating - par)
  );
}

function computeExpectedGross(
  course: CourseContext,
  courseHandicap: number
): number {
  return course.courseRating + courseHandicap;
}

/* =========================
   MAIN CONTRACT GENERATOR
========================= */

export function generateContractsForMarket(params: {
  marketId: string;
  participants: {
    id: string;
    name: string;
    handicapIndex: number;
  }[];
  courseContext: CourseContext;
}): MarketContract[] {
  const { marketId, participants, courseContext } =
    params;

  return participants.map((participant) => {
    const courseHandicap = computeCourseHandicap(
      participant.handicapIndex,
      courseContext
    );

    const expectedGross = computeExpectedGross(
      courseContext,
      courseHandicap
    );

    const roundedLine = roundToHalf(expectedGross);

    return {
      id: crypto.randomUUID(),
      marketId,
      participantId: participant.id,
      participantName: participant.name,
      line: roundedLine,
      createdAt: new Date().toISOString(),
    };
  });
}
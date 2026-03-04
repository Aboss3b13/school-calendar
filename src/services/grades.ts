import { GradeItem } from '../types/models';

interface SubjectAverage {
  subject: string;
  average: number;
  roundedAverage: number;
  totalWeight: number;
  entries: number;
}

export function toSubjectKey(subject: string) {
  return subject.trim().toUpperCase();
}

/** Round a grade to the nearest 0.5 */
export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export function computeGrade(points: number, maxPoints: number) {
  const safePoints = Math.max(0, points);
  const safeMax = Math.max(1, maxPoints);
  return Math.min(6, Math.max(1, 1 + (5 * safePoints) / safeMax));
}

export function weightedAverage(grades: GradeItem[]) {
  if (grades.length === 0) {
    return null;
  }

  const totalWeight = grades.reduce((sum, grade) => sum + Math.max(0.01, grade.weight), 0);
  if (totalWeight <= 0) {
    return null;
  }

  const weightedSum = grades.reduce(
    (sum, grade) => sum + grade.grade * Math.max(0.01, grade.weight),
    0,
  );

  return weightedSum / totalWeight;
}

export function pointsPercent(grades: GradeItem[]) {
  if (grades.length === 0) {
    return null;
  }

  const points = grades.reduce((sum, grade) => sum + Math.max(0, grade.points), 0);
  const maxPoints = grades.reduce((sum, grade) => sum + Math.max(1, grade.maxPoints), 0);

  if (maxPoints <= 0) {
    return null;
  }

  return (100 * points) / maxPoints;
}

/**
 * Compute per-subject averages, returning both the unrounded and rounded (0.5) averages.
 */
export function subjectAverages(grades: GradeItem[]): SubjectAverage[] {
  const groups = new Map<string, GradeItem[]>();

  grades.forEach((grade) => {
    const key = toSubjectKey(grade.subject);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(grade);
  });

  const summaries: SubjectAverage[] = [];
  groups.forEach((subjectGrades, subject) => {
    const totalWeight = subjectGrades.reduce((sum, grade) => sum + Math.max(0.01, grade.weight), 0);
    const weightedSum = subjectGrades.reduce(
      (sum, grade) => sum + grade.grade * Math.max(0.01, grade.weight),
      0,
    );

    const avg = totalWeight > 0 ? weightedSum / totalWeight : 0;

    summaries.push({
      subject,
      average: avg,
      roundedAverage: roundToHalf(avg),
      totalWeight,
      entries: subjectGrades.length,
    });
  });

  return summaries.sort((left, right) => left.subject.localeCompare(right.subject));
}

/**
 * Compute the overall weighted average across all subjects.
 * Returns { rounded, unrounded } where:
 *  - rounded: weighted average of each subject's 0.5-rounded average
 *  - unrounded: weighted average of each subject's exact average
 */
export function weightedSubjectAverage(
  grades: GradeItem[],
  subjectWeights: Record<string, number>,
): { rounded: number; unrounded: number } | null {
  const subjects = subjectAverages(grades);

  if (subjects.length === 0) {
    return null;
  }

  let totalSubjectWeight = 0;
  let weightedSumRounded = 0;
  let weightedSumUnrounded = 0;

  subjects.forEach((summary) => {
    const configuredWeight = subjectWeights[summary.subject];
    const w = configuredWeight && configuredWeight > 0 ? configuredWeight : 1;
    totalSubjectWeight += w;
    weightedSumRounded += summary.roundedAverage * w;
    weightedSumUnrounded += summary.average * w;
  });

  if (totalSubjectWeight <= 0) {
    return null;
  }

  return {
    rounded: weightedSumRounded / totalSubjectWeight,
    unrounded: weightedSumUnrounded / totalSubjectWeight,
  };
}

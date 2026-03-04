import { GradeItem, GradeTrack } from '../types/models';

interface SubjectAverage {
  subject: string;
  average: number;
  totalWeight: number;
  entries: number;
}

export function toSubjectKey(subject: string) {
  return subject.trim().toUpperCase();
}

export function splitByTrack(grades: GradeItem[]) {
  return {
    official: grades.filter((grade) => grade.track === 'official'),
    playground: grades.filter((grade) => grade.track === 'playground'),
  };
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

export function subjectAverages(grades: GradeItem[]) {
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

    summaries.push({
      subject,
      average: totalWeight > 0 ? weightedSum / totalWeight : 0,
      totalWeight,
      entries: subjectGrades.length,
    });
  });

  return summaries.sort((left, right) => left.subject.localeCompare(right.subject));
}

export function weightedSubjectAverage(
  grades: GradeItem[],
  subjectWeights: Record<string, number>,
  track?: GradeTrack,
) {
  const scopedGrades = track ? grades.filter((grade) => grade.track === track) : grades;
  const subjects = subjectAverages(scopedGrades);

  if (subjects.length === 0) {
    return null;
  }

  const totalSubjectWeight = subjects.reduce((sum, summary) => {
    const configuredWeight = subjectWeights[summary.subject];
    const normalizedWeight = configuredWeight && configuredWeight > 0 ? configuredWeight : 1;
    return sum + normalizedWeight;
  }, 0);

  if (totalSubjectWeight <= 0) {
    return null;
  }

  const weightedSum = subjects.reduce((sum, summary) => {
    const configuredWeight = subjectWeights[summary.subject];
    const normalizedWeight = configuredWeight && configuredWeight > 0 ? configuredWeight : 1;
    return sum + summary.average * normalizedWeight;
  }, 0);

  return weightedSum / totalSubjectWeight;
}

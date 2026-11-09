export interface TheoryBlock {
  title: string;
  text: string;
  code?: string;
}
export interface Question {
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
  hint?: string;
}
export interface ValidationRule {
  selector: string;
  min?: number;
  text?: boolean;
  attribute?: string;
  value?: string;
  different?: string;
  property?: string;
  expected?: string[];
  responsive?: boolean;
  message: string;
}
export interface Exercise {
  id: string;
  instructions: string[];
  starterHtml: string;
  starterCss: string;
  validationRules: ValidationRule[];
  hints: string[];
  successMessage: string;
}
export interface Lesson {
  id: number;
  title: string;
  description: string;
  estimatedDuration: number;
  tag: string;
  color: string;
  objectives: string[];
  theoryBlocks: TheoryBlock[];
  interactiveExercises: Exercise[];
  quizQuestions: Question[];
  optionalChallenge: string;
  summary: string[];
  references: { title: string; url: string }[];
}
export interface Code {
  html: string;
  css: string;
}
export interface LessonProgress {
  stage: number;
  theory: boolean;
  demo: boolean;
  practice: boolean;
  quiz: number;
  quizPassed: boolean;
  completed: boolean;
}
export interface Project {
  id: string;
  title: string;
  audience: string;
  type: string;
  steps: string[];
  code: Code;
  completed: boolean;
}
export interface Profile {
  id: string;
  name: string;
  currentLesson: number;
  lessons: Record<string, LessonProgress>;
  codes: Record<string, Code>;
  projects: Project[];
  achievements: string[];
}
export interface Database {
  version: 1;
  activeId: string;
  profiles: Profile[];
}

import type { Job } from "@/types/api";

export interface MatchedKeyword {
  keyword: string;
  matchType: "exact" | "synonym" | "stem" | "fuzzy";
  cvToken: string;
}

export interface JobMatchResult {
  job: Job;
  score: number;
  matchedKeywords: MatchedKeyword[];
  totalKeywords: number;
  scoreCategory: "high" | "medium" | "low";
}

export interface CVMatchResult {
  file: File;
  cvText: string;
  jobResults: JobMatchResult[];
}

export type SynonymMap = Record<string, string>;

export const SYNONYM_MAP: SynonymMap = {
  // JavaScript ecosystem
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  node: "node.js",
  nodejs: "node.js",
  "node.js": "node.js",
  react: "react",
  reactjs: "react",
  "react.js": "react",
  next: "next.js",
  nextjs: "next.js",
  "next.js": "next.js",
  vue: "vue.js",
  vuejs: "vue.js",
  "vue.js": "vue.js",
  angular: "angular",
  angularjs: "angular",
  svelte: "svelte",
  // Python
  py: "python",
  python: "python",
  django: "django",
  flask: "flask",
  fastapi: "fastapi",
  // Databases
  postgres: "postgresql",
  postgresql: "postgresql",
  pg: "postgresql",
  mongo: "mongodb",
  mongodb: "mongodb",
  mysql: "mysql",
  mssql: "sql server",
  "sql server": "sql server",
  redis: "redis",
  elastic: "elasticsearch",
  elasticsearch: "elasticsearch",
  // Cloud & DevOps
  aws: "aws",
  "amazon web services": "aws",
  gcp: "gcp",
  "google cloud": "gcp",
  azure: "azure",
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  docker: "docker",
  "ci/cd": "ci/cd",
  cicd: "ci/cd",
  terraform: "terraform",
  ansible: "ansible",
  jenkins: "jenkins",
  // Mobile
  rn: "react native",
  "react native": "react native",
  ios: "ios",
  android: "android",
  swift: "swift",
  kotlin: "kotlin",
  flutter: "flutter",
  // Design
  figma: "figma",
  photoshop: "photoshop",
  ps: "photoshop",
  xd: "adobe xd",
  "adobe xd": "adobe xd",
  // Engineering
  oop: "oop",
  "object oriented": "oop",
  git: "git",
  github: "git",
  gitlab: "git",
  agile: "agile",
  scrum: "agile",
  rest: "rest api",
  restful: "rest api",
  "rest api": "rest api",
  graphql: "graphql",
  gql: "graphql",
  html: "html",
  html5: "html",
  css: "css",
  css3: "css",
  scss: "scss",
  sass: "scss",
  java: "java",
  "c#": "c#",
  csharp: "c#",
  "c++": "c++",
  cpp: "c++",
  go: "go",
  golang: "go",
  rust: "rust",
  php: "php",
  ruby: "ruby",
  rails: "ruby on rails",
  "ruby on rails": "ruby on rails",
  // Hebrew synonyms
  מנהל: "ניהול",
  מנהלת: "ניהול",
  ניהול: "ניהול",
  פיתוח: "פיתוח",
  מפתח: "פיתוח",
  מפתחת: "פיתוח",
  תכנות: "פיתוח",
};

function isHebrew(word: string): boolean {
  return /[א-ת]/.test(word);
}

export function getStem(word: string): string {
  if (isHebrew(word) || word.length < 4) return word;
  const suffixes = ["ing", "tion", "sion", "ness", "ment", "ful", "less", "able", "ible", "ed", "er", "ly", "s"];
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      return word.slice(0, word.length - suffix.length);
    }
  }
  return word;
}

export function levenshteinDistance(a: string, b: string): number {
  if (a.length < b.length) [a, b] = [b, a];
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 0; i < a.length; i++) {
    const curr: number[] = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr.push(Math.min(prev[j + 1] + 1, curr[j] + 1, prev[j] + cost));
    }
    prev = curr;
  }

  return prev[b.length];
}

export function isFuzzyMatch(keyword: string, token: string): boolean {
  if (keyword.length < 5 || token.length < 4) return false;
  const threshold = keyword.length >= 10 ? 2 : 1;
  const dist = levenshteinDistance(keyword, token);
  return dist <= threshold && dist < Math.min(keyword.length, token.length) / 2;
}

export function resolveSynonym(token: string, synonymMap: SynonymMap): string {
  return synonymMap[token.toLowerCase()] ?? token.toLowerCase();
}

// Common stop words that shouldn't be matched as keywords
const STOP_WORDS = new Set([
  "של", "עם", "על", "את", "לא", "כן", "גם", "או", "אם", "כי",
  "כל", "בין", "עד", "יש", "אין", "רק", "מה", "זה", "זו",
  "שנות", "ניסיון", "יכולת", "גבוהה",
  "the", "and", "or", "in", "of", "to", "for", "with", "from",
  "at", "be", "an", "a", "is", "it", "on", "by", "as", "we",
]);

export function tokenizeRequirements(requirements: string): string[] {
  const seen = new Set<string>();
  return requirements
    .split(/[,;\n\r•]+/)
    .flatMap((chunk) => chunk.replace(/[\-–]/g, " ").split(/\s+/))
    .map((s) => s.trim().toLowerCase().replace(/[.:!?()[\]]/g, ""))
    .filter((s) => {
      if (s.length < 2) return false;
      if (/^\d+$/.test(s)) return false;
      if (STOP_WORDS.has(s)) return false;
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });
}

export function tokenizeCVText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[\-–]/g, " ")
    .split(/[\s.,;:!?()[\]{}/\\|"']+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
}

export function matchKeyword(
  keyword: string,
  cvTokens: string[],
  cvStems: string[],
  synonymMap: SynonymMap
): MatchedKeyword | null {
  const kw = keyword.toLowerCase().trim();
  if (!kw) return null;

  // 1. Exact match
  if (cvTokens.includes(kw)) {
    return { keyword, matchType: "exact", cvToken: kw };
  }

  // 2. Synonym match
  const kwCanonical = resolveSynonym(kw, synonymMap);
  for (const token of cvTokens) {
    const tokenCanonical = resolveSynonym(token, synonymMap);
    if (kwCanonical === tokenCanonical) {
      return { keyword, matchType: "synonym", cvToken: token };
    }
  }

  // 3. Stem match (Latin only)
  if (!isHebrew(kw)) {
    const kwStem = getStem(kw);
    if (kwStem.length >= 4) {
      for (let i = 0; i < cvStems.length; i++) {
        if (cvStems[i] === kwStem) {
          return { keyword, matchType: "stem", cvToken: cvTokens[i] };
        }
      }
    }
  }

  // 4. Fuzzy match
  if (kw.length >= 5) {
    for (const token of cvTokens) {
      if (isFuzzyMatch(kw, token)) {
        return { keyword, matchType: "fuzzy", cvToken: token };
      }
    }
  }

  return null;
}

export function scoreCV(
  file: File,
  cvText: string,
  job: Job,
  synonymMap: SynonymMap
): JobMatchResult {
  const keywords = tokenizeRequirements(job.requirements);

  if (keywords.length === 0) {
    return {
      job,
      score: 0,
      matchedKeywords: [],
      totalKeywords: 0,
      scoreCategory: "low",
    };
  }

  const cvTokens = tokenizeCVText(cvText);
  const cvStems = cvTokens.map(getStem);
  const matchedKeywords: MatchedKeyword[] = [];

  for (const keyword of keywords) {
    const match = matchKeyword(keyword, cvTokens, cvStems, synonymMap);
    if (match) matchedKeywords.push(match);
  }

  const score = Math.round((matchedKeywords.length / keywords.length) * 100);
  const scoreCategory: "high" | "medium" | "low" =
    score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  return { job, score, matchedKeywords, totalKeywords: keywords.length, scoreCategory };
}

export function matchCVAgainstAllJobs(
  file: File,
  cvText: string,
  jobs: Job[],
  synonymMap: SynonymMap
): CVMatchResult {
  const jobResults = jobs
    .map((job) => scoreCV(file, cvText, job, synonymMap))
    .sort((a, b) => b.score - a.score);

  return { file, cvText, jobResults };
}

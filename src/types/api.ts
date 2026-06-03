export type JobStatus = "open" | "filled";
export type AssignmentStatus = "leading" | "candidate" | "not_relevant" | "future";
export type RecruitmentStage = "cv_received" | "interview" | "offer" | "hired" | "rejected" | "ghosted" | "withdrew";
export type CandidateSource = "referral" | "linkedin" | "facebook" | "job_board" | "instagram" | "tiktok";

export interface HrStaff {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  salaryBudget: string | null;
  status: JobStatus;
  filledAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    leading: number;
    candidate: number;
    not_relevant: number;
    future: number;
    hired: number;
  };
  assignments?: (JobAssignment & { candidate: Candidate })[];
}

export interface Candidate {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  cvFileName: string | null;
  cvFilePath: string | null;
  cvFileType: string | null;
  appliedForCustom: string | null;
  source: string | null;
  referredByName: string | null;
  salaryExpectation: string | null;
  hrStaffId: string | null;
  hrStaff?: HrStaff | null;
  referredById: string | null;
  createdAt: string;
  updatedAt: string;
  assignments?: JobAssignment[];
  notes?: Note[];
}

export interface JobAssignment {
  id: string;
  jobId: string;
  candidateId: string;
  status: AssignmentStatus;
  position: number;
  recruitmentStage: RecruitmentStage;
  rejectionReason: string | null;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
  job?: Job;
  candidate?: Candidate;
}

export interface Note {
  id: string;
  candidateId: string;
  content: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  isDone: boolean;
  dueDate: string | null;
  jobId: string | null;
  candidateId: string | null;
  createdAt: string;
  updatedAt: string;
  job?: Pick<Job, "id" | "title"> | null;
  candidate?: Pick<Candidate, "id" | "fullName"> | null;
}

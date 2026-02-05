export interface User {
  id: number;
  username?: string;
  applicationNo?: string;
  email: string;
  fullName: string;
  role: string;
  status?: string;
}

export interface Intern {
  id: number;
  fullName: string;
  enrollmentNo: string;
  personalEmail: string;
  mobileNo: string;
  loiFile?: string;
  status: string;
  role: string;
  applicationNo?: string;
  dateOfJoining?: string;
  dateOfLeaving?: string;
  createdAt?: string;
  updatedAt?: string;
  // Enrollment fields
  program?: string;
  department?: string;
  semester?: string;
  organization?: string;
  gender?: string;
  bloodGroup?: string;
  presentAddress?: string;
  permanentAddress?: string;
  passportPhoto?: string;
  eSignature?: string;
  signedNDA?: string;
  rejectionReason?: string;
}

export interface DailyReport {
  id: number;
  internId: number;
  domain: string;
  applicationNo: string;
  name: string;
  workDescription: string;
  toolsUsed?: string;
  issuesFaced?: string;
  reportDate: string;
  createdAt: string;
}

export interface OngoingIntern {
  id: number;
  hyperlinkText: string;
  applicationNo: string;
  name: string;
  startDate: string;
  endDate: string;
  daysSinceStart: number;
  daysAttended: number;
  attendancePct: number;
  totalDays?: number;
  reports: DailyReport[];
}

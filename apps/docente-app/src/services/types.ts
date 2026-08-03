export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'ASSISTANT';

export type CourseStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type GroupType = 'LAB' | 'PRACTICE' | 'PROJECT' | 'CUSTOM';
export type LessonType = 'LECTURE' | 'LAB' | 'PRACTICE' | 'EXAM' | 'OTHER';
export type SessionStatus = 'PLANNED' | 'OPEN' | 'COMPLETED' | 'CLOSED' | 'CANCELED';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'JUSTIFIED' | 'EARLY_LEAVE';
export type RecordSource = 'QR' | 'MANUAL' | 'IMPORT' | 'OFFLINE_SYNC';
export type ActivityGradingMode = 'SCORE_0_100' | 'SIGNATURES';
export type ExceptionType =
  | 'ABSENCE_JUSTIFICATION'
  | 'OTHER_GROUP_ATTENDANCE'
  | 'RECOVERY'
  | 'LATE_REGISTRATION'
  | 'ATTENDANCE_CORRECTION'
  | 'MANUAL_SIGNATURE'
  | 'OTHER';
export type ExceptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFORMATION' | 'CANCELED';
export type PeriodStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface Course {
  id: string;
  subjectId: string;
  academicPeriodId: string;
  teacherId: string;
  name?: string;
  displayName?: string;
  parallel: string;
  modality?: string;
  schedule: Record<string, unknown>[];
  lateToleranceMinutes: number;
  status: CourseStatus;
  partial1EndsAt?: string;
  partial2EndsAt?: string;
  createdAt: string;
  updatedAt: string;
  subject?: Subject;
  academicPeriod?: AcademicPeriod;
  teacher?: { id: string; fullName: string; email: string };
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  fullName?: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  identityNumber?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: string;
  withdrawnAt?: string;
  active: boolean;
  status?: string;
  student: Student;
}

export type ExceptionListItem = ExceptionRequest;

export interface ClassGroup {
  id: string;
  courseId: string;
  name: string;
  code: string;
  type: GroupType;
  schedule: Record<string, unknown>[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  enrollmentId: string;
  effectiveDate: string;
  enrollment?: Enrollment;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  type: LessonType;
  plannedTopic?: string;
  sequenceNumber?: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  sessions?: ClassSession[];
}

export interface ClassSession {
  id: string;
  lessonId: string;
  courseId: string;
  classGroupId?: string;
  sessionDate: string;
  startsAt: string;
  endsAt?: string;
  openedAt?: string;
  closedAt?: string;
  status: SessionStatus;
  topicTaught?: string;
  notes?: string;
  logTopic?: string;
  logContent?: string;
  partialNumber?: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  classGroup?: {
    id: string;
    name: string;
    code: string;
  };
  attendanceTaken?: boolean;
  attendanceSummary?: { present: number; absent: number; late: number; justified: number };
  activityCount?: number;
  course?: Course;
}

export interface AttendanceRecord {
  id: string;
  classSessionId: string;
  enrollmentId: string;
  originalStatus: AttendanceStatus;
  effectiveStatus: AttendanceStatus;
  checkInAt?: string;
  checkOutAt?: string;
  source: RecordSource;
  registeredById: string;
  exceptionRequestId?: string;
  comment?: string;
  clientOperationId?: string;
  createdAt: string;
  updatedAt: string;
  enrollment?: Enrollment;
  classSession?: ClassSession;
}

export interface Activity {
  id: string;
  courseId: string;
  lessonId?: string;
  classSessionId?: string;
  title: string;
  type?: string;
  gradingMode: ActivityGradingMode;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  maxSignatures: number;
  signatureValue?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowAgenda {
  date: string;
  openSession: ClassSession | null;
  nextSession: ClassSession | null;
  sessions: ClassSession[];
}

export interface WorkflowWeekDay {
  date: string;
  sessions: ClassSession[];
}

export interface WorkflowWeekAgenda {
  weekStart: string;
  weekEnd: string;
  openSession: ClassSession | null;
  nextSession: ClassSession | null;
  days: WorkflowWeekDay[];
}

export interface WorkflowSessionDetail {
  session: ClassSession;
  activities: Activity[];
  roster: WorkflowRoster;
  activityBoard: WorkflowSessionBoardRow[];
}

export interface WorkflowRosterItem {
  order: number;
  enrollmentId: string;
  attendanceRecordId: string | null;
  fullName: string;
  studentCode: string;
  qrToken: string;
  status: AttendanceStatus | null;
  justification: string;
}

export interface WorkflowRoster {
  session: ClassSession;
  items: WorkflowRosterItem[];
}

export interface WorkflowSessionBoardCell {
  activityId: string;
  title: string;
  gradingMode: ActivityGradingMode;
  value: number | null;
}

export interface WorkflowSessionBoardRow {
  enrollmentId: string;
  fullName: string;
  studentCode: string;
  attendanceStatus: AttendanceStatus | null;
  activities: WorkflowSessionBoardCell[];
}

export interface WorkflowStudentResult {
  id: string;
  enrollmentId: string;
  qrToken: string;
  student: Student;
}

export interface WorkflowStudentPage {
  items: WorkflowStudentResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WorkflowGroup {
  id: string;
  courseId: string;
  name: string;
  code: string;
  type: string;
  schedule: Record<string, unknown>[];
  active: boolean;
  members: number;
  enrollmentIds?: string[];
}

export interface WorkflowAdditionalSessionsPage {
  items: ClassSession[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SignatureRecord {
  id: string;
  activityId: string;
  enrollmentId: string;
  classSessionId?: string;
  classGroupId?: string;
  quantity: number;
  source: RecordSource;
  registeredById: string;
  exceptionRequestId?: string;
  comment?: string;
  registeredAt: string;
  canceledAt?: string;
  canceledById?: string;
  cancellationReason?: string;
  clientOperationId?: string;
  createdAt: string;
  updatedAt: string;
  enrollment?: Enrollment;
  activity?: Activity;
}

export interface ExceptionRequest {
  id: string;
  courseId: string;
  enrollmentId: string;
  classSessionId?: string;
  activityId?: string;
  type: ExceptionType;
  status: ExceptionStatus;
  reason: string;
  requestedById: string;
  requestedAt: string;
  resolvedById?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
  enrollment?: Enrollment;
}

export interface Attachment {
  id: string;
  exceptionRequestId: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256?: string;
  uploadedById: string;
  createdAt: string;
}

export interface CourseSummary {
  courseId: string;
  students: number;
  sessions: number;
  signatures: number;
  attendance: {
    present: number;
    late: number;
    absent: number;
    justified: number;
  };
  pendingExceptions: number;
}

export interface GroupComparison {
  id: string;
  name: string;
  code: string;
  activeMembers: number;
  sessions: number;
}

export interface RiskStudent {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  studentFullName?: string;
  firstName: string;
  lastName: string;
  absences: number;
  lates: number;
  signatures: number;
}

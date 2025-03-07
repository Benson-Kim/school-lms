// src/lib/types/prisma.ts
export interface Student {
  id: string;
  studentId: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  emergencyContact: string | null;
  medicalInfo: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  schoolId: string;
  admissionStatus: "PENDING" | "APPROVED" | "REJECTED" | "ENROLLED";
  documents: StudentDocument[];
}

export interface StudentDocument {
  id: string;
  studentId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
}

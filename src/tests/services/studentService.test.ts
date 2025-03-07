import { registerStudent } from "@/lib/services/studentService";
import { prisma } from "@/lib/db/prisma";
import { mockPrisma } from "test-utils"; // Implement mock utilities

jest.mock("@/lib/db/prisma");

describe("Student Service - registerStudent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register a student successfully", async () => {
    const formData = new FormData();
    formData.append("firstName", "John");
    formData.append("email", "john@example.com");
    formData.append("password", "password123");
    formData.append("dateOfBirth", "2005-01-01");
    formData.append("gender", "Male");
    formData.append("address", "123 Main St");
    formData.append("schoolId", "550e8400-e29b-41d4-a716-446655440000");

    mockPrisma.student.create.mockResolvedValue({
      id: "1",
      studentId: "STU-123",
    });

    const student = await registerStudent(formData);
    expect(student.studentId).toMatch(/^STU-/);
    expect(prisma.student.create).toHaveBeenCalledTimes(1);
  });

  it("should throw validation error for invalid data", async () => {
    const formData = new FormData();
    formData.append("email", "invalid-email");

    await expect(registerStudent(formData)).rejects.toThrow(
      "Validation failed",
    );
  });
});

import { POST as registerPost } from "@/app/api/students/register/route";
import { POST as bulkEnrollPost } from "@/app/api/students/bulk-enroll/route";
import { createMockRequest } from "test-utils"; // Assume test-utils exists

jest.mock("@/lib/db/prisma");
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

describe("Student API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/students/register", () => {
    it("should register a student successfully", async () => {
      const formData = new FormData();
      formData.append("firstName", "John");
      formData.append("lastName", "Doe");
      formData.append("email", "john.doe@example.com");
      formData.append("password", "password123");
      formData.append("dateOfBirth", "2005-01-01");
      formData.append("gender", "Male");
      formData.append("address", "123 Main St");
      formData.append("schoolId", "550e8400-e29b-41d4-a716-446655440000");

      (require("@/lib/auth").getServerSession as jest.Mock).mockResolvedValue({
        user: { role: "ADMIN" },
      });

      const req = createMockRequest("POST", formData);
      const res = await registerPost(req);

      expect(res.status).toBe(201);
      expect(await res.json()).toHaveProperty("student.studentId");
    });

    it("should return 403 for unauthorized users", async () => {
      const formData = new FormData();
      (require("@/lib/auth").getServerSession as jest.Mock).mockResolvedValue({
        user: { role: "STUDENT" },
      });

      const req = createMockRequest("POST", formData);
      const res = await registerPost(req);

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/students/bulk-enroll", () => {
    it("should bulk enroll students successfully", async () => {
      const data = [
        {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          dateOfBirth: "2005-01-01",
          gender: "Male",
          schoolId: "550e8400-e29b-41d4-a716-446655440000",
        },
      ];
      (require("@/lib/auth").getServerSession as jest.Mock).mockResolvedValue({
        user: { role: "ADMIN" },
      });

      const req = createMockRequest("POST", JSON.stringify(data), {
        "Content-Type": "application/json",
      });
      const res = await bulkEnrollPost(req);

      expect(res.status).toBe(201);
      expect(await res.json()).toHaveProperty("students");
    });
  });
});

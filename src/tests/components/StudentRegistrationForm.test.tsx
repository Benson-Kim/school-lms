import { render, screen, fireEvent } from "@testing-library/react";
import StudentRegistrationForm from "./StudentRegistrationForm";
import { useForm } from "react-hook-form";
import { studentRegistrationSchema } from "@/lib/validation/studentSchema";

jest.mock("react-hook-form", () => ({
  useForm: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("swr/mutation", () => ({
  useSWRMutation: jest.fn(() => ({
    trigger: jest.fn(),
    isMutating: false,
    error: null,
  })),
}));

describe("StudentRegistrationForm", () => {
  beforeEach(() => {
    (useForm as jest.Mock).mockReturnValue({
      register: jest.fn(),
      handleSubmit: jest.fn((cb) => cb),
      formState: { errors: {} },
    });
  });

  it("renders form fields correctly", () => {
    render(<StudentRegistrationForm />);
    expect(screen.getByPlaceholderText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
  });

  it("displays error messages for invalid inputs", () => {
    render(<StudentRegistrationForm />);
    fireEvent.click(screen.getByText(/Register/i));
    expect(screen.queryByText(/First name is required/i)).toBeInTheDocument();
  });
});

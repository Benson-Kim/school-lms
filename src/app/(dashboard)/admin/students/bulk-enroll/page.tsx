"use client";

import { useForm } from "react-hook-form";
import { bulkEnrollSchema } from "@/lib/validation/studentSchema";
import { useRouter } from "next/navigation";
import useSWRMutation from "swr/mutation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import logger from "@/lib/utils/logger";
import { zodResolver } from "@hookform/resolvers/zod";

async function bulkEnrollStudents(url: string, { arg }: { arg: any }) {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(arg),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function BulkEnrollPage() {
  const router = useRouter();
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/students/bulk-enroll",
    bulkEnrollStudents,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bulkEnrollSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      await trigger(data);
      logger.info("Bulk enrollment successful");
      router.push("/admin/students");
    } catch (err) {
      logger.error("Bulk enrollment failed", { error: err });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          {...register("0.firstName")}
          placeholder="First Name (Student 1)"
          error={errors[0]?.firstName?.message}
        />
        <Input
          {...register("0.lastName")}
          placeholder="Last Name (Student 1)"
          error={errors[0]?.lastName?.message}
        />
        <Input
          {...register("0.email")}
          placeholder="Email (Student 1)"
          error={errors[0]?.email?.message}
        />
        <Input
          {...register("0.dateOfBirth")}
          type="date"
          error={errors[0]?.dateOfBirth?.message}
        />
        <Input
          {...register("0.gender")}
          placeholder="Gender (Student 1)"
          error={errors[0]?.gender?.message}
        />
        <Input
          {...register("0.schoolId")}
          placeholder="School ID"
          error={errors[0]?.schoolId?.message}
        />
      </div>
      <Button type="submit" disabled={isMutating}>
        {isMutating ? "Enrolling..." : "Bulk Enroll"}
      </Button>
      {error && <p className="text-red-500">{error.message}</p>}
    </form>
  );
}

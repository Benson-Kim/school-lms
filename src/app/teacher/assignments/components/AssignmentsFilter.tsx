"use client";

import { useState, useEffect } from "react";
import Input from "@/components/ui/Input";

interface AssignmentsFilterProps {
  onSearch: (term: string) => void;
}

export default function AssignmentsFilter({
  onSearch,
}: AssignmentsFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  return (
    <div className="mb-6">
      <Input
        label="Search assignments"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by name..."
      />
    </div>
  );
}

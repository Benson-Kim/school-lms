// src/lib/generators/generateComponent.ts
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface FieldDefinition {
	name: string;
	type: string;
	isRequired?: boolean;
	isUnique?: boolean;
	validation?: {
		min?: number;
		max?: number;
		pattern?: string;
		message?: string;
	};
}

interface RelationDefinition {
	name: string;
	entity: string;
	type: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
	foreignKey?: string;
	required?: boolean;
}

interface EntityDefinition {
	name: string;
	fields: FieldDefinition[];
	relations?: RelationDefinition[];
	indexes?: string[];
	pluralName?: string;
	accessRoles?: string[];
}

interface RouteDefinition {
	path: string;
	method: "GET" | "POST" | "PUT" | "DELETE";
	handler: string;
	accessRoles?: string[];
}

interface ModuleDefinition {
	name: string; // Role (e.g., 'admin', 'teacher')
	entity: EntityDefinition;
	routes: RouteDefinition[];
	ui: {
		listPage?: boolean;
		detailPage?: boolean;
		createPage?: boolean;
		editPage?: boolean;
		components?: string[];
	};
	accessRoles: string[];
}

/**
 * Creates the necessary folders for a module
 */
function createDirectories(module: ModuleDefinition) {
	const basePath = path.join(process.cwd(), "src");
	const apiPath = path.join(basePath, "app", "api", module.name);
	const pagesPath = path.join(basePath, "app", module.name);
	const componentsPath = path.join(pagesPath, "components");

	[apiPath, pagesPath, componentsPath].forEach((dir) => {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	});

	return { apiPath, pagesPath, componentsPath };
}

/**
 * Generate Zod validation schema
 */
function generateValidationSchema(entity: EntityDefinition): string {
	const fields = entity.fields
		.map((field) => {
			let validation = `z.${field.type}()`;
			const isString = field.type === "string";

			if (field.isRequired) {
				validation += `.min(${isString ? 1 : 0}, "${field.name} is required")`;
			} else {
				validation += ".optional().nullable()";
			}

			if (isString) {
				if (field.validation?.min) {
					validation += `.min(${field.validation.min}, "${field.name} must be at least ${field.validation.min} characters")`;
				}
				if (field.validation?.max) {
					validation += `.max(${field.validation.max}, "${field.name} must be at most ${field.validation.max} characters")`;
				}
				if (field.name === "email") {
					validation += `.email("Invalid email format")`;
				}
				if (field.name === "website" || field.name === "url") {
					validation += `.url("Invalid URL format")`;
				}
			}

			return `  ${field.name}: ${validation}`;
		})
		.join(",\n");

	return `
import { z } from "zod";
import { ${entity.name} } from "@prisma/client";

export const ${entity.name.toLowerCase()}Schema = z.object({
${fields}
});

export const bulk${
		entity.name
	}Schema = z.array(${entity.name.toLowerCase()}Schema);

export type ${
		entity.name
	}Data = z.infer<typeof ${entity.name.toLowerCase()}Schema>;

export interface BulkOperationResult {
  succeeded: ${entity.name}[];
  failed: {
    data: ${entity.name}Data;
    error: string;
  }[];
}
`;
}

/**
 * Generate service file
 */
function generateService(entity: EntityDefinition): string {
	const entityName = entity.name;
	const lowerEntityName = entityName.toLowerCase();
	const pluralName = entity.pluralName || `${lowerEntityName}s`;

	return `
import { prisma } from "@/lib/db/prisma";
import {
  ${lowerEntityName}Schema,
  bulk${entityName}Schema,
  ${entityName}Data,
  BulkOperationResult,
} from "@/lib/validation/${lowerEntityName}Schema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { ${entityName}, Prisma } from "@prisma/client";

export async function create${entityName}(data: ${entityName}Data): Promise<${entityName}> {
  try {
    const parsedData = ${lowerEntityName}Schema.parse(data);
    const ${lowerEntityName} = await prisma.${lowerEntityName}.create({ data: parsedData });
    logger.info(\`Created ${lowerEntityName} \${${lowerEntityName}.id}: \${${lowerEntityName}.name || ${lowerEntityName}.id}\`);
    return ${lowerEntityName};
  } catch (error) {
    logger.error(\`Failed to create ${lowerEntityName}: \${error}\`);
    throw new ApiError(\`${entityName} creation failed: \${error}\`, 400);
  }
}

export async function createMultiple${entityName}s(
  ${pluralName}: ${entityName}Data[]
): Promise<BulkOperationResult> {
  bulk${entityName}Schema.parse(${pluralName});

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const ${lowerEntityName}Data of ${pluralName}) {
    try {
      const created${entityName} = await create${entityName}(${lowerEntityName}Data);
      result.succeeded.push(created${entityName});
    } catch (error) {
      result.failed.push({
        data: ${lowerEntityName}Data,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function update${entityName}(
  id: string,
  data: ${entityName}Data
): Promise<${entityName}> {
  try {
    const parsedData = ${lowerEntityName}Schema.parse(data);
    const ${lowerEntityName} = await prisma.${lowerEntityName}.update({
      where: { id },
      data: parsedData,
    });
    logger.info(\`Updated ${lowerEntityName} \${${lowerEntityName}.id}: \${${lowerEntityName}.name || ${lowerEntityName}.id}\`);
    return ${lowerEntityName};
  } catch (error) {
    logger.error(\`Failed to update ${lowerEntityName} \${id}: \${error}\`);
    throw new ApiError(\`${entityName} update failed: \${error}\`, 400);
  }
}

export async function updateMultiple${entityName}s(
  ${pluralName}: (${entityName}Data & { id: string })[]
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const ${lowerEntityName}Data of ${pluralName}) {
    try {
      const updated${entityName} = await update${entityName}(${lowerEntityName}Data.id, ${lowerEntityName}Data);
      result.succeeded.push(updated${entityName});
    } catch (error) {
      result.failed.push({
        data: ${lowerEntityName}Data,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function delete${entityName}(id: string): Promise<void> {
  try {
    await prisma.${lowerEntityName}.delete({ where: { id } });
    logger.info(\`Deleted ${lowerEntityName} \${id}\`);
  } catch (error) {
    logger.error(\`Failed to delete ${lowerEntityName} \${id}: \${error}\`);
    throw new ApiError(\`${entityName} deletion failed: \${error}\`, 400);
  }
}

export async function deleteMultiple${entityName}s(
  ids: string[]
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deleted${entityName} = await prisma.${lowerEntityName}.delete({ where: { id } });
      result.succeeded.push(deleted${entityName});
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.${entityName}CreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function get${entityName}ById(id: string): Promise<${entityName}> {
  try {
    const ${lowerEntityName} = await prisma.${lowerEntityName}.findUniqueOrThrow({ where: { id } });
    return ${lowerEntityName};
  } catch (error) {
    logger.error(\`Failed to retrieve ${lowerEntityName} \${id}: \${error}\`);
    throw new ApiError(\`${entityName} retrieval failed: \${error}\`, 404);
  }
}

export async function getAll${entityName}s(
  page = 1,
  pageSize = 10,
  searchTerm = ""
): Promise<{ ${pluralName}: ${entityName}[]; total: number }> {
  try {
    const where: Prisma.${entityName}WhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [${pluralName}, total] = await Promise.all([
      prisma.${lowerEntityName}.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.${lowerEntityName}.count({ where }),
    ]);

    return { ${pluralName}, total };
  } catch (error) {
    logger.error(\`Failed to retrieve ${pluralName}: \${error}\`);
    throw new ApiError(\`${entityName}s retrieval failed: \${error}\`, 500);
  }
}
`;
}

/**
 * Generate API route handlers
 */
function generateApiRoutes(module: ModuleDefinition): {
	[path: string]: string;
} {
	const entityName = module.entity.name;
	const lowerEntityName = entityName.toLowerCase();
	const pluralName = module.entity.pluralName || `${lowerEntityName}s`;
	const accessRoles = JSON.stringify(module.accessRoles);

	const routes: { [path: string]: string } = {};

	routes["route.ts"] = `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultiple${entityName}s,
  create${entityName},
  getAll${entityName}s,
} from "@/lib/services/${lowerEntityName}Service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ${accessRoles});
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchTerm = searchParams.get("search") || "";
    const { ${pluralName}, total } = await getAll${entityName}s(page, pageSize, searchTerm);
    return NextResponse.json(
      {
        ${pluralName},
        pagination: {
          currentPage: page,
          pageSize,
          totalItems: total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(\`Failed to fetch ${pluralName}: \${error}\`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ${accessRoles});
    const body = await req.json();
    if (Array.isArray(body)) {
      const result = await createMultiple${entityName}s(body);
      return NextResponse.json(result, {
        status: result.failed.length > 0 ? 206 : 201,
      });
    } else {
      const ${lowerEntityName} = await create${entityName}(body);
      return NextResponse.json(${lowerEntityName}, { status: 201 });
    }
  } catch (error) {
    logger.error(\`Failed to create ${lowerEntityName}(s): \${error}\`);
    return NextResponse.json({ error: "${entityName} creation failed" }, { status: 400 });
  }
}
`;

	routes["[id]/route.ts"] = `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  get${entityName}ById,
  update${entityName},
  delete${entityName},
} from "@/lib/services/${lowerEntityName}Service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ${accessRoles});
    const ${lowerEntityName} = await get${entityName}ById(params.id);
    return NextResponse.json(${lowerEntityName}, { status: 200 });
  } catch (error) {
    logger.error(\`Failed to fetch ${lowerEntityName}: \${error}\`);
    return NextResponse.json({ error: "${entityName} retrieval failed" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ${accessRoles});
    const body = await req.json();
    const ${lowerEntityName} = await update${entityName}(params.id, body);
    return NextResponse.json(${lowerEntityName}, { status: 200 });
  } catch (error) {
    logger.error(\`Failed to update ${lowerEntityName}: \${error}\`);
    return NextResponse.json({ error: "${entityName} update failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ${accessRoles});
    await delete${entityName}(params.id);
    return NextResponse.json({ message: "${entityName} deleted successfully" }, { status: 200 });
  } catch (error) {
    logger.error(\`Failed to delete ${lowerEntityName}: \${error}\`);
    return NextResponse.json({ error: "${entityName} deletion failed" }, { status: 400 });
  }
}
`;

	routes["bulk/route.ts"] = `
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultiple${entityName}s,
  updateMultiple${entityName}s,
  deleteMultiple${entityName}s,
} from "@/lib/services/${lowerEntityName}Service";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ${accessRoles});
    const ${pluralName} = await req.json();
    const result = await updateMultiple${entityName}s(${pluralName});
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(\`Failed to update multiple ${pluralName}: \${error}\`);
    return NextResponse.json({ error: "Bulk ${lowerEntityName} update failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ${accessRoles});
    const { ids } = await req.json();
    const result = await deleteMultiple${entityName}s(ids);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(\`Failed to delete multiple ${pluralName}: \${error}\`);
    return NextResponse.json({ error: "Bulk ${lowerEntityName} deletion failed" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ${accessRoles});
    const ${pluralName} = await req.json();
    const result = await createMultiple${entityName}s(${pluralName});
    return NextResponse.json(result, { status: result.failed.length > 0 ? 206 : 201 });
  } catch (error) {
    logger.error(\`Failed to create multiple ${pluralName}: \${error}\`);
    return NextResponse.json({ error: "Bulk import failed" }, { status: 400 });
  }
}
`;

	return routes;
}

/**
 * Generate UI components for a module
 */
function generateUIComponents(module: ModuleDefinition): {
	[path: string]: string;
} {
	const entityName = module.entity.name;
	const lowerEntityName = entityName.toLowerCase();
	const pluralName = module.entity.pluralName || `${lowerEntityName}s`;

	const components: { [path: string]: string } = {};

	if (module.ui.listPage) {
		components["page.tsx"] = `
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiPlus, FiDownload, FiUpload, FiTrash } from 'react-icons/fi';
import { toast } from 'react-toastify';

import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

import ${entityName}sTable from './components/${entityName}sTable';
import ${entityName}sFilter from './components/${entityName}sFilter';
import BulkImportModal from './components/BulkImportModal';

import { use${entityName}s } from '@/lib/hooks/use${entityName}s';
import { useOffline } from '@/lib/hooks/useOffline';

export default function ${entityName}sPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selected${entityName}s, setSelected${entityName}s] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { 
    ${pluralName}, 
    totalItems, 
    totalPages, 
    isLoading, 
    isError, 
    refetch,
    delete${entityName}s 
  } = use${entityName}s({ page, pageSize, searchTerm });

  useEffect(() => {
    if (session && !${JSON.stringify(
			module.accessRoles
		)}.includes(session.user.role)) {
      router.push('/');
    }
  }, [session, router]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleBulkDelete = async () => {
    if (selected${entityName}s.length === 0) return;
    try {
      await delete${entityName}s(selected${entityName}s);
      toast.success(\`Successfully deleted \${selected${entityName}s.length} ${pluralName}\`);
      setSelected${entityName}s([]);
      refetch();
    } catch (error) {
      toast.error('Failed to delete ${pluralName}');
      console.error('Delete error:', error);
    }
    setShowDeleteConfirm(false);
  };

  const exportToCSV = () => {
    toast.info('Exporting ${pluralName} data...');
    // Implement CSV export logic here
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <div>Error loading ${pluralName}. Please try again.</div>;

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb 
          items={[
            { label: 'Dashboard', href: '/${module.name}/dashboard' },
            { label: '${entityName} Management', href: '/${
			module.name
		}/${pluralName}' }
          ]} 
        />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">${entityName} Management</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push('/${
								module.name
							}/${pluralName}/create')}
              
              icon={<FiPlus />}
            >
              Add ${entityName}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowImportModal(true)}
              
              icon={<FiUpload />}
            >
              Import
            </Button>
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              icon={<FiDownload />}
            >
              Export CSV
            </Button>
            {selected${entityName}s.length > 0 && (
              <Button 
                variant="danger" 
                onClick={() => setShowDeleteConfirm(true)}
                
                icon={<FiTrash />}
              >
                Delete Selected
              </Button>
            )}
          </div>
        </div>
        <${entityName}sFilter onSearch={handleSearch} />
        <${entityName}sTable 
          ${pluralName}={${pluralName} || []}
          pagination={{
            currentPage: page,
            pageSize,
            totalItems: totalItems || 0,
            totalPages: totalPages || 1
          }}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSelectionChange={setSelected${entityName}s}
          selected${entityName}s={selected${entityName}s}
        />
        {showImportModal && (
          <BulkImportModal 
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImportComplete={() => {
              refetch();
              setShowImportModal(false);
            }}
          />
        )}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete ${entityName}s"
          message={\`Are you sure you want to delete \${selected${entityName}s.length} ${pluralName}? This action cannot be undone.\`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </ErrorBoundary>
  );
}
`;
	}

	if (module.ui.createPage || module.ui.editPage) {
		components[`components/${entityName}Form.tsx`] = `
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { ${lowerEntityName}Schema, type ${entityName}Data } from '@/lib/validation/${lowerEntityName}Schema';
import { useOffline } from '@/lib/hooks/useOffline';

interface ${entityName}FormProps {
  initialData?: ${entityName}Data & { id?: string };
  isEdit?: boolean;
}

export default function ${entityName}Form({ initialData, isEdit = false }: ${entityName}FormProps) {
  const router = useRouter();
  const { isOffline, syncWhenOnline } = useOffline();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<${entityName}Data>({
    resolver: zodResolver(${lowerEntityName}Schema),
    defaultValues: initialData || {
      ${module.entity.fields
				.map(
					(field) =>
						`${field.name}: ${field.type === "boolean" ? "false" : "''"},`
				)
				.join("\n      ")}
    },
  });

  const onSubmit = async (data: ${entityName}Data) => {
    setIsSubmitting(true);
    try {
      if (isOffline) {
        syncWhenOnline({
          type: isEdit ? 'update' : 'create',
          resource: '${pluralName}',
          data: isEdit ? { ...data, id: initialData?.id } : data,
        });
        toast.info('Changes saved locally and will sync when back online');
        router.push('/${module.name}/${pluralName}');
        return;
      }

      const url = isEdit && initialData?.id 
        ? \`/api/${module.name}/${pluralName}/\${initialData.id}\`
        : \`/api/${module.name}/${pluralName}\`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save ${lowerEntityName}');
      }

      toast.success(\`${entityName} \${isEdit ? 'updated' : 'created'} successfully\`);
      router.push('/${module.name}/${pluralName}');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${module.entity.fields
					.map(
						(field) => `
        <div className="space-y-4">
          <Input
            label="${field.name.charAt(0).toUpperCase() + field.name.slice(1)}"
            type="${
							field.type === "number"
								? "number"
								: field.type === "boolean"
								? "checkbox"
								: field.type === "date"
								? "date"
								: "text"
						}"
            {...register('${field.name}'${
							field.type === "number" ? ", { valueAsNumber: true }" : ""
						})}
            error={errors.${field.name}?.message}
            ${field.isRequired ? "required" : ""}
          />
        </div>`
					)
					.join("\n        ")}
      </div>
      <div className="flex justify-end gap-4 mt-8">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {isEdit ? 'Update' : 'Create'} ${entityName}
        </Button>
      </div>
    </form>
  );
}
`;
	}

	if (module.ui.createPage) {
		components["create/page.tsx"] = `
'use client';

import Breadcrumb from '@/components/ui/Breadcrumb';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ${entityName}Form from '../components/${entityName}Form';

export default function Create${entityName}Page() {
  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb 
          items={[
            { label: 'Dashboard', href: '/${module.name}/dashboard' },
            { label: '${entityName} Management', href: '/${module.name}/${pluralName}' },
            { label: 'Create ${entityName}', href: '/${module.name}/${pluralName}/create' }
          ]} 
        />
        <h1 className="text-2xl font-bold mb-6">Create New ${entityName}</h1>
        <${entityName}Form />
      </div>
    </ErrorBoundary>
  );
}
`;
	}

	if (module.ui.editPage) {
		components["edit/[id]/page.tsx"] = `
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ${entityName}Form from '../../components/${entityName}Form';

export default function Edit${entityName}Page() {
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch${entityName} = async () => {
      try {
        const response = await fetch(\`/api/${module.name}/${pluralName}/\${id}\`);
        if (!response.ok) throw new Error('Failed to fetch ${lowerEntityName}');
        const data = await response.json();
        setInitialData(data);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetch${entityName}();
  }, [id]);

  if (isLoading) return <LoadingSpinner />;
  if (!initialData) return <div>Error loading ${lowerEntityName} data</div>;

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb 
          items={[
            { label: 'Dashboard', href: '/${module.name}/dashboard' },
            { label: '${entityName} Management', href: '/${module.name}/${pluralName}' },
            { label: 'Edit ${entityName}', href: '/${module.name}/${pluralName}/edit/\${id}' }
          ]} 
        />
        <h1 className="text-2xl font-bold mb-6">Edit ${entityName}</h1>
        <${entityName}Form initialData={initialData} isEdit />
      </div>
    </ErrorBoundary>
  );
}
`;
	}

	if (module.ui.listPage) {
		components[`components/${entityName}sTable.tsx`] = `
'use client';

import { useMemo } from 'react';
import { FiEdit, FiTrash } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Pagination from '@/components/ui/Pagination';
import { ${entityName} } from '@prisma/client';

interface ${entityName}sTableProps {
  ${pluralName}: ${entityName}[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  selected${entityName}s: string[];
}

export default function ${entityName}sTable({
  ${pluralName},
  pagination,
  onPageChange,
  onPageSizeChange,
  onSelectionChange,
  selected${entityName}s,
}: ${entityName}sTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(${pluralName}.map((item) => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelect = (id: string) => {
    if (selected${entityName}s.includes(id)) {
      onSelectionChange(selected${entityName}s.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selected${entityName}s, id]);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'select',
        header: (
          <Checkbox
            checked={selected${entityName}s.length === ${pluralName}.length && ${pluralName}.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
        ),
        render: (item: ${entityName}) => (
          <Checkbox
            checked={selected${entityName}s.includes(item.id)}
            onChange={() => handleSelect(item.id)}
          />
        ),
      },
      ${module.entity.fields
				.map(
					(field) => `
      {
        key: '${field.name}',
        header: '${field.name.charAt(0).toUpperCase() + field.name.slice(1)}',
        render: (item: ${entityName}) => item.${field.name} || 'N/A',
      },`
				)
				.join("\n      ")}
      {
        key: 'actions',
        header: 'Actions',
        render: (item: ${entityName}) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/${
								module.name
							}/${pluralName}/edit/' + item.id}
              icon={<FiEdit />}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {/* Add delete logic here */}}
              icon={<FiTrash />}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [${pluralName}, selected${entityName}s]
  );

  return (
    <div className="mt-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {${pluralName}.map((item) => (
            <tr key={item.id}>
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        currentPage={pagination.currentPage}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
`;
	}

	if (module.ui.listPage) {
		components[`components/${entityName}sFilter.tsx`] = `
'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';

interface ${entityName}sFilterProps {
  onSearch: (term: string) => void;
}

export default function ${entityName}sFilter({ onSearch }: ${entityName}sFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  return (
    <div className="mb-6">
      <Input
        label="Search ${pluralName}"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by name..."
      />
    </div>
  );
}
`;
	}

	if (module.ui.listPage) {
		components[`components/BulkImportModal.tsx`] = `
'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onImportComplete }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/${module.name}/${pluralName}/bulk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk import failed');
      }

      const result = await response.json();
      toast.success(\`Imported \${result.succeeded.length} ${pluralName} successfully\`);
      if (result.failed.length > 0) {
        toast.warn(\`\${result.failed.length} ${pluralName} failed to import\`);
      }
      onImportComplete();
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred during import');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import ${entityName}s">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            type="file"
            label="Upload CSV File"
            accept=".csv"
            onChange={handleFileChange}
          />
          <p className="mt-2 text-sm text-gray-500">
            Upload a CSV file with columns matching the ${entityName} fields.
          </p>
        </div>
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            Import
          </Button>
        </div>
      </form>
    </Modal>
  );
}
`;
	}

	return components;
}

/**
 * Generate all modules based on configuration
 */
export function generateAllModules() {
	const modules: ModuleDefinition[] = [
		// ADMIN (excluding 'students')
		{
			name: "admin",
			entity: {
				name: "User",
				fields: [
					{ name: "email", type: "string", isRequired: true },
					{ name: "firstName", type: "string", isRequired: true },
					{ name: "lastName", type: "string", isRequired: true },
					{ name: "role", type: "string", isRequired: true },
					{ name: "phoneNumber", type: "string" },
					{ name: "active", type: "boolean", isRequired: true },
				],
				pluralName: "users",
			},
			routes: [],
			ui: { listPage: true, createPage: true, editPage: true },
			accessRoles: ["ADMIN"],
		},
		{
			name: "admin",
			entity: { name: "Report", fields: [], pluralName: "reports" },
			routes: [],
			ui: { listPage: true },
			accessRoles: ["ADMIN"],
		},
		{
			name: "admin",
			entity: { name: "Setting", fields: [], pluralName: "settings" },
			routes: [],
			ui: { listPage: true },
			accessRoles: ["ADMIN"],
		},

		// TEACHER
		{
			name: "teacher",
			entity: {
				name: "Student",
				fields: [
					{ name: "studentId", type: "string", isRequired: true },
					{ name: "firstName", type: "string", isRequired: true },
					{ name: "lastName", type: "string", isRequired: true },
					{ name: "email", type: "string", isRequired: true },
					{ name: "dateOfBirth", type: "date", isRequired: true },
					{ name: "gender", type: "string", isRequired: true },
				],
				pluralName: "students",
			},
			routes: [],
			ui: { listPage: true, createPage: true, editPage: true },
			accessRoles: ["TEACHER"],
		},
		{
			name: "teacher",
			entity: {
				name: "Grade",
				fields: [
					{ name: "studentId", type: "string", isRequired: true },
					{ name: "assignmentName", type: "string", isRequired: true },
					{ name: "score", type: "number", isRequired: true },
					{ name: "feedback", type: "string" },
				],
				pluralName: "grades",
			},
			routes: [],
			ui: { listPage: true, createPage: true, editPage: true },
			accessRoles: ["TEACHER"],
		},
		{
			name: "teacher",
			entity: {
				name: "Assignment",
				fields: [
					{ name: "title", type: "string", isRequired: true },
					{ name: "description", type: "string", isRequired: true },
					{ name: "dueDate", type: "date", isRequired: true },
					{ name: "totalPoints", type: "number", isRequired: true },
				],
				pluralName: "assignments",
			},
			routes: [],
			ui: { listPage: true, createPage: true, editPage: true },
			accessRoles: ["TEACHER"],
		},
		{
			name: "teacher",
			entity: {
				name: "Attendance",
				fields: [
					{ name: "date", type: "date", isRequired: true },
					{ name: "studentId", type: "string", isRequired: true },
					{ name: "status", type: "string", isRequired: true },
					{ name: "note", type: "string" },
				],
				pluralName: "attendance",
			},
			routes: [],
			ui: { listPage: true, createPage: true, editPage: true },
			accessRoles: ["TEACHER"],
		},

		// STUDENT
		{
			name: "student",
			entity: {
				name: "Class",
				fields: [{ name: "name", type: "string", isRequired: true }],
				pluralName: "courses",
			},
			routes: [],
			ui: { listPage: true },
			accessRoles: ["STUDENT"],
		},
		{
			name: "student",
			entity: {
				name: "Grade",
				fields: [
					{ name: "assignmentName", type: "string", isRequired: true },
					{ name: "score", type: "number", isRequired: true },
					{ name: "feedback", type: "string" },
				],
				pluralName: "grades",
			},
			routes: [],
			ui: { listPage: true },
			accessRoles: ["STUDENT"],
		},
		{
			name: "student",
			entity: { name: "Schedule", fields: [], pluralName: "schedule" },
			routes: [],
			ui: { listPage: true },
			accessRoles: ["STUDENT"],
		},
		{
			name: "student",
			entity: { name: "Message", fields: [], pluralName: "messages" },
			routes: [],
			ui: { listPage: true },
			accessRoles: ["STUDENT"],
		},

		// PARENT
		{
			name: "parent",
			entity: { name: "Student", fields: [], pluralName: "progress" },
			routes: [],
			ui: { listPage: true },
			accessRoles: ["PARENT"],
		},
		{
			name: "parent",
			entity: { name: "Message", fields: [], pluralName: "messages" },
			routes: [],
			ui: { listPage: true },
			accessRoles: ["PARENT"],
		},
		{
			name: "parent",
			entity: {
				name: "Payment",
				fields: [
					{ name: "amount", type: "number", isRequired: true },
					{ name: "description", type: "string", isRequired: true },
					{ name: "date", type: "date", isRequired: true },
					{ name: "status", type: "string", isRequired: true },
				],
				pluralName: "payments",
			},
			routes: [],
			ui: { listPage: true, createPage: true, editPage: true },
			accessRoles: ["PARENT"],
		},
		{
			name: "parent",
			entity: {
				name: "Event",
				fields: [
					{ name: "title", type: "string", isRequired: true },
					{ name: "description", type: "string", isRequired: true },
					{ name: "date", type: "date", isRequired: true },
					{ name: "location", type: "string", isRequired: true },
				],
				pluralName: "events",
			},
			routes: [],
			ui: { listPage: true, createPage: true, editPage: true },
			accessRoles: ["PARENT"],
		},

		// SUPPORT_STAFF
		{
			name: "support",
			entity: {
				name: "Inventory",
				fields: [
					{ name: "name", type: "string", isRequired: true },
					{ name: "quantity", type: "number", isRequired: true },
					{ name: "location", type: "string", isRequired: true },
					{ name: "status", type: "string", isRequired: true },
				],
				pluralName: "inventory",
			},
			routes: [],
			ui: { listPage: true, createPage: true, editPage: true },
			accessRoles: ["SUPPORT_STAFF"],
		},
		{
			name: "support",
			entity: {
				name: "Maintenance",
				fields: [
					{ name: "title", type: "string", isRequired: true },
					{ name: "description", type: "string", isRequired: true },
					{ name: "priority", type: "string", isRequired: true },
					{ name: "status", type: "string", isRequired: true },
					{ name: "requestedBy", type: "string", isRequired: true },
					{ name: "location", type: "string", isRequired: true },
				],
				pluralName: "maintenance",
			},
			routes: [],
			ui: { listPage: true, createPage: true, editPage: true },
			accessRoles: ["SUPPORT_STAFF"],
		},

		// IT (excluding 'users')
		{
			name: "it",
			entity: {
				name: "School",
				fields: [
					{ name: "name", type: "string", isRequired: true },
					{ name: "address", type: "string", isRequired: true },
					{ name: "city", type: "string" },
					{ name: "state", type: "string" },
					{ name: "zipCode", type: "string" },
					{ name: "country", type: "string", isRequired: true },
					{ name: "phone", type: "string", isRequired: true },
					{ name: "email", type: "string", isRequired: true },
					{ name: "website", type: "string" },
				],
				pluralName: "schools",
			},
			routes: [],
			ui: { listPage: true, createPage: true, editPage: true },
			accessRoles: ["IT"],
		},
		{
			name: "it",
			entity: { name: "Security", fields: [], pluralName: "security" },
			routes: [],
			ui: { listPage: true },
			accessRoles: ["IT"],
		},
		{
			name: "it",
			entity: { name: "Integration", fields: [], pluralName: "integrations" },
			routes: [],
			ui: { listPage: true },
			accessRoles: ["IT"],
		},
	];

	modules.forEach((module) => {
		const { apiPath, pagesPath, componentsPath } = createDirectories(module);

		// Generate validation schema
		const schemaContent = generateValidationSchema(module.entity);
		fs.writeFileSync(
			path.join(
				process.cwd(),
				"src",
				"lib",
				"validation",
				`${module.entity.name.toLowerCase()}Schema.ts`
			),
			schemaContent
		);

		// Generate service
		const serviceContent = generateService(module.entity);
		fs.writeFileSync(
			path.join(
				process.cwd(),
				"src",
				"lib",
				"services",
				`${module.entity.name.toLowerCase()}Service.ts`
			),
			serviceContent
		);

		// Generate API routes
		const routes = generateApiRoutes(module);
		Object.entries(routes).forEach(([fileName, content]) => {
			const routePath = path.join(
				apiPath,
				module.entity.pluralName || `${module.entity.name.toLowerCase()}s`,
				fileName
			);
			fs.mkdirSync(path.dirname(routePath), { recursive: true });
			fs.writeFileSync(routePath, content);
		});

		// Generate UI components
		const uiComponents = generateUIComponents(module);
		Object.entries(uiComponents).forEach(([filePath, content]) => {
			const fullPath = path.join(
				pagesPath,
				module.entity.pluralName || `${module.entity.name.toLowerCase()}s`,
				filePath
			);
			fs.mkdirSync(path.dirname(fullPath), { recursive: true });
			fs.writeFileSync(fullPath, content);
		});

		console.log(`Generated files for ${module.name}/${module.entity.name}`);
	});

	// Format files with Prettier
	try {
		execSync("npx prettier --write src/**/*.{ts,tsx}", { stdio: "inherit" });
	} catch (error) {
		console.warn("Prettier formatting failed. Ensure Prettier is installed.");
	}

	console.log("All modules generated successfully!");
}

// Run the generation
generateAllModules();

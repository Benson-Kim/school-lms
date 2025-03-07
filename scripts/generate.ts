#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface FieldDefinition {
	name: string;
	type: string;
	required: boolean;
	description?: string;
}

interface EntityConfig {
	name: string;
	pluralName: string;
	prismaModelName?: string;
	apiRoute: string;
	fields: FieldDefinition[];
	searchFields?: string[];
}

interface GeneratorConfig {
	entities: EntityConfig[];
	outputBasePath: string;
}

/**
 * Generates all code files for the specified entities
 */
async function generateAllFiles(config: GeneratorConfig) {
	// Create output directories
	const servicesDir = path.join(config.outputBasePath, "lib/services");
	const validationDir = path.join(config.outputBasePath, "lib/validation");
	const apiBaseDir = path.join(config.outputBasePath, "app/api");

	await fs.mkdir(servicesDir, { recursive: true });
	await fs.mkdir(validationDir, { recursive: true });
	await fs.mkdir(apiBaseDir, { recursive: true });

	// Generate files for each entity
	for (const entity of config.entities) {
		try {
			// Generate schema file
			await generateSchemaFile(entity, validationDir);
			console.log(`✅ Generated schema for ${entity.name}`);

			// Generate service file
			await generateServiceFile(entity, servicesDir);
			console.log(`✅ Generated service for ${entity.name}`);

			// Generate API handler
			await generateApiHandler(entity, apiBaseDir);
			console.log(`✅ Generated API handler for ${entity.name}`);
		} catch (error) {
			console.error(`❌ Error generating files for ${entity.name}:`, error);
		}
	}

	// Format generated files
	try {
		console.log("Formatting generated files...");
		await execAsync(`npx prettier --write "${config.outputBasePath}/**/*.ts"`);
		console.log("✅ Formatting complete");
	} catch (error) {
		console.error("❌ Error formatting files:", error);
	}
}

/**
 * Generates schema validation file for an entity
 */
async function generateSchemaFile(
	entity: EntityConfig,
	outputDir: string
): Promise<void> {
	const entityName = entity.name.toLowerCase();
	const EntityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

	// Generate the field validations
	const fieldValidations = entity.fields
		.map((field) => {
			const fieldValidator = getValidatorForType(field.type, field.required);
			return `  ${field.name}: ${fieldValidator}${
				field.description ? ` // ${field.description}` : ""
			}`;
		})
		.join(",\n");

	const fileContent = `import { z } from "zod";

/**
 * Schema for validating ${entityName} data
 */
export const ${entityName}Schema = z.object({
${fieldValidations}
});

/**
 * Schema for bulk ${entityName} operations
 */
export const bulk${EntityName}Schema = z.array(${entityName}Schema);

/**
 * Type for ${entityName} data based on the schema
 */
export type ${EntityName}Data = z.infer<typeof ${entityName}Schema>;

/**
 * Type for failed operation result
 */
export interface FailedOperation {
  data: any;
  error: string;
}

/**
 * Type for bulk operation results
 */
export interface BulkOperationResult {
  succeeded: any[];
  failed: FailedOperation[];
}
`;

	const filePath = path.join(outputDir, `${entityName}Schema.ts`);
	await fs.writeFile(filePath, fileContent);
}

/**
 * Returns appropriate Zod validator based on field type
 */
function getValidatorForType(type: string, required: boolean): string {
	let validator = "";

	switch (type.toLowerCase()) {
		case "string":
			validator = "z.string()";
			break;
		case "number":
			validator = "z.number()";
			break;
		case "boolean":
			validator = "z.boolean()";
			break;
		case "date":
			validator = "z.date()";
			break;
		case "id":
		case "uuid":
			validator = "z.string().uuid()";
			break;
		case "email":
			validator = "z.string().email()";
			break;
		case "url":
			validator = "z.string().url()";
			break;
		default:
			validator = "z.any()";
	}

	if (!required) {
		validator += ".optional()";
	}

	return validator;
}

/**
 * Generates service file for an entity
 */
async function generateServiceFile(
	entity: EntityConfig,
	outputDir: string
): Promise<void> {
	const entityName = entity.name.toLowerCase();
	const EntityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
	const PluralName =
		entity.pluralName.charAt(0).toUpperCase() + entity.pluralName.slice(1);
	const modelName = entity.prismaModelName || EntityName;

	// Generate search fields condition
	const searchFieldsCondition = entity.searchFields
		? entity.searchFields
				.map(
					(field) =>
						`{ ${field}: { contains: searchTerm, mode: "insensitive" } }`
				)
				.join(",\n            ")
		: `{ name: { contains: searchTerm, mode: "insensitive" } }`;

	const fileContent = `
import { prisma } from "@/lib/db/prisma";
import {
  ${entityName}Schema,
  bulk${EntityName}Schema,
  ${EntityName}Data,
  BulkOperationResult,
} from "@/lib/validation/${entityName}Schema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { ${modelName}, Prisma } from "@prisma/client";

/**
 * Creates a new ${entityName} record
 * @param data - The ${entityName} data to create
 * @returns Created ${entityName} object
 */
export async function create${EntityName}(data: ${EntityName}Data): Promise<${modelName}> {
  try {
    const parsedData = ${entityName}Schema.parse(data);
    const ${entityName} = await prisma.${entityName}.create({ data: parsedData });
    logger.info(\`Created ${entityName} \${${entityName}.id}: \${${entityName}.name || ''}\`);
    return ${entityName};
  } catch (error) {
    logger.error(\`Failed to create ${entityName}: \${error}\`);
    throw new ApiError(\`${EntityName} creation failed: \${error}\`, 400);
  }
}

/**
 * Creates multiple ${entityName} records
 * @param ${entity.pluralName} - Array of ${entityName} data to create
 * @returns Result with succeeded and failed operations
 */
export async function createMultiple${PluralName}(
  ${entity.pluralName}: ${EntityName}Data[]
): Promise<BulkOperationResult> {
  bulk${EntityName}Schema.parse(${entity.pluralName});

  const result: BulkOperationResult = {
    succeeded: [],
    failed: [],
  };

  for (const ${entityName}Data of ${entity.pluralName}) {
    try {
      const created${EntityName} = await create${EntityName}(${entityName}Data);
      result.succeeded.push(created${EntityName});
    } catch (error) {
      result.failed.push({
        data: ${entityName}Data,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

/**
 * Updates an existing ${entityName} record
 * @param id - ID of the ${entityName} to update
 * @param data - New ${entityName} data
 * @returns Updated ${entityName} object
 */
export async function update${EntityName}(
  id: string,
  data: ${EntityName}Data
): Promise<${modelName}> {
  try {
    const parsedData = ${entityName}Schema.parse(data);
    const ${entityName} = await prisma.${entityName}.update({
      where: { id },
      data: parsedData,
    });
    logger.info(\`Updated ${entityName} \${${entityName}.id}: \${${entityName}.name || ''}\`);
    return ${entityName};
  } catch (error) {
    logger.error(\`Failed to update ${entityName} \${id}: \${error}\`);
    throw new ApiError(\`${EntityName} update failed: \${error}\`, 400);
  }
}

/**
 * Updates multiple ${entityName} records
 * @param ${entity.pluralName} - Array of ${entityName} data with IDs to update
 * @returns Result with succeeded and failed operations
 */
export async function updateMultiple${PluralName}(
  ${entity.pluralName}: (${EntityName}Data & { id: string })[]
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    succeeded: [],
    failed: [],
  };

  for (const ${entityName}Data of ${entity.pluralName}) {
    try {
      const updated${EntityName} = await update${EntityName}(${entityName}Data.id, ${entityName}Data);
      result.succeeded.push(updated${EntityName});
    } catch (error) {
      result.failed.push({
        data: ${entityName}Data,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

/**
 * Deletes a ${entityName} record
 * @param id - ID of the ${entityName} to delete
 */
export async function delete${EntityName}(id: string): Promise<void> {
  try {
    await prisma.${entityName}.delete({ where: { id } });
    logger.info(\`Deleted ${entityName} \${id}\`);
  } catch (error) {
    logger.error(\`Failed to delete ${entityName} \${id}: \${error}\`);
    throw new ApiError(\`${EntityName} deletion failed: \${error}\`, 400);
  }
}

/**
 * Deletes multiple ${entityName} records
 * @param ids - Array of ${entityName} IDs to delete
 * @returns Result with succeeded and failed operations
 */
export async function deleteMultiple${PluralName}(
  ids: string[]
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    succeeded: [],
    failed: [],
  };

  for (const id of ids) {
    try {
      const deleted${EntityName} = await prisma.${entityName}.delete({ where: { id } });
      result.succeeded.push(deleted${EntityName});
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.${modelName}CreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

/**
 * Gets a ${entityName} by ID
 * @param id - ID of the ${entityName} to retrieve
 * @returns ${EntityName} object
 */
export async function get${EntityName}ById(id: string): Promise<${modelName}> {
  try {
    const ${entityName} = await prisma.${entityName}.findUniqueOrThrow({ where: { id } });
    return ${entityName};
  } catch (error) {
    logger.error(\`Failed to retrieve ${entityName} \${id}: \${error}\`);
    throw new ApiError(\`${EntityName} retrieval failed: \${error}\`, 404);
  }
}

/**
 * Gets all ${entity.pluralName} with pagination and optional search
 * @param page - Page number starting from 1
 * @param pageSize - Number of items per page
 * @param searchTerm - Optional search term
 * @returns Object with ${entity.pluralName} array and total count
 */
export async function getAll${PluralName}(
  page = 1,
  pageSize = 10,
  searchTerm = ""
): Promise<{ ${entity.pluralName}: ${modelName}[]; total: number }> {
  try {
    const where: Prisma.${modelName}WhereInput = searchTerm
      ? {
          OR: [
            ${searchFieldsCondition}
          ],
        }
      : {};

    const [${entity.pluralName}, total] = await Promise.all([
      prisma.${entityName}.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.${entityName}.count({ where }),
    ]);

    return { ${entity.pluralName}, total };
  } catch (error) {
    logger.error(\`Failed to retrieve ${entity.pluralName}: \${error}\`);
    throw new ApiError(\`${PluralName} retrieval failed: \${error}\`, 500);
  }
}
`;

	const filePath = path.join(outputDir, `${entityName}Service.ts`);
	await fs.writeFile(filePath, fileContent.trim());
}

/**
 * Generates API handler file for an entity
 */
async function generateApiHandler(
	entity: EntityConfig,
	apiBaseDir: string
): Promise<void> {
	const entityName = entity.name.toLowerCase();
	const EntityName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
	const pluralName = entity.pluralName;
	const PluralName = pluralName.charAt(0).toUpperCase() + pluralName.slice(1);

	const fileContent = `import { NextApiRequest, NextApiResponse } from 'next';
import { 
  create${EntityName}, 
  update${EntityName}, 
  delete${EntityName}, 
  getAll${PluralName}, 
  get${EntityName}ById,
  createMultiple${PluralName},
  updateMultiple${PluralName},
  deleteMultiple${PluralName}
} from '@/services/${entityName}Service';
import { ApiError } from '@/lib/utils/api';
import { validateToken } from '@/lib/auth/jwt';
import { UserRole } from '@prisma/client';
import logger from '@/lib/utils/logger';

/**
 * API handler for ${pluralName} operations
 * @route ${entity.apiRoute}
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  try {
    // Verify authentication
    const user = await validateToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check permissions based on role
    if (![UserRole.ADMIN, UserRole.IT].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    logger.error(\`API error in ${pluralName} handler: \${error}\`);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Handles GET requests
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id, page, pageSize, search } = req.query;
  
  // Get single ${entityName} by ID
  if (id) {
    const ${entityName} = await get${EntityName}ById(String(id));
    return res.status(200).json(${entityName});
  }
  
  // Get all ${pluralName} with pagination and search
  const pageNum = page ? parseInt(String(page)) : 1;
  const size = pageSize ? parseInt(String(pageSize)) : 10;
  const searchTerm = search ? String(search) : '';
  
  const result = await getAll${PluralName}(pageNum, size, searchTerm);
  return res.status(200).json(result);
}

/**
 * Handles POST requests
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { bulk } = req.query;
  
  // Handle bulk creation
  if (bulk === 'true') {
    const result = await createMultiple${PluralName}(req.body);
    return res.status(201).json(result);
  }
  
  // Handle single creation
  const ${entityName} = await create${EntityName}(req.body);
  return res.status(201).json(${entityName});
}

/**
 * Handles PUT requests
 */
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id, bulk } = req.query;
  
  // Handle bulk update
  if (bulk === 'true') {
    const result = await updateMultiple${PluralName}(req.body);
    return res.status(200).json(result);
  }
  
  // Handle single update
  if (!id) {
    return res.status(400).json({ error: 'ID is required for updates' });
  }
  
  const ${entityName} = await update${EntityName}(String(id), req.body);
  return res.status(200).json(${entityName});
}

/**
 * Handles DELETE requests
 */
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id, bulk } = req.query;
  
  // Handle bulk deletion
  if (bulk === 'true') {
    const ids = Array.isArray(req.body) ? req.body : [];
    const result = await deleteMultiple${PluralName}(ids);
    return res.status(200).json(result);
  }
  
  // Handle single deletion
  if (!id) {
    return res.status(400).json({ error: 'ID is required for deletion' });
  }
  
  await delete${EntityName}(String(id));
  return res.status(204).end();
}
`;

	// Create directory structure for the API route
	const routeParts = entity.apiRoute.split("/").slice(1); // Remove empty first part
	let currentPath = apiBaseDir;

	// Create directory structure (except for the last part which is the file)
	for (let i = 0; i < routeParts.length - 1; i++) {
		currentPath = path.join(currentPath, routeParts[i]);
		try {
			await fs.mkdir(currentPath, { recursive: true });
		} catch (err) {
			// Directory might already exist, ignore error
		}
	}

	const filePath = path.join(
		currentPath,
		`${routeParts[routeParts.length - 1]}.ts`
	);
	await fs.writeFile(filePath, fileContent.trim());
}

/**
 * Main function to run the generator with a config file
 */
async function main() {
	try {
		// Check if config file path is provided
		const configPath = process.argv[2];
		if (!configPath) {
			console.error(
				"Please provide a path to the config file: node generate.js ./config.json"
			);
			process.exit(1);
		}

		// Load config file
		const configFile = await fs.readFile(configPath, "utf8");
		const config: GeneratorConfig = JSON.parse(configFile);

		console.log(
			`🚀 Starting code generation for ${config.entities.length} entities`
		);
		await generateAllFiles(config);
		console.log("✅ Code generation complete!");
	} catch (error) {
		console.error("❌ Error running generator:", error);
		process.exit(1);
	}
}

// Run the main function
if (require.main === module) {
	main();
}

// Export functions for testing or importing
export {
	generateAllFiles,
	generateSchemaFile,
	generateServiceFile,
	generateApiHandler,
};

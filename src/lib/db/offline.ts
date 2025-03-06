// src/lib/offline.ts

import Dexie from "dexie";

const db = new Dexie("SchoolManagementSystem");
db.version(1).stores({
	syncQueue: "id,entityType,operation,timestamp",
	students: "id,studentId,userId",
	curricula: "id,framework,gradeLevelId",
});

export default db;

export async function cacheStudent(student: any) {
	await db.table("students").put(student);
}

export async function getCachedStudent(id: string) {
	return await db.table("students").get(id);
}

export async function getCachedCurricula() {
	return await db.table("curricula").toArray();
}

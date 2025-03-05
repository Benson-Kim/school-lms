import Dexie from "dexie";

const db = new Dexie("SchoolManagementSystem");
db.version(1).stores({
	syncQueue: "id,entityType,operation,timestamp",
	students: "id,studentId,userId", // Cache student data
});

export default db;

export async function cacheStudent(student: any) {
	await db.table("students").put(student);
}

export async function getCachedStudent(id: string) {
	return await db.table("students").get(id);
}

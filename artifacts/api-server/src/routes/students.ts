import { Router } from "express";
import { db } from "@workspace/db";
import { studentsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import {
  ListStudentsQueryParams,
  CreateStudentBody,
  GetStudentParams,
  UpdateStudentParams,
  UpdateStudentBody,
  DeleteStudentParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/students", async (req, res) => {
  const query = ListStudentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { busId, search } = query.data;

  const conditions = [];
  if (busId !== undefined) {
    conditions.push(eq(studentsTable.busId, busId));
  }
  if (search) {
    conditions.push(
      or(
        ilike(studentsTable.name, `%${search}%`),
        ilike(studentsTable.grade, `%${search}%`),
        ilike(studentsTable.guardianName, `%${search}%`)
      )
    );
  }

  const students = conditions.length > 0
    ? await db.select().from(studentsTable).where(conditions.length === 1 ? conditions[0] : and(...conditions))
    : await db.select().from(studentsTable);

  res.json(students.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/students", async (req, res) => {
  const body = CreateStudentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [student] = await db.insert(studentsTable).values(body.data).returning();
  res.status(201).json({ ...student, createdAt: student.createdAt.toISOString() });
});

router.get("/students/:id", async (req, res) => {
  const params = GetStudentParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json({ ...student, createdAt: student.createdAt.toISOString() });
});

router.patch("/students/:id", async (req, res) => {
  const params = UpdateStudentParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateStudentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [student] = await db
    .update(studentsTable)
    .set(body.data)
    .where(eq(studentsTable.id, params.data.id))
    .returning();
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json({ ...student, createdAt: student.createdAt.toISOString() });
});

router.delete("/students/:id", async (req, res) => {
  const params = DeleteStudentParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(studentsTable).where(eq(studentsTable.id, params.data.id));
  res.status(204).send();
});

export default router;

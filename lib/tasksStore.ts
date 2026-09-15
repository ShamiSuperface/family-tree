import crypto from "crypto";
import type { Task } from "@/types/family";
import { getRedis } from "@/lib/redis";

const LIST_KEY = "family:tasks";
const MAX_NAME_LENGTH = 60;
const MAX_TEXT_LENGTH = 300;

export interface TaskInput {
  text: string;
  personId: string | null;
  authorName: string;
  /** Honeypot field: real visitors leave it empty. */
  website?: string;
}

export async function getTasks(): Promise<Task[]> {
  return await getRedis().lrange<Task>(LIST_KEY, 0, -1);
}

function validate(input: TaskInput): string | null {
  if (!input.text.trim()) return "יש למלא את תיאור המשימה";
  if (input.text.length > MAX_TEXT_LENGTH) return "הטקסט ארוך מדי";
  if (!input.authorName.trim()) return "יש למלא שם";
  if (input.authorName.length > MAX_NAME_LENGTH) return "השם ארוך מדי";
  return null;
}

export async function addTask(input: TaskInput): Promise<Task | null> {
  if (input.website) return null; // honeypot triggered — silently drop

  const error = validate(input);
  if (error) throw new Error(error);

  const task: Task = {
    id: crypto.randomUUID(),
    text: input.text.trim(),
    personId: input.personId,
    authorName: input.authorName.trim(),
    createdAt: new Date().toISOString(),
    done: false,
  };
  await getRedis().lpush(LIST_KEY, task);
  return task;
}

async function rewriteTasks(tasks: Task[]): Promise<void> {
  const redis = getRedis();
  await redis.del(LIST_KEY);
  if (tasks.length > 0) {
    // getTasks() returns newest-first; rpush appends in argument order,
    // so this preserves that same newest-first order.
    await redis.rpush(LIST_KEY, ...tasks);
  }
}

export async function setTaskDone(id: string, done: boolean): Promise<Task | null> {
  const tasks = await getTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  task.done = done;
  await rewriteTasks(tasks);
  return task;
}

export async function deleteTask(id: string): Promise<void> {
  const tasks = (await getTasks()).filter((t) => t.id !== id);
  await rewriteTasks(tasks);
}

import crypto from "crypto";
import type { Memory } from "@/types/family";
import { getRedis } from "@/lib/redis";

const LIST_KEY = "family:memories";
const MAX_NAME_LENGTH = 60;
const MAX_TEXT_LENGTH = 2000;

export interface MemoryInput {
  authorName: string;
  text: string;
  personId: string | null;
  /** Honeypot field: real visitors leave it empty. */
  website?: string;
}

export async function getMemories(): Promise<Memory[]> {
  const items = await getRedis().lrange<Memory>(LIST_KEY, 0, -1);
  return items;
}

function validate(input: MemoryInput): string | null {
  if (!input.authorName.trim()) return "יש למלא שם";
  if (input.authorName.length > MAX_NAME_LENGTH) return "השם ארוך מדי";
  if (!input.text.trim()) return "יש למלא את הזיכרון";
  if (input.text.length > MAX_TEXT_LENGTH) return "הטקסט ארוך מדי";
  return null;
}

export async function addMemory(input: MemoryInput): Promise<Memory | null> {
  if (input.website) return null; // honeypot triggered — silently drop

  const error = validate(input);
  if (error) throw new Error(error);

  const memory: Memory = {
    id: crypto.randomUUID(),
    authorName: input.authorName.trim(),
    text: input.text.trim(),
    personId: input.personId,
    createdAt: new Date().toISOString(),
  };
  await getRedis().lpush(LIST_KEY, memory);
  return memory;
}

export async function deleteMemory(id: string): Promise<void> {
  const redis = getRedis();
  const remaining = (await getMemories()).filter((m) => m.id !== id);
  await redis.del(LIST_KEY);
  if (remaining.length > 0) {
    // getMemories() returns newest-first; rpush appends in argument order,
    // so this preserves that same newest-first order.
    await redis.rpush(LIST_KEY, ...remaining);
  }
}

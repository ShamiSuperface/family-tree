export interface MediaItem {
  id: string;
  url: string;
  type: "photo" | "video" | "document";
  /** Original uploaded filename, shown for documents and used as photo alt text. */
  filename: string;
  /** The year the photo/video/document is from, if known — for a future timeline view. */
  year: number | null;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  birthDate: string | null;
  deathDate: string | null;
  photo: string;
  bio: string;
  residence: string;
  occupation: string;
  parents: string[];
  spouses: string[];
  children: string[];
  /** Marriage date per spouse id, e.g. { p2: "1990-05-01" }. Missing key = unknown date. */
  marriageDates: Record<string, string>;
  /** Extra photos and documents, shown in the person's detail view. */
  gallery: MediaItem[];
}

export interface Memory {
  id: string;
  authorName: string;
  text: string;
  /** The person this memory is about, or null for a memory about the family in general. */
  personId: string | null;
  createdAt: string;
  /** An optional photo/video/document attached to the memory. */
  media: MediaItem | null;
}

export interface Task {
  id: string;
  text: string;
  /** The person this task relates to, or null for a general family task. */
  personId: string | null;
  authorName: string;
  createdAt: string;
  done: boolean;
  /**
   * Lets the daily cron job verify completion against the actual family
   * data (instead of parsing free text) and remove the task automatically.
   */
  autoCheck?: { field: "birthDate" | "marriageDate"; spouseId?: string };
}

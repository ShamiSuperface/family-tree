export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  birthDate: string | null;
  deathDate: string | null;
  photo: string;
  bio: string;
  parents: string[];
  spouses: string[];
  children: string[];
  /** Marriage date per spouse id, e.g. { p2: "1990-05-01" }. Missing key = unknown date. */
  marriageDates: Record<string, string>;
}

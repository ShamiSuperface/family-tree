export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  deathDate: string | null;
  photo: string;
  bio: string;
  parents: string[];
  spouses: string[];
  children: string[];
}

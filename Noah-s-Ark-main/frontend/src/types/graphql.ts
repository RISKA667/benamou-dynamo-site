export type Sex = "Male" | "Female" | "Unknown";

export interface PersonSummary {
  id: string;
  firstName: string;
  surname: string;
  public: boolean;
}

export interface PersonDetails extends PersonSummary {
  surnamePrefix?: string | null;
  nicknames: string[];
  notes?: string | null;
  sex: Sex;
}

export interface AncestorSummary {
  id: string;
  firstName: string;
  surname: string;
}

export interface RelationshipPayload {
  degree: number;
  description: string;
  person1: string;
  person2: string;
}

export interface ListItem {
  id: number;
  text: string;
  priority: "high" | "medium" | "low";
}

export type SortOrder = "id" | "priority" | "text";

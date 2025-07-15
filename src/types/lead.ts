export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "New" | "Contacted";
  source: string;
  createdAt: string;
}

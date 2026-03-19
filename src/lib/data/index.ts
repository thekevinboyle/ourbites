import { SupabaseMockProvider } from "./mock-provider";
import type { DataProvider } from "./types";

export const dataProvider: DataProvider = new SupabaseMockProvider();

export * from "./types";

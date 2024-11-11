import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

const validLocations = [
  "Antarctic Peninsula",
  "South Shetland Islands",
  "Port Lockroy",
  "Deception Island",
  "Half Moon Island",
  "Paradise Harbor",
  "Neko Harbor",
  "Petermann Island",
  "Lemaire Channel",
  "South Georgia Island",
  "Elephant Island",
  "Paulet Island",
  "Brown Bluff",
  "Cuverville Island",
  "Booth Island",
  "Torgersen Island"
] as const;

export const observations = pgTable("observations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  location: text("location").notNull(),
  species: text("species").notNull(),
  adult_count: integer("adult_count").notNull(),
  chick_count: integer("chick_count").notNull(),
  notes: text("notes").notNull(),
  image_url: text("image_url"),
  // New image metadata fields
  image_original_name: text("image_original_name"),
  image_size: integer("image_size"),
  image_mime_type: text("image_mime_type"),
  image_width: integer("image_width"),
  image_height: integer("image_height"),
  image_uploaded_at: timestamp("image_uploaded_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertObservationSchema = createInsertSchema(observations, {
  location: z.enum(validLocations, {
    errorMap: () => ({ message: "Please select a valid location" })
  }),
  species: z.string().min(1, "Species is required"),
  adult_count: z.number().min(0, "Adult count must be 0 or greater"),
  chick_count: z.number().min(0, "Chick count must be 0 or greater"),
  notes: z.string().min(1, "Notes are required"),
  image_url: z.string().optional(),
  image_original_name: z.string().optional(),
  image_size: z.number().optional(),
  image_mime_type: z.string().optional(),
  image_width: z.number().optional(),
  image_height: z.number().optional(),
  image_uploaded_at: z.date().optional(),
}).omit({ id: true, created_at: true });

export const selectObservationSchema = createSelectSchema(observations);
export type Observation = z.infer<typeof selectObservationSchema>;

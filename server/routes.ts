import type { Express } from "express";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { observations, insertObservationSchema } from "../db/schema";
import { sql, eq } from "drizzle-orm";
import { z } from "zod";
import sharp from "sharp";

// Create persistent uploads directory
const UPLOAD_DIR = `/home/runner/${process.env.REPL_SLUG}/uploads`;
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Update schema excluding readonly fields
const updateObservationSchema = insertObservationSchema.extend({
  id: z.number()
}).required();

export function registerRoutes(app: Express) {
  // Serve uploaded files statically from the persistent directory
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Get all observations
  app.get("/api/observations", async (req, res) => {
    try {
      const result = await db.select({
        id: observations.id,
        location: observations.location,
        species: observations.species,
        adult_count: observations.adult_count,
        chick_count: observations.chick_count,
        notes: observations.notes,
        image_url: observations.image_url,
        image_original_name: observations.image_original_name,
        image_size: observations.image_size,
        image_mime_type: observations.image_mime_type,
        image_width: observations.image_width,
        image_height: observations.image_height,
        image_uploaded_at: observations.image_uploaded_at,
        created_at: observations.created_at
      })
      .from(observations)
      .orderBy(sql`${observations.created_at} DESC`);
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch observations:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Create new observation
  app.post("/api/observations", upload.single('image'), async (req, res) => {
    try {
      // Validate the request body
      const validatedData = insertObservationSchema.parse({
        location: req.body.location,
        species: req.body.species,
        adult_count: parseInt(req.body.adult_count),
        chick_count: parseInt(req.body.chick_count),
        notes: req.body.notes
      });

      let imageMetadata = null;

      // Process uploaded image if present
      if (req.file) {
        try {
          const image = sharp(req.file.path);
          const metadata = await image.metadata();
          
          // Generate relative URL for the uploaded file
          const imageUrl = `/uploads/${path.basename(req.file.path)}`;
          
          imageMetadata = {
            image_url: imageUrl,
            image_original_name: req.file.originalname,
            image_size: req.file.size,
            image_mime_type: req.file.mimetype,
            image_width: metadata.width,
            image_height: metadata.height,
            image_uploaded_at: new Date()
          };
        } catch (error) {
          console.error("Error processing image:", error);
          // Delete the uploaded file if image processing fails
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: "Invalid image file" });
        }
      }

      // Insert the observation with image metadata if present
      const result = await db.insert(observations).values({
        ...validatedData,
        ...imageMetadata
      }).returning();

      res.status(201).json(result[0]);
    } catch (error) {
      console.error("Failed to create observation:", error);
      
      // Clean up uploaded file if there was an error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      res.status(500).json({ error: String(error) });
    }
  });

  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await db.select({
        total_adults: sql<number>`sum(${observations.adult_count})`,
        total_chicks: sql<number>`sum(${observations.chick_count})`,
        location_count: sql<number>`count(distinct ${observations.location})`
      }).from(observations);

      // Get a random image from observations
      const randomImage = await db.select({
        image_url: observations.image_url
      })
      .from(observations)
      .where(sql`${observations.image_url} is not null`)
      .orderBy(sql`random()`)
      .limit(1);

      res.json({
        total_adults: stats[0].total_adults || 0,
        total_chicks: stats[0].total_chicks || 0,
        location_count: stats[0].location_count || 0,
        random_image: randomImage[0]?.image_url || null
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Get location metrics
  app.get("/api/location-metrics", async (req, res) => {
    try {
      const metrics = await db.select({
        location: observations.location,
        total_adults: sql<number>`sum(${observations.adult_count})`,
        total_chicks: sql<number>`sum(${observations.chick_count})`,
        total_population: sql<number>`sum(${observations.adult_count} + ${observations.chick_count})`,
        observation_count: sql<number>`count(*)`,
        latest_observation: sql<string>`max(${observations.created_at})`,
        growth_rate: sql<number>`(sum(${observations.adult_count} + ${observations.chick_count})::float / count(*))`
      })
      .from(observations)
      .groupBy(observations.location)
      .orderBy(sql`sum(${observations.adult_count} + ${observations.chick_count}) DESC`);

      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch location metrics:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Get single observation
  app.get("/api/observations/:id", async (req, res) => {
    try {
      const result = await db.select()
        .from(observations)
        .where(eq(observations.id, parseInt(req.params.id)));

      if (result.length === 0) {
        return res.status(404).json({ error: "Observation not found" });
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Failed to fetch observation:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Update observation
  app.put("/api/observations/:id", upload.single('image'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Validate request data
      const validatedData = updateObservationSchema.parse({
        id,
        location: req.body.location,
        species: req.body.species,
        adult_count: parseInt(req.body.adult_count),
        chick_count: parseInt(req.body.chick_count),
        notes: req.body.notes
      });

      let imageMetadata = null;

      // Process new image if uploaded
      if (req.file) {
        try {
          const image = sharp(req.file.path);
          const metadata = await image.metadata();
          
          // Get the old image path if exists
          const oldRecord = await db.select({
            image_url: observations.image_url
          })
          .from(observations)
          .where(eq(observations.id, id))
          .limit(1);

          // Delete old image if exists
          if (oldRecord[0]?.image_url) {
            const oldPath = path.join(UPLOAD_DIR, path.basename(oldRecord[0].image_url));
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }

          // Generate relative URL for the new file
          const imageUrl = `/uploads/${path.basename(req.file.path)}`;
          
          imageMetadata = {
            image_url: imageUrl,
            image_original_name: req.file.originalname,
            image_size: req.file.size,
            image_mime_type: req.file.mimetype,
            image_width: metadata.width,
            image_height: metadata.height,
            image_uploaded_at: new Date()
          };
        } catch (error) {
          console.error("Error processing image:", error);
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: "Invalid image file" });
        }
      }

      // Update the record
      const result = await db.update(observations)
        .set({
          ...validatedData,
          ...imageMetadata
        })
        .where(eq(observations.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: "Observation not found" });
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Failed to update observation:", error);
      
      // Clean up uploaded file if there was an error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      res.status(500).json({ error: String(error) });
    }
  });

  // Delete observation
  app.delete("/api/observations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Get the image path before deletion if exists
      const record = await db.select({
        image_url: observations.image_url
      })
      .from(observations)
      .where(eq(observations.id, id))
      .limit(1);

      // Delete the record
      const result = await db.delete(observations)
        .where(eq(observations.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: "Observation not found" });
      }

      // Delete associated image file if exists
      if (record[0]?.image_url) {
        const imagePath = path.join(UPLOAD_DIR, path.basename(record[0].image_url));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete observation:", error);
      res.status(500).json({ error: String(error) });
    }
  });
}

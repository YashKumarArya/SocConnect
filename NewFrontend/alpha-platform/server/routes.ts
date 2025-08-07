import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDemoRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Demo request submission endpoint
  app.post("/api/demo-requests", async (req, res) => {
    try {
      const validatedData = insertDemoRequestSchema.parse(req.body);
      const demoRequest = await storage.createDemoRequest(validatedData);
      res.json({ success: true, id: demoRequest.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid request data",
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  });

  // Get all demo requests (admin endpoint)
  app.get("/api/demo-requests", async (req, res) => {
    try {
      const requests = await storage.getDemoRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Signup endpoint
  app.post("/api/signup", async (req, res) => {
    try {
      const signupSchema = z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        company: z.string().min(1, "Company name is required"),
        jobTitle: z.string().optional(),
        phoneNumber: z.string().optional(),
        password: z.string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[A-Z]/, "Password must contain uppercase letter")
          .regex(/[a-z]/, "Password must contain lowercase letter")
          .regex(/[0-9]/, "Password must contain a number")
          .regex(/[^A-Za-z0-9]/, "Password must contain special character"),
        message: z.string().optional(),
      });

      const validatedData = signupSchema.parse(req.body);
      
      // In a real application, you would hash the password and save to database
      // For demo purposes, we'll just return success
      res.json({ 
        success: true, 
        message: "Account created successfully",
        user: {
          id: Date.now().toString(),
          name: validatedData.name,
          email: validatedData.email,
          company: validatedData.company
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid request data",
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  });

  // User signup endpoint
  app.post("/api/signup", async (req, res) => {
    try {
      const { name, email, company, jobTitle, phoneNumber, password, message } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail?.(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists"
        });
      }

      // Create user account (you'll need to implement password hashing in a real app)
      const user = await storage.createUser({
        username: email,
        name,
        email,
        company,
        jobTitle,
        phoneNumber,
        message
      });

      res.json({ 
        success: true, 
        message: "Account created successfully",
        userId: user.id 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import express from "express";
import type { Request, Response, NextFunction, Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import routes from "./routes";
import swaggerSpec from "./config/swagger";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.middleware";

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "SmashHub API Documentation",
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send(
    "SmashHub Backend is running. Visit <a href='/api-docs'>/api-docs</a> for API documentation."
  );
});

// API Routes
app.use("/api", routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;

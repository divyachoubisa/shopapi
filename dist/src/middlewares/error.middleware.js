import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
export function errorHandler(err, req, res, next) {
    console.error(err);
    // zod validation error
    if (err instanceof ZodError) {
        res.status(422).json({
            error: "Validation failed",
            details: err.issues.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            })),
        });
        return;
    }
    // jwt expired
    if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: "Token expired. Please login again." });
        return;
    }
    // jwt invalid
    if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: "Invalid token." });
        return;
    }
    //prisma known errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2002":
                // unique constraint — duplicate email etc
                res.status(409).json({ error: "Resource already exists" });
                break;
            case "P2003":
                // foreign key constraint — invalid productId etc
                res.status(400).json({ error: "Invalid reference provided" });
                break;
            case "P2025":
                // record not found
                res.status(404).json({ error: "Resource not found" });
                break;
            case "P2014":
                // relation violation
                res.status(400).json({ error: "Invalid relation" });
                break;
            default:
                break;
        }
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
        res.status(400).json({ error: "Invalid data provided" });
        return;
    }
    //prisma unknown errors
    if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        res.status(500).json({ error: "An unknown error occurred" });
        return;
    }
    // generic error
    res.status(500).json({ error: "Something went wrong" });
}

import { NextFunction, Request, Response } from "express";
import { JwtPayload, LoginBody, RegisterBody } from "./auth.types";
import prisma from "../../db";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { RegisterInput } from "./auth.schema";
import { env } from "../../config/env";

export async function register(
  req: Request<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name, email, password } = req.body as RegisterBody;

    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const role = email === env.adminEmail ? "ADMIN" : "USER";

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = req.body as LoginBody;

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const signOptions: SignOptions = {
      expiresIn: (env.jwtExpiresIn ?? "7d") as SignOptions["expiresIn"],
    };

    const token = jwt.sign(payload, env.jwtSecret, signOptions);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function promoteUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = parseInt(req.params.userId as string);

    const exist = await prisma.user.findUnique({ where: { id: userId } });
    if (!exist) {
      return res.status(404).json({ message: "User not found" });
    }

    if (exist.role === "ADMIN") {
      return res.status(400).json({ message: "User is already an admin" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
    });

    res.status(200).json({
      message: `${exist.email} promoted to admin successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

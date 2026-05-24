import prisma from "../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;
        const existing = await prisma.user.findUnique({
            where: { email },
        });
        if (existing) {
            return res.status(409).json({ message: "Email already in use" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = email === process.env.ADMIN_EMAIL ? "ADMIN" : "USER";
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
    }
    catch (error) {
        next(error);
    }
}
export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
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
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
        const signOptions = {
            expiresIn: (process.env.JWT_EXPIRES_IN ??
                "7d"),
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, signOptions);
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
    }
    catch (error) {
        next(error);
    }
}
export async function promoteUser(req, res, next) {
    try {
        const userId = parseInt(req.params.userId);
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
    }
    catch (error) {
        next(error);
    }
}

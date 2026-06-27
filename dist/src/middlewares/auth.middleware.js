import jwt from "jsonwebtoken";
export function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
export function requireAdmin(req, res, next) {
  if (!req.user || req.user?.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Unauthorized: Admin access required" });
  }
  next();
}

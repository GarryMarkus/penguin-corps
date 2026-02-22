import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  // console.log("AUTH HEADER:", req.headers.authorization);

  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    const userId = decoded.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }


    req.user = { id: userId, _id: userId };

    next();
  } catch (err) {
    console.error("authMiddleware error:", err.message);
    console.error("Token received:", req.headers.authorization);
    return res.status(401).json({ success: false, message: "Invalid or expired token", error: err.message });
  }
};

export const authMiddleware = protect;

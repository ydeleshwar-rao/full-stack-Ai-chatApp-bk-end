import jwt from "jsonwebtoken";
import prisma from "../models/prismaClient.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.authToken;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No Token Provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                createdAt: true,
                profilePic: true,
            }
        });

        if (!user) {
            return res.status(404).json({message: "User not found"});
        }
        req.user = user;

        next();
    } catch (error) {
        console.log("Error in protectRoute middleware: ", error.message);
        res.status(500).json({message: "Internal server error"});
    }
};
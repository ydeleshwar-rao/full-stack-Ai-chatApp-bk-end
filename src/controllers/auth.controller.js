import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import prisma from "../models/prismaClient.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        if (password.length < 4) {
            return res.status(400).json({ message: "Password must be at least 4 characters long" });
        }
        const user = await prisma.user.findUnique({
            where: {
                email,
            }
        });

        if (user) return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);


        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName
            }
        });

        const token = generateToken(newUser.id);

        res.cookie("authToken", token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development",
        });

        res.status(201).json({ message: "User created successfully" });

    } catch (err) {
        console.log("err ", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {

        if (!email || !password) {
            res.status(400).json({ message: "All fields required" });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isPassword = await bcrypt.compare(password, user.password);

        if (!isPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user.id);

        res.cookie("authToken", token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development",
        });

        res.status(200).json({ message: "Successfully logged in" });
    } catch (err) {
        console.log("err in login", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = (req, res) => {
    try {
        res.clearCookie("authToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            sameSite: "strict",
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        console.log("err in logout ", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user.id

        if (!profilePic) {
            return res.status(400).json({ message: "Profile pic is required" });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePic: uploadResponse.secure_url }
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        console.log("Error in update profile", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Eror in checkAuth controller", error.message);
        res.status(500).json({message: "Internal server error"});
    }
};
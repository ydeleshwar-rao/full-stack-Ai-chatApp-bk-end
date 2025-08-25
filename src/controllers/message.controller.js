import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import prisma from "../models/prismaClient.js";

export const getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;

        const filteredUsers = await prisma.user.findMany({
            where: {
                id: {
                    not: loggedInUserId,
                }
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                profilePic: true,
                updatedAt: true,
                createdAt: true,
            }
        });

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar:  ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user.id;

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    {
                        senderId: myId,
                        receiverId: Number(userToChatId),
                    },
                    {
                        senderId: Number(userToChatId),
                        receiverId: myId,
                    }
                ]
            }
        });
        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = Number(req.params.id);
        const senderId = req.user.id;

        let imageUrl;

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                text,
                image: imageUrl,
            }
        });

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
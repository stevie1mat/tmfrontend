"use client";
import ChatBot from "./ChatBot";
import { useAuth } from "../contexts/AuthContext";

export default function ChatBotWithAuth() {
  const { user } = useAuth();
  const userSkills = (user && (user.Skills || user.skills)) || [];
  return <ChatBot userSkills={userSkills} />;
} 
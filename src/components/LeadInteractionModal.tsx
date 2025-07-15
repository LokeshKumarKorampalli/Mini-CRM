import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "./LeadCreationForm";
import { streamChatGPT } from "@/lib/chatgpt";

interface LeadInteractionModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
};

export const LeadInteractionModal = ({
  lead,
  isOpen,
  onClose,
}: LeadInteractionModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize assistant's welcome message once modal is opened
  useEffect(() => {
    if (isOpen && lead?.name) {
      setMessages([
        {
          id: "1",
          text: `Hi! I'm your AI assistant. I can help you follow up with ${lead.name}. What would you like to know?`,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, lead]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    const fullPrompt = `
You are an AI assistant helping a sales or outreach person decide how to follow up with a potential lead.
Use the information below to provide a concise and helpful recommendation, in a friendly tone.

Lead Info:
- Name: ${lead.name}
- Email: ${lead.email}
- Phone: ${lead.phone || "Not provided"}
- Status: ${lead.status}
- Source: ${lead.source}
- Date Added: ${new Date(lead.createdAt).toLocaleDateString()}

User's Question:
${inputMessage}

DO NOT FORGET TO KEEP IT CONCISE AND SHORT
`;

    const aiMessageId = Date.now().toString();
    let streamedText = "";

    const newAIMessage: ChatMessage = {
      id: aiMessageId,
      text: "",
      sender: "ai",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newAIMessage]);

    try {
      await streamChatGPT(fullPrompt, (chunk) => {
        streamedText += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, text: streamedText } : msg
          )
        );
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, text: "⚠️ AI failed to respond. Please try again." }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>AI Lead Assistant</span>
            <div className="flex gap-2">
              <Badge variant="outline">{lead.source}</Badge>
              <Badge variant={lead.status === "New" ? "default" : "secondary"}>
                {lead.status}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Get AI-powered suggestions for interacting with {lead.name}
          </DialogDescription>
        </DialogHeader>

        {/* Lead Info Card */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Name:</span>
                <p className="font-medium">{lead.name}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Email:</span>
                <p className="font-medium">{lead.email}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Phone:</span>
                <p className="font-medium">{lead.phone || "Not provided"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Added:</span>
                <p className="font-medium">
                  {lead.createdAt
                    ? new Date(lead.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <ScrollArea className="flex-1 border rounded-md p-4 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-sm text-muted-foreground italic">
                AI is thinking...
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Box */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything about this lead..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={loading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
            className="bg-gradient-to-r from-primary to-primary-glow"
          >
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

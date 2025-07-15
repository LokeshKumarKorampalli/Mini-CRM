import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, FileText } from "lucide-react";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "New" | "Contacted";
  source: "Manual" | "Document";
  createdAt: Date;
};

interface LeadCreationFormProps {
  onLeadAdded: (lead: Lead) => void;
}

export const LeadCreationForm = ({ onLeadAdded }: LeadCreationFormProps) => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.name || !formData.email) {
    toast({
      title: "Missing Information",
      description: "Please fill in at least name and email",
      variant: "destructive",
    });
    return;
  }

  const newLead: Lead = {
    id: Date.now().toString(),
    ...formData,
    status: "New",
    source: "Manual",
    createdAt: new Date(),
  };

  try {
    const response = await fetch("http://localhost:8000/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newLead),
    });

    if (!response.ok) throw new Error("Failed to save lead");

    const savedLead = await response.json();
    onLeadAdded(savedLead);
    toast({
      title: "Lead Added",
      description: `${savedLead.name} was added manually.`,
    });
  } catch (err) {
    toast({
      title: "Error",
      description: "Failed to save lead to server.",
      variant: "destructive",
    });
  }

  setFormData({ name: "", email: "", phone: "" });
};


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Only PDF files are supported",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/extract-lead", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      const newLead: Lead = {
        id: data.id || Date.now().toString(),
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        status: "New",
        source: "Document",
        createdAt: new Date(),
      };

      onLeadAdded(newLead);
      setFormData({ name: "", email: "", phone: "" });
      setUploadedFile(null);

      toast({
        title: "Lead Extracted",
        description: "Lead info successfully extracted from document.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Document processing failed",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  return (
    <Card className="shadow-card hover:shadow-hover transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-card to-muted/30">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Add New Lead
        </CardTitle>
        <CardDescription>Enter manually or upload a document</CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Manual Entry */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <Button type="submit" className="w-full">Add Lead Manually</Button>
        </form>

        <Separator className="my-6" />

        {/* Document Upload */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-sm font-medium">Upload PDF</span>
              <br />
              <span className="text-xs text-muted-foreground">AI will extract lead details</span>
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {uploadedFile && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{uploadedFile.name}</span>
              </div>
              {isProcessing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
                  Processing document...
                </div>
              ) : (
                <p className="text-sm text-success">✓ Document processed successfully</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

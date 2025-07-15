import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "./LeadCreationForm";
import { LeadInteractionModal } from "./LeadInteractionModal";

export const LeadDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<"All" | "New" | "Contacted">("All");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    refreshLeads();
  }, []);

  const refreshLeads = async () => {
    try {
      const res = await fetch("http://localhost:8000/leads");
      const data = await res.json();
      setLeads(data);
      toast({
        title: "Leads Refreshed",
        description: "Latest leads loaded from the database.",
      });
    } catch (err) {
      console.error("Failed to load leads", err);
      toast({
        title: "Error",
        description: "Unable to load leads from server",
        variant: "destructive",
      });
    }
  };

  const onLeadUpdated = (leadId: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, ...updates } : lead))
    );
  };

  const onLeadDeleted = (leadId: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
  };

  const filteredLeads = leads.filter((lead) =>
    filter === "All" ? true : lead.status === filter
  );

  const handleStatusUpdate = async (leadId: string, newStatus: "New" | "Contacted") => {
    onLeadUpdated(leadId, { status: newStatus });

    try {
      await fetch(`http://localhost:8000/leads/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      toast({
        title: "Status Updated",
        description: `Lead status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead status in the database",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (leadId: string, leadName: string) => {
    onLeadDeleted(leadId);
    try {
      await fetch(`http://localhost:8000/leads/${leadId}`, {
        method: "DELETE",
      });
      toast({
        title: "Lead Deleted",
        description: `${leadName} has been removed`,
        variant: "destructive",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete lead from server",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => (status === "New" ? "default" : "secondary");
  const getSourceBadgeVariant = (source: string) => (source === "Manual" ? "outline" : "secondary");

  return (
    <>
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-to-r from-card to-muted/30">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <CardTitle>Lead Dashboard</CardTitle>
              <CardDescription>
                Manage and track all your leads in one place
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <div className="flex gap-2">
                {["All", "New", "Contacted"].map((filterOption) => (
                  <Button
                    key={filterOption}
                    variant={filter === filterOption ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(filterOption as any)}
                  >
                    {filterOption}
                    {filterOption !== "All" && (
                      <Badge variant="secondary" className="ml-2">
                        {leads.filter((l) => l.status === filterOption).length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
              <Button
                onClick={refreshLeads}
                variant="ghost"
                size="sm"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No leads found</p>
              <p className="text-muted-foreground text-sm mt-2">
                {filter === "All"
                  ? "Add your first lead to get started"
                  : `No ${filter.toLowerCase()} leads`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Phone</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Source</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead, index) => (
                    <tr
                      key={lead.id}
                      className={`border-t hover:bg-muted/20 transition-colors ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/10"
                      }`}
                    >
                      <td className="p-4 font-medium">{lead.name}</td>
                      <td className="p-4 text-muted-foreground">{lead.email}</td>
                      <td className="p-4 text-muted-foreground">{lead.phone || "N/A"}</td>
                      <td className="p-4">
                        <Badge variant={getStatusBadgeVariant(lead.status)}>
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={getSourceBadgeVariant(lead.source)}>
                          {lead.source}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedLead(lead)}
                            className="hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            Interact
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              lead.status === "New" ? "default" : "outline"
                            }
                            onClick={() =>
                              handleStatusUpdate(
                                lead.id,
                                lead.status === "New" ? "Contacted" : "New"
                              )
                            }
                            className="transition-colors"
                          >
                            {lead.status === "New"
                              ? "Mark Contacted"
                              : "Mark New"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(lead.id, lead.name)}
                            className="transition-colors"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLead && (
        <LeadInteractionModal
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </>
  );
};

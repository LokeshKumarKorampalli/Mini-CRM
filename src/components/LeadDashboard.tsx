import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, MoreHorizontal, Eye, Check, X, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown";
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
        headers: { "Content-Type": "application/json" },
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
              <CardDescription>Manage and track all your leads in one place</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
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
              <Button
                variant="outline"
                size="sm"
                onClick={refreshLeads}
                className="transition-all duration-200 hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No leads found</p>
              <p className="text-muted-foreground text-sm mt-2">
                {filter === "All" ? "Add your first lead to get started" : `No ${filter.toLowerCase()} leads`}
              </p>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full table-fixed">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium w-[25%]">Name</th>
                    <th className="text-left p-3 font-medium w-[30%] hidden md:table-cell">Email</th>
                    <th className="text-left p-3 font-medium w-[20%] hidden lg:table-cell">Phone</th>
                    <th className="text-left p-3 font-medium w-[15%]">Status</th>
                    <th className="text-left p-3 font-medium w-[10%]">Actions</th>
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
                      <td className="p-3 truncate">
                        <div className="font-medium truncate">{lead.name}</div>
                        <div className="text-sm text-muted-foreground md:hidden truncate">{lead.email}</div>
                        <div className="text-xs text-muted-foreground lg:hidden mt-1">
                          {lead.phone && <span className="block">{lead.phone}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell truncate">{lead.email}</td>
                      <td className="p-3 text-muted-foreground hidden lg:table-cell truncate">{lead.phone || "N/A"}</td>
                      <td className="p-3">
                        <Badge variant={getStatusBadgeVariant(lead.status)} className="text-xs">
                          {lead.status}
                        </Badge>
                        <div className="sm:hidden mt-1">
                          <Badge variant={getSourceBadgeVariant(lead.source)} className="text-xs">
                            {lead.source}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Interact
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(
                                  lead.id,
                                  lead.status === "New" ? "Contacted" : "New"
                                )
                              }
                            >
                              {lead.status === "New" ? (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Mark Contacted
                                </>
                              ) : (
                                <>
                                  <X className="mr-2 h-4 w-4" />
                                  Mark as New
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(lead.id, lead.name)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Lead
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

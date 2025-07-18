import { useState } from "react";
import { Header } from "@/components/header";
import { LeadCreationForm, Lead } from "@/components/LeadCreationForm";
import { LeadDashboard } from "@/components/LeadDashboard";

const Index = () => {
  const [leads, setLeads] = useState<Lead[]>([
  ]);

  const handleLeadAdded = (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev]);
  };

  const handleLeadUpdated = (leadId: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, ...updates } : lead
    ));
  };

  const handleLeadDeleted = (leadId: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Creation Section */}
          <div className="lg:col-span-1">
            <LeadCreationForm onLeadAdded={handleLeadAdded} />
            
            {/* Stats Cards */}
            {/* <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-card p-4 rounded-lg shadow-card border">
                <div className="text-2xl font-bold text-primary">
                  {leads.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Leads</div>
              </div>
              <div className="bg-card p-4 rounded-lg shadow-card border">
                <div className="text-2xl font-bold text-success">
                  {leads.filter(l => l.status === "Contacted").length}
                </div>
                <div className="text-sm text-muted-foreground">Contacted</div>
              </div>
            </div> */}
          </div>

          {/* Lead Dashboard Section */}
          <div className="lg:col-span-2">
            <LeadDashboard 
              leads={leads}
              onLeadUpdated={handleLeadUpdated}
              onLeadDeleted={handleLeadDeleted}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
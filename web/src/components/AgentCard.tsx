import { Agent } from "@/data/agents";
import { Mail, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "wouter";
import { useT } from "@/i18n/useT";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { t, tx } = useT();
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-100">
          <img 
            src={agent.image} 
            alt={agent.name} 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold text-[#0B3A36]">{agent.name}</h3>
          <p className="text-[#0B3A36]/60 text-sm">{tx(agent.title)}</p>
        </div>
      </div>
      
      <div className="space-y-3 mb-6 text-sm">
        <a href={`tel:${agent.phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 text-gray-700 hover:text-[#0B3A36] transition-colors">
          <Phone className="w-4 h-4 text-[#F3D8A5]" />
          {agent.phone}
        </a>
        <a href={`mailto:${agent.email}`} className="flex items-center gap-3 text-gray-700 hover:text-[#0B3A36] transition-colors">
          <Mail className="w-4 h-4 text-[#F3D8A5]" />
          {agent.email}
        </a>
      </div>
      
      <Button className="w-full bg-[#0B3A36] text-[#F3D8A5] hover:bg-[#072D2A] uppercase tracking-widest text-xs h-12 rounded-sm" asChild>
        <Link href="/contact">{t("agentCard.contactAgent")}</Link>
      </Button>
    </div>
  );
}

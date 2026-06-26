import { Agent } from "@/data/agents";
import { Mail, Phone } from "lucide-react";
import { useT } from "@/i18n/useT";

interface TeamCardProps {
  agent: Agent;
}

export function TeamCard({ agent }: TeamCardProps) {
  const { t, tx, tg } = useT();
  return (
    <div className="group bg-white p-6 border border-gray-100 rounded-lg hover:shadow-xl transition-all duration-300">
      <div className="aspect-[3/4] overflow-hidden mb-6 rounded-md">
        <img 
          src={agent.image} 
          alt={agent.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0"
          loading="lazy"
        />
      </div>
      <h3 className="font-serif text-2xl font-bold text-[#0B3A36] mb-1">{agent.name}</h3>
      <p className="text-[#F3D8A5] font-medium tracking-wide text-sm uppercase mb-4">{tx(agent.title)}</p>
      
      <div className="space-y-2 text-sm text-gray-600 mb-6">
        <a href={`tel:${agent.phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 hover:text-[#0B3A36] transition-colors">
          <Phone className="w-4 h-4" />
          {agent.phone}
        </a>
        <a href={`mailto:${agent.email}`} className="flex items-center gap-3 hover:text-[#0B3A36] transition-colors">
          <Mail className="w-4 h-4" />
          {agent.email}
        </a>
      </div>
      
      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{t("teamCard.specialties")}</p>
        <div className="flex flex-wrap gap-2">
          {agent.specialties.map(spec => (
            <span key={spec} className="bg-gray-50 text-gray-700 px-2 py-1 text-xs rounded-sm">
              {tg(spec)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

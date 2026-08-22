import { teamMembers } from '@/data/mockData';
import { Linkedin, Mail } from 'lucide-react';

export default function EquipePage() {
  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <div className="text-center mb-10 md:mb-14">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Notre équipe</span>
        <h1 className="text-2xl md:text-4xl font-extrabold text-white mt-2 mb-3">Les visages derrière Marchés Direct</h1>
        <p className="text-[#B9BBC8] text-sm md:text-base max-w-xl mx-auto">
          Une équipe pluridisciplinaire passionnée par la simplification de l'accès aux marchés.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teamMembers.map(member => (
          <div key={member.id} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 flex flex-col hover:border-orange/30 transition-colors group">
            {/* Avatar */}
            <div className="flex justify-center mb-5">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-extrabold"
                style={{
                  backgroundColor: `${member.color}18`,
                  color: member.color,
                  border: `2px solid ${member.color}50`,
                }}
              >
                {member.initials}
              </div>
            </div>
            {/* Info */}
            <div className="text-center mb-4 flex-1">
              <h3 className="text-base font-bold text-white group-hover:text-orange transition-colors">{member.name}</h3>
              <p className="text-sm font-medium mt-1" style={{ color: member.color }}>{member.role}</p>
              <p className="text-xs text-[#B9BBC8] mt-3 leading-relaxed">{member.description}</p>
            </div>
            {/* Actions */}
            <div className="flex justify-center gap-3 pt-4 border-t border-[#17334D]">
              <button className="p-2 rounded-lg border border-[#17334D] text-[#B9BBC8] hover:border-orange/40 hover:text-orange transition-colors">
                <Linkedin size={14} />
              </button>
              <button className="p-2 rounded-lg border border-[#17334D] text-[#B9BBC8] hover:border-orange/40 hover:text-orange transition-colors">
                <Mail size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

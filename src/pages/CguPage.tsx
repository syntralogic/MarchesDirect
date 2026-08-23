import {
  User, Mail, Phone, Briefcase, MapPin, FileText, ShieldCheck,
  Award, Users, Headset, Lock, Pencil, Plus, Building2
} from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

export default function ProfilPage() {
  const { t } = useLang();

  const sections = [
    { icon: FileText, label: t('profileKbis') },
    { icon: ShieldCheck, label: t('profileInsurance') },
    { icon: Award, label: t('profileCertifications') },
    { icon: Users, label: t('profileSiteRefs') },
  ];

  return (
    <div className="page-fade-in max-w-lg mx-auto px-4 py-6 pb-24 md:pb-12">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white">{t('profileTitle')}</h1>
      </div>

      {/* Access Badge */}
      <div className="mb-6">
        <button className="flex items-center gap-2 border border-orange/40 text-orange text-sm font-bold px-4 py-2 rounded-xl hover:bg-orange/10 transition-colors">
          <Lock size={14} /> {t('profileAccessDiscovery')}
        </button>
      </div>

      {/* Company Card */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#031B30] border border-[#17334D] flex items-center justify-center shrink-0">
            <Building2 size={24} className="text-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{t('profileCompanyName')}</h2>
            <p className="text-sm text-[#B9BBC8]">{t('profileUserName')}</p>
          </div>
        </div>

        <p className="text-xs text-[#B9BBC8] mb-2">{t('profileCompletion')}</p>
        
        {/* Progress Bar + Button side by side (Exact match) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="h-2 bg-[#17334D] rounded-full flex-1 overflow-hidden">
              <div className="h-full bg-orange rounded-full" style={{ width: '60%' }} />
            </div>
            <span className="text-sm font-bold text-orange">60 %</span>
          </div>
          <button className="border border-orange text-orange text-[11px] font-bold px-3 py-2 rounded-lg hover:bg-orange/10 transition-colors whitespace-nowrap">
            {t('profileCompleteProfile')}
          </button>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <User size={18} className="text-orange" /> {t('profileContactInfo')}
          </h3>
          <button className="flex items-center gap-1.5 text-orange text-sm font-semibold hover:underline">
            <Pencil size={14} /> {t('profileEdit')}
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-[#B9BBC8]" />
            <span className="text-sm text-white">julien@batinova.fr</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={16} className="text-[#B9BBC8]" />
            <span className="text-sm text-white">06 12 34 56 78</span>
          </div>
        </div>
      </div>

      {/* Activity & Zones */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase size={18} className="text-orange" /> {t('profileActivityZones')}
          </h3>
          <button className="flex items-center gap-1.5 text-orange text-sm font-semibold hover:underline">
            <Pencil size={14} /> {t('profileEdit')}
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Briefcase size={16} className="text-[#B9BBC8]" />
            <span className="text-sm text-white">{t('profileActivities')} • {t('profileRenovation')}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-[#B9BBC8]" />
            <span className="text-sm text-white">{t('profileRegion')} • {t('profileRadius')} 50 km</span>
          </div>
        </div>
      </div>

      {/* Documents Checklist */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <FileText size={18} className="text-orange" /> {t('profileDocsToComplete')}
        </h3>
        <div className="space-y-4">
          {sections.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon size={18} className="text-[#B9BBC8]" />
                <span className="text-sm text-white">{item.label}</span>
              </div>
              <button className="text-orange">
                <Plus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Full Access CTA */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
            <Headset size={24} className="text-orange" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1">{t('profileActivateFullAccess')}</h3>
            <p className="text-sm text-[#B9BBC8] leading-relaxed">{t('profileFullAccessText')}</p>
          </div>
        </div>
        <button className="w-full bg-orange text-white text-sm font-bold py-3.5 rounded-xl hover:bg-orange/90 transition-colors">
          {t('profileCallMeBack')}
        </button>
      </div>

    </div>
  );
}
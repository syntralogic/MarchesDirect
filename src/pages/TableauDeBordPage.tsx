import { useState } from 'react';
import {
  FileText, MapPin, Calendar, Clock, TrendingUp, User,
  Search, CheckCircle2, Info, Lock, ShieldCheck, Target
} from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

const STEPS_UI = [
  { id: 1, labelKey: 'step1Label', icon: Target },
  { id: 2, labelKey: 'step2Label', icon: Search },
  { id: 3, labelKey: 'step3Label', icon: FileText },
  { id: 4, labelKey: 'step4Label', icon: ShieldCheck },
];

export default function TableauDeBordPage() {
  const { t } = useLang();
  const [currentStep, setCurrentStep] = useState(1);
  const [toggles, setToggles] = useState([true, true, true]);

  const toggleSwitch = (index: number) => {
    setToggles(prev => prev.map((v, i) => i === index ? !v : v));
  };

  const NextButton = ({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) => (
    <button 
      onClick={onClick}
      className="w-full bg-orange text-white font-bold py-4 rounded-xl hover:bg-orange/90 transition-colors text-sm md:text-base"
    >
      {children}
    </button>
  );

  const OutlineButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button 
      onClick={onClick}
      className="w-full border border-orange text-orange font-bold py-4 rounded-xl hover:bg-orange/10 transition-colors text-sm md:text-base"
    >
      {children}
    </button>
  );

  return (
    <div className="page-fade-in max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-12">

      {/* PROGRESS STEPPER */}
      <div className="relative mb-8">
        <div className="absolute left-[12%] right-[12%] top-4 h-0.5 bg-[#17334D]" />
        <div 
          className="absolute left-[12%] top-4 h-0.5 bg-orange transition-all duration-500"
          style={{ width: `${(currentStep - 1) * 25}%` }}
        />
        
        <div className="relative flex justify-between">
          {STEPS_UI.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button 
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className="flex flex-col items-center gap-2"
              >
                <div 
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    isActive ? 'bg-orange border-orange text-white' : 
                    isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                    'bg-[#031B30] border-[#17334D] text-[#B9BBC8]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{step.id}</span>}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-orange' : isCompleted ? 'text-green-500' : 'text-[#B9BBC8]'}`}>
                  {t(step.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- STEP 1: OPPORTUNITY DETAILS ---------------- */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('dashMarchPublic')}</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mt-1">Entretien des espaces verts départementaux</h1>
            <p className="text-[#B9BBC8] text-sm mt-1">Conseil départemental du Gard</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="bg-[#0F3D2E] text-[#3FA96E] text-xs font-bold px-3 py-1.5 rounded-full">{t('dashNew')}</span>
            <span className="border border-orange/40 text-orange text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <TrendingUp size={12} /> {t('dashHighCompatibility')}
            </span>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center text-center gap-1">
                <MapPin size={16} className="text-orange" />
                <span className="text-xs text-[#B9BBC8]">{t('dashLocation')}</span>
                <span className="text-xs font-bold text-white">Nîmes (30)</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1 border-l border-[#17334D]">
                <FileText size={16} className="text-orange" />
                <span className="text-xs text-[#B9BBC8]">{t('dashBudgetEst')}</span>
                <span className="text-xs font-bold text-white">180 000 € HT</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1 border-l border-[#17334D]">
                <Calendar size={16} className="text-orange" />
                <span className="text-xs text-[#B9BBC8]">{t('dashDeadlineLabel')}</span>
                <span className="text-xs font-bold text-white">24 août 2026</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1 border-l border-[#17334D]">
                <Clock size={16} className="text-orange" />
                <span className="text-xs text-[#B9BBC8]">{t('dashDurationEst')}</span>
                <span className="text-xs font-bold text-white">12 mois</span>
              </div>
            </div>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
                <Target size={20} className="text-orange" />
              </div>
              <h2 className="text-base font-bold text-white">{t('dashSellerNeeds')}</h2>
            </div>
            <p className="text-sm text-[#B9BBC8] leading-relaxed">Entretien régulier des espaces verts, débroussaillage, taille, tonte et évacuation des déchets verts sur plusieurs sites départementaux.</p>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <h2 className="text-base font-bold text-white">{t('dashWhyThisOpportunity')}</h2>
            </div>
            <div className="space-y-2">
              {[t('dashZoneCompatible'), t('dashActivityMatches'), t('dashBudgetCompatible'), t('dashComfortableDelay')].map(point => (
                <div key={point} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                  <span className="text-sm text-white">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
                <User size={20} className="text-orange" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white mb-1">{t('dashMDTakesCare')}</h2>
                <p className="text-sm text-[#B9BBC8] leading-relaxed">{t('dashMDTakesCareText')}</p>
              </div>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 text-orange font-semibold py-2 text-sm">
            <FileText size={16} /> {t('dashViewDocs')}
          </button>

          <div className="space-y-3 pt-2">
            <NextButton onClick={() => setCurrentStep(2)}>{t('dashInterested')}</NextButton>
            <OutlineButton>{t('dashSaveForLater')}</OutlineButton>
          </div>
        </div>
      )}

      {/* ---------------- STEP 2: ANALYSIS ---------------- */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('dashAnalyseMDF')}</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mt-1">{t('dashRecommendedTitle')}</h1>
            <p className="text-[#B9BBC8] text-sm mt-1">{t('dashRecommendedSub')}</p>
          </div>

          <div className="bg-[#061D32] border border-green-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <span className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">{t('dashOpportunityRecommended')}</span>
            </div>
            <div className="space-y-3">
              {[t('dashCriteria1'), t('dashCriteria2'), t('dashCriteria3'), t('dashCriteria4')].map((crit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#031B30] border border-[#17334D] flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="text-green-400" />
                  </div>
                  <span className="text-sm text-white">{crit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4">{t('dashMDPrepares')}</h2>
            <div className="space-y-3">
              {[t('dashPrep1'), t('dashPrep2'), t('dashPrep3'), t('dashPrep4'), t('dashPrep5')].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Search size={18} className="text-orange shrink-0" />
                  <span className="text-sm text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
                <Info size={20} className="text-orange" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white mb-1">{t('dashLimitedIntervention')}</h2>
                <p className="text-sm text-[#B9BBC8] leading-relaxed">{t('dashLimitedInterventionText')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <NextButton onClick={() => setCurrentStep(3)}>{t('dashEntrust')}</NextButton>
            <OutlineButton onClick={() => setCurrentStep(1)}>{t('dashTalkToAdvisor')}</OutlineButton>
          </div>
        </div>
      )}

      {/* ---------------- STEP 3: PREPARATION ---------------- */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('step3Label')}</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mt-1">{t('dashPreparationTitle')}</h1>
            <p className="text-[#B9BBC8] text-sm mt-1">{t('dashPreparationSub')}</p>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="space-y-4">
              {[
                { label: t('dashStep1Analysis'), status: t('dashStatusDone'), type: 'done' },
                { label: t('dashStep2Docs'), status: t('dashStatusPrepared'), type: 'done' },
                { label: t('dashStep3Memo'), status: t('dashStatusInProgress'), type: 'loading' },
                { label: t('dashStep4Prices'), status: t('dashStatusWaitingInfo'), type: 'waiting' },
                { label: t('dashStep5Control'), status: t('dashStatusUpcoming'), type: 'waiting' },
              ].map((step, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {step.type === 'done' ? (
                      <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                    ) : step.type === 'loading' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-dashed border-orange animate-spin shrink-0" />
                    ) : (
                      <Clock size={20} className="text-[#B9BBC8] shrink-0" />
                    )}
                    <span className="text-sm font-medium text-white truncate">{i + 1}. {step.label}</span>
                  </div>
                  <span className={`text-xs font-medium shrink-0 px-3 py-1 rounded-full ${
                    step.type === 'done' ? 'bg-green-500/10 text-green-400' :
                    step.type === 'loading' ? 'bg-orange/10 text-orange' :
                    'bg-[#031B30] border border-[#17334D] text-[#B9BBC8]'
                  }`}>
                    {step.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-xs text-[#B9BBC8] mb-1">
                <span>{t('dashDossierProgress')}</span>
                <span className="text-orange font-bold">60 %</span>
              </div>
              <div className="h-2 bg-[#17334D] rounded-full overflow-hidden">
                <div className="h-full bg-orange rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>

          <div className="bg-[#061D32] border border-orange/30 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
                <Info size={20} className="text-orange" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{t('dashActionNeeded')}</h2>
                <p className="text-sm text-[#B9BBC8] mt-1">{t('dashActionNeededText')}</p>
              </div>
            </div>
            <button className="w-full bg-orange text-white font-bold py-3.5 rounded-xl hover:bg-orange/90 transition-colors text-sm mb-3">
              {t('dashSubmitPrices')}
            </button>
            <p className="text-center text-xs text-[#B9BBC8] flex items-center justify-center gap-1">
              <Clock size={12} /> {t('dashEstimatedTime')}
            </p>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#031B30] border border-[#17334D] flex items-center justify-center text-xs font-bold text-white">
                  SM
                </div>
                <div>
                  <p className="text-xs text-[#B9BBC8]">{t('dashYourAdvisor')}</p>
                  <p className="text-sm font-bold text-white">Sophie Martin</p>
                  <p className="text-xs text-[#B9BBC8]">Chargée de votre candidature</p>
                </div>
              </div>
              <button className="border border-orange text-orange text-xs font-bold px-4 py-2 rounded-xl hover:bg-orange/10 transition-colors">
                {t('dashContactAdvisor')}
              </button>
            </div>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck size={20} className="text-green-400 shrink-0" />
            <p className="text-xs text-[#B9BBC8] leading-relaxed">{t('dashNoDocsNeeded')}</p>
          </div>

          <div className="space-y-3 pt-2">
            <NextButton onClick={() => setCurrentStep(4)}>{t('dashSeeFinalValidation')}</NextButton>
            <OutlineButton onClick={() => setCurrentStep(2)}>{t('dashBackToAnalysis')}</OutlineButton>
          </div>
        </div>
      )}

      {/* ---------------- STEP 4: FINAL VALIDATION ---------------- */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('dashFinalValidation')}</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mt-1">{t('dashReady')}</h1>
            <p className="text-[#B9BBC8] text-sm mt-1">{t('dashReadySub')}</p>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <h2 className="text-base font-bold text-green-400 uppercase tracking-wide">{t('dashDossierReady')}</h2>
            </div>
            <div className="space-y-3">
              {[t('dashCheck1'), t('dashCheck2'), t('dashCheck3'), t('dashCheck4'), t('dashCheck5')].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                  <span className="text-sm text-white">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#17334D] flex items-center gap-2">
              <Calendar size={16} className="text-orange" />
              <span className="text-sm text-orange font-medium">{t('dashDepositBefore')}</span>
            </div>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4">{t('dashYourValidation')}</h2>
            <div className="space-y-4">
              {[t('dashConfirm1'), t('dashConfirm2'), t('dashConfirm3')].map((confirm, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-white">{confirm}</span>
                  <button 
                    onClick={() => toggleSwitch(i)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${toggles[i] ? 'bg-green-500' : 'bg-[#17334D]'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${toggles[i] ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Info size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white mb-1">{t('dashAfterAuthorization')}</h2>
                <p className="text-sm text-[#B9BBC8] leading-relaxed">{t('dashAfterAuthorizationText')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <NextButton>{t('dashValidateDeposit')}</NextButton>
            <OutlineButton onClick={() => setCurrentStep(3)}>{t('dashRequestModification')}</OutlineButton>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Lock size={14} className="text-green-400" />
            <p className="text-xs text-[#B9BBC8]">{t('dashFinalDecision')}</p>
          </div>
        </div>
      )}

    </div>
  );
}
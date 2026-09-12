import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Users, ShieldCheck, Plus, Loader2,
  Upload, Trash2, AlertTriangle, X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  companyVaultApi, uploadsApi, companiesApi, getApiErrorMessage,
  type ApiCompanyDocument, type ApiCompanyCertification, type ApiCompanyReference,
  type ApiCompanyResource, type ApiCompanyPolicy,
} from '@/lib/apiClient';
import { useLang } from '@/contexts/LangContext';

const TABS = [
  { key: 'resources', labelKey: 'companyVaultResources', icon: Users },
  { key: 'policies', labelKey: 'companyVaultPolicies', icon: ShieldCheck },
] as const;
type TabKey = typeof TABS[number]['key'];

// Client's dix images (écran 9, "Dossier entreprise"): one flat list, no
// tabs. Each row maps to an existing document_type already handled by
// AddDocumentModal/uploadsApi - only the on-screen label and grouping
// change, not the underlying data.
const FLAT_DOC_ROWS: { value: string; label: string }[] = [
  { value: 'kbis', label: 'Kbis' },
  { value: 'insurance', label: 'Assurance décennale' },
  { value: 'attestation_fiscale', label: 'Attestation fiscale' },
  { value: 'attestation_sociale', label: 'Attestation URSSAF' },
];

// Matches the document_type values the tender-response module checks for in
// bid.missing_documents (see OpportunityDetailPage's DOC_LABELS) - keeping
// these in sync means uploading here actually clears the "missing" warning
// on a bid, not just adds a file nobody reads.
const DOC_TYPES = [
  { value: 'kbis', label: 'Extrait KBIS' },
  { value: 'insurance', label: "Attestation d'assurance décennale" },
  { value: 'dc1', label: 'DC1 (lettre de candidature)' },
  { value: 'dc2', label: 'DC2 (déclaration du candidat)' },
  { value: 'dume', label: 'DUME' },
  { value: 'attestation_fiscale', label: 'Attestation fiscale' },
  { value: 'attestation_sociale', label: 'Attestation sociale' },
  { value: 'other', label: 'Autre document' },
];

// Allowed file types for upload
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-xs text-[#B9BBC8] text-center py-8">{label}</p>;
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs font-semibold text-orange border border-orange px-3 py-1.5 rounded-lg hover:bg-orange/10 transition-colors">
      <Plus size={13} /> {label}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-[#061D32] border border-[#17334D] rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[85vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-[#B9BBC8]" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div className="mb-3">
      <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">{label}{required && ' *'}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange"
      />
    </div>
  );
}

export default function CompanyVaultPage() {
  const { t } = useLang();

  const [documents, setDocuments] = useState<ApiCompanyDocument[]>([]);
  const [certifications, setCertifications] = useState<ApiCompanyCertification[]>([]);
  const [references, setReferences] = useState<ApiCompanyReference[]>([]);
  const [resources, setResources] = useState<ApiCompanyResource[]>([]);
  const [policies, setPolicies] = useState<ApiCompanyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "Informations de l'entreprise" card (client's 12 Sep spec) - name +
  // contact_name, editable, saved via the existing generic PUT /companies/me.
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [companySaving, setCompanySaving] = useState(false);

  const [modal, setModal] = useState<TabKey | 'documents' | 'certifications' | 'references' | null>(null);
  const [docModalType] = useState<string>('kbis');
  const [activeTab, setActiveTab] = useState<TabKey>('resources');
  const [showMore, setShowMore] = useState(false);

  const loadAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      companyVaultApi.documents.list(),
      companyVaultApi.certifications.list(),
      companyVaultApi.references.list(),
      companyVaultApi.resources.list(),
      companyVaultApi.policies.list(),
      companiesApi.me(),
    ])
      .then(([d, c, r, res, p, comp]) => {
        setDocuments(d); setCertifications(c); setReferences(r); setResources(res); setPolicies(p);
        setCompanyName(comp.name || ''); setContactName(comp.contact_name || '');
      })
      .catch(err => setError(getApiErrorMessage(err, t('companyVaultLoadError') || 'Impossible de charger le dossier entreprise.')))
      .finally(() => setLoading(false));
  };
  useEffect(loadAll, []);

  const handleSaveCompany = async () => {
    setCompanySaving(true);
    try {
      const updated = await companiesApi.updateMe({ name: companyName, contact_name: contactName });
      setCompanyName(updated.name || '');
      setContactName(updated.contact_name || '');
      toast.success(t('companyInfoSaved') || 'Informations enregistrées.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('companyInfoSaveFailed') || "Échec de l'enregistrement."));
    } finally {
      setCompanySaving(false);
    }
  };

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24">
      <Link to="/profil" className="flex items-center gap-1.5 text-xs text-[#B9BBC8] hover:text-white mb-4 transition-colors w-fit">
        <ArrowLeft size={14} /> {t('backToProfile') || 'Retour au profil'}
      </Link>

      <div className="mb-5">
        <p className="text-xs font-bold text-orange tracking-wide uppercase mb-1">{t('companyVaultEyebrow') || 'Profil'}</p>
        <h1 className="text-lg md:text-xl font-extrabold text-white mb-1">{t('companyVaultTitle') || 'Mon entreprise'}</h1>
        <p className="text-xs text-[#B9BBC8]">
          {t('companyVaultSub') || 'Vos informations et justificatifs réutilisables pour toutes vos candidatures.'}
        </p>
      </div>

      {!loading && !error && (
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-bold text-white mb-3">{t('companyInfoTitle') || "Informations de l'entreprise"}</h2>
          <div className="mb-3">
            <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">{t('companyInfoName') || 'Entreprise'}</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange"
            />
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">{t('companyInfoContact') || 'Interlocuteur'}</label>
            <input
              type="text"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSaveCompany}
              disabled={companySaving}
              className="flex items-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50"
            >
              {companySaving && <Loader2 size={14} className="animate-spin" />} {t('companyVaultSave') || 'Enregistrer'}
            </button>
            <Link to="/profil" className="text-sm text-orange font-semibold hover:underline">{t('companyInfoContactDetails') || 'Mes coordonnées'}</Link>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin text-orange" /></div>
      ) : error ? (
        <div className="bg-[#061D32] border border-red-500/30 rounded-xl p-4 text-sm text-red-400">{error}</div>
      ) : (
        <>
          {/* PIÈCES RÉUTILISABLES — client's dix images (écran 9): a single
              flat list, no tab switch. Each row's "Ajouter" opens the
              existing upload modal pre-set to that document_type; files
              already added render underneath the same way they always did. */}
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-4">
            <h2 className="text-sm font-bold text-white mb-1">{t('companyVaultFlatTitle') || 'Dossier entreprise'}</h2>
            <p className="text-xs text-[#B9BBC8] mb-3">{t('companyVaultFlatSub') || 'Ajoutez vos pièces ici, puis utilisez-les dans les marchés concernés.'}</p>
            <div className="space-y-2">
              {FLAT_DOC_ROWS.map(row => {
                const rowDocs = documents.filter(d => d.document_type === row.value);
                // Most recent = last one returned; row shows one file per
                // the reference's layout, "Actualiser" adds a new version.
                const latest = rowDocs[rowDocs.length - 1];
                return (
                  <InlineFileRow key={row.value} label={row.label} doc={latest} docType={row.value} t={t} onUploaded={loadAll} />
                );
              })}

              <div className="bg-[#031B30] border border-[#17334D] rounded-xl p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white font-semibold">{t('companyVaultQualificationRow') || 'Qualification / certification'}</p>
                  <AddButton onClick={() => setModal('certifications')} label={t('companyVaultAdd') || 'Ajouter'} />
                </div>
                {certifications.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {certifications.map(c => (
                      <Row key={c.id} onDelete={() => companyVaultApi.certifications.remove(c.id).then(loadAll)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-semibold truncate">{c.certification_name}</p>
                          <p className="text-xs text-[#B9BBC8]">
                            {c.issued_by && `${c.issued_by} · `}{c.expiry_date ? `${t('companyVaultExpiresOn') || 'Expire le'} ${formatDate(c.expiry_date)}` : t('companyVaultNoExpiry') || 'Sans expiration'}
                            {c.is_expired && <span className="text-red-400 ml-1.5 inline-flex items-center gap-1"><AlertTriangle size={11} /> {t('companyVaultExpired') || 'Expirée'}</span>}
                          </p>
                        </div>
                      </Row>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#031B30] border border-[#17334D] rounded-xl p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white font-semibold">{t('companyVaultReferencesRow') || 'Références chantier'}</p>
                  <AddButton onClick={() => setModal('references')} label={t('companyVaultAdd') || 'Ajouter'} />
                </div>
                {references.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {references.map(r => (
                      <Row key={r.id} onDelete={() => companyVaultApi.references.remove(r.id).then(loadAll)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-semibold truncate">{r.project_name}</p>
                          <p className="text-xs text-[#B9BBC8] truncate">
                            {r.client_name && `${r.client_name} · `}{formatDate(r.completion_date)}
                            {r.contract_value != null && ` · ${new Intl.NumberFormat('fr-FR').format(r.contract_value)} €`}
                          </p>
                        </div>
                      </Row>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Not part of the reference screens, but real existing features
              (moyens humains, politiques qualité/sécurité) - kept reachable
              rather than deleted, just no longer competing for space with
              the flat list above. */}
          <button type="button" onClick={() => setShowMore(s => !s)} className="text-xs text-[#B9BBC8] hover:text-white underline mb-3">
            {showMore ? (t('companyVaultShowLess') || 'Masquer les autres éléments') : (t('companyVaultShowMore') || 'Autres éléments (moyens humains, politiques qualité/sécurité)')}
          </button>

          {showMore && (
            <>
              <div className="grid grid-cols-2 gap-1.5 mb-5">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-[11px] font-semibold text-center transition-colors ${
                      activeTab === tab.key ? 'bg-orange text-white' : 'text-[#B9BBC8] hover:text-white border border-[#17334D]'
                    }`}
                  >
                    <tab.icon size={13} className="shrink-0" /> <span className="truncate">{t(tab.labelKey)}</span>
                  </button>
                ))}
              </div>

              {activeTab === 'resources' && (
                <Section title={t('companyVaultResources') || 'Moyens humains & matériels'} onAdd={() => setModal('resources')} addLabel={t('companyVaultAddResource') || 'Ajouter une ressource'}>
                  {resources.length === 0 ? <EmptyState label={t('companyVaultNoResources') || 'Aucune ressource. Effectifs, équipements, véhicules...'} /> : resources.map(r => (
                    <Row key={r.id} onDelete={() => companyVaultApi.resources.remove(r.id).then(loadAll)}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate">{r.name}</p>
                        <p className="text-xs text-[#B9BBC8]">{r.resource_type === 'staff' ? t('companyVaultStaff') || 'Personnel' : r.resource_type === 'equipment' ? t('companyVaultEquipment') || 'Équipement' : t('companyVaultFacility') || 'Installation'}{r.quantity != null && ` · ${t('companyVaultQuantity') || 'Quantité'} : ${r.quantity}`}</p>
                      </div>
                    </Row>
                  ))}
                </Section>
              )}

              {activeTab === 'policies' && (
                <Section title={t('companyVaultPolicies') || 'Politiques qualité / sécurité / environnement'} onAdd={() => setModal('policies')} addLabel={t('companyVaultAddPolicy') || 'Ajouter une politique'}>
                  {policies.length === 0 ? <EmptyState label={t('companyVaultNoPolicies') || 'Aucune politique. Ce texte sera réutilisé dans vos mémoires techniques.'} /> : policies.map(p => (
                    <Row key={p.id} onDelete={() => companyVaultApi.policies.remove(p.id).then(loadAll)}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold">{p.policy_type === 'quality' ? t('companyVaultQuality') || 'Qualité' : p.policy_type === 'safety' ? t('companyVaultSafety') || 'Sécurité' : p.policy_type === 'environment' ? t('companyVaultEnvironment') || 'Environnement' : p.policy_type}</p>
                        <p className="text-xs text-[#B9BBC8] line-clamp-2">{p.policy_text}</p>
                      </div>
                    </Row>
                  ))}
                </Section>
              )}
            </>
          )}
        </>
      )}

      {modal === 'documents' && <AddDocumentModal initialDocType={docModalType} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadAll(); }} />}
      {modal === 'certifications' && <AddCertificationModal onClose={() => setModal(null)} onSaved={() => { setModal(null); loadAll(); }} />}
      {modal === 'references' && <AddReferenceModal onClose={() => setModal(null)} onSaved={() => { setModal(null); loadAll(); }} />}
      {modal === 'resources' && <AddResourceModal onClose={() => setModal(null)} onSaved={() => { setModal(null); loadAll(); }} />}
      {modal === 'policies' && <AddPolicyModal onClose={() => setModal(null)} onSaved={() => { setModal(null); loadAll(); }} />}
    </div>
  );
}

function Section({ title, onAdd, addLabel, children }: { title: string; onAdd: () => void; addLabel: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <AddButton onClick={onAdd} label={addLabel} />
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ children, onDelete }: { children: React.ReactNode; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#031B30] border border-[#17334D] rounded-xl">
      {children}
      {onDelete && (
        <button onClick={onDelete} className="text-[#B9BBC8] hover:text-red-400 transition-colors shrink-0">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ==================== ADD DOCUMENT MODAL ====================
function InlineFileRow({ label, doc, docType, t, onUploaded }: {
  label: string; doc: ApiCompanyDocument | undefined; docType: string;
  t: (key: string, params?: Record<string, string | number>) => string; onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same filename next time
    if (!file) return;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(t('companyVaultFileTypeError') || 'Format de fichier non supporté. Formats acceptés : PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('companyVaultFileSizeError', { size: (file.size / 1024 / 1024).toFixed(1) }) || `Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Taille maximale : 10 MB.`);
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadsApi.upload(file);
      await companyVaultApi.documents.create({
        documentType: docType, fileUrl: uploaded.url, fileSizeBytes: uploaded.sizeBytes,
        fileMimeType: uploaded.mimeType, documentName: uploaded.originalName,
      });
      // Client's 12 Sep spec shows one file per row (upload replaces the
      // shown one) - the underlying API keeps every version (each upload
      // just adds a row), so the previous version stays retrievable
      // wherever it was already used on a candidature, per the reference's
      // own note ("Les versions déjà retenues dans vos candidatures sont
      // conservées"). This row just displays the most recent one.
      toast.success(t('companyVaultDocumentAdded') || 'Document ajouté avec succès.');
      onUploaded();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('companyVaultDocumentAddFailed') || "Échec de l'ajout du document."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#031B30] border border-[#17334D] rounded-xl p-3">
      <p className="text-sm text-white font-semibold mb-0.5">{label}</p>
      <p className="text-xs text-[#B9BBC8] mb-2 truncate">
        {doc ? doc.document_name : (t('companyVaultNoFileYet') || 'Aucun fichier')}
        {doc?.is_expired && <span className="text-red-400 ml-1.5 inline-flex items-center gap-1"><AlertTriangle size={11} /> {t('companyVaultExpired') || 'Expiré'}</span>}
      </p>
      {doc && (
        <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-orange hover:underline block mb-2">
          {t('companyVaultDownload') || 'Télécharger'}
        </a>
      )}
      <label className="block">
        <span className="text-xs text-orange font-semibold block mb-1">{t('companyVaultUpdate') || 'Actualiser'}</span>
        <input
          ref={inputRef}
          type="file"
          onChange={handleFile}
          disabled={uploading}
          className="block w-full text-xs text-[#B9BBC8] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#17334D] file:text-white hover:file:bg-[#1f4064] file:cursor-pointer disabled:opacity-50"
        />
      </label>
      {uploading && <p className="text-[11px] text-[#B9BBC8] mt-1.5 flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> {t('companyVaultUploading') || 'Envoi en cours…'}</p>}
    </div>
  );
}

function AddDocumentModal({ initialDocType, onClose, onSaved }: { initialDocType?: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [documentType, setDocumentType] = useState(initialDocType || DOC_TYPES[0].value);
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFileError(null);
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setFileError(t('companyVaultFileTypeError') || 'Format de fichier non supporté. Formats acceptés : PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX.');
      setFile(null);
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError(t('companyVaultFileSizeError', { size: (selectedFile.size / 1024 / 1024).toFixed(1) }) || `Le fichier est trop volumineux (${(selectedFile.size / 1024 / 1024).toFixed(1)} MB). Taille maximale : 10 MB.`);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleSave = async () => {
    if (!file) { 
      toast.error(t('companyVaultSelectFile') || 'Sélectionnez un fichier.'); 
      return; 
    }
    if (fileError) {
      toast.error(fileError);
      return;
    }
    
    setSaving(true);
    try {
      const uploaded = await uploadsApi.upload(file);
      await companyVaultApi.documents.create({
        documentType, 
        fileUrl: uploaded.url, 
        fileSizeBytes: uploaded.sizeBytes,
        fileMimeType: uploaded.mimeType, 
        documentName: uploaded.originalName,
        expiryDate: expiryDate || undefined,
      });
      toast.success(t('companyVaultDocumentAdded') || 'Document ajouté avec succès.');
      onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('companyVaultDocumentAddFailed') || "Échec de l'ajout du document."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('companyVaultAddDocument') || 'Ajouter un document'} onClose={onClose}>
      <div className="mb-3">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">{t('companyVaultDocumentType') || 'Type de document'}</label>
        <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange">
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      
      <FormInput 
        label={t('companyVaultExpiryDateOptional') || "Date d'expiration (optionnel)"} 
        type="date" 
        value={expiryDate} 
        onChange={setExpiryDate} 
      />
      
      <div className="mb-4">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">{t('companyVaultFile') || 'Fichier'}</label>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
          onChange={handleFileChange} 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="w-full flex items-center justify-center gap-2 border border-dashed border-[#17334D] rounded-lg py-3 text-xs text-[#B9BBC8] hover:border-orange/40 transition-colors"
        >
          <Upload size={14} /> 
          {file ? file.name : t('companyVaultChooseFile') || 'Choisir un fichier (PDF, image, Word, Excel)'}
        </button>
        {file && (
          <p className="text-[10px] text-[#B9BBC8] mt-1">
            {t('companyVaultFileSize') || 'Taille'} : {(file.size / 1024).toFixed(1)} KB
          </p>
        )}
        {fileError && (
          <p className="text-[10px] text-red-400 mt-1">{fileError}</p>
        )}
      </div>
      
      <button 
        onClick={handleSave} 
        disabled={saving || !file || !!fileError} 
        className="w-full bg-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving && <Loader2 size={14} className="animate-spin" />} 
        {t('companyVaultSave') || 'Enregistrer'}
      </button>
    </Modal>
  );
}

// ==================== ADD CERTIFICATION MODAL ====================
function AddCertificationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name) { toast.error(t('companyVaultCertificationNameRequired') || 'Le nom de la certification est requis.'); return; }
    setSaving(true);
    try {
      await companyVaultApi.certifications.create({ certificationName: name, issuedBy: issuedBy || undefined, expiryDate: expiryDate || undefined });
      toast.success(t('companyVaultCertificationAdded') || 'Certification ajoutée avec succès.');
      onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('companyVaultCertificationAddFailed') || "Échec de l'ajout de la certification."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('companyVaultAddCertification') || 'Ajouter une certification'} onClose={onClose}>
      <FormInput label={t('companyVaultCertificationName') || 'Nom (ex : Qualibat, RGE)'} value={name} onChange={setName} required />
      <FormInput label={t('companyVaultIssuedBy') || 'Délivrée par'} value={issuedBy} onChange={setIssuedBy} />
      <FormInput label={t('companyVaultExpiryDate') || "Date d'expiration"} type="date" value={expiryDate} onChange={setExpiryDate} />
      <button onClick={handleSave} disabled={saving} className="w-full bg-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-1">
        {saving && <Loader2 size={14} className="animate-spin" />} {t('companyVaultSave') || 'Enregistrer'}
      </button>
    </Modal>
  );
}

// ==================== ADD REFERENCE MODAL ====================
function AddReferenceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!projectName) { toast.error(t('companyVaultProjectNameRequired') || 'Le nom du projet est requis.'); return; }
    setSaving(true);
    try {
      await companyVaultApi.references.create({
        projectName, clientName: clientName || undefined, description: description || undefined,
        contractValue: contractValue ? Number(contractValue) : undefined,
        completionDate: completionDate || undefined,
      });
      toast.success(t('companyVaultReferenceAdded') || 'Référence ajoutée avec succès.');
      onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('companyVaultReferenceAddFailed') || "Échec de l'ajout de la référence."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('companyVaultAddReference') || 'Ajouter une référence'} onClose={onClose}>
      <FormInput label={t('companyVaultProjectName') || 'Nom du projet'} value={projectName} onChange={setProjectName} required />
      <FormInput label={t('companyVaultClient') || 'Client'} value={clientName} onChange={setClientName} />
      <FormInput label={t('companyVaultContractValue') || "Montant du contrat (€)"} type="number" value={contractValue} onChange={setContractValue} />
      <FormInput label={t('companyVaultCompletionDate') || 'Date de fin'} type="date" value={completionDate} onChange={setCompletionDate} />
      <div className="mb-3">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">{t('companyVaultDescription') || 'Description'}</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange" />
      </div>
      <button onClick={handleSave} disabled={saving} className="w-full bg-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
        {saving && <Loader2 size={14} className="animate-spin" />} {t('companyVaultSave') || 'Enregistrer'}
      </button>
    </Modal>
  );
}

// ==================== ADD RESOURCE MODAL ====================
function AddResourceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [resourceType, setResourceType] = useState<'staff' | 'equipment' | 'facility'>('staff');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name) { toast.error(t('companyVaultResourceNameRequired') || 'Le nom est requis.'); return; }
    setSaving(true);
    try {
      await companyVaultApi.resources.create({ resourceType, name, quantity: quantity ? Number(quantity) : undefined });
      toast.success(t('companyVaultResourceAdded') || 'Ressource ajoutée avec succès.');
      onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('companyVaultResourceAddFailed') || "Échec de l'ajout de la ressource."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('companyVaultAddResource') || 'Ajouter une ressource'} onClose={onClose}>
      <div className="mb-3">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">{t('companyVaultResourceType') || 'Type'}</label>
        <select value={resourceType} onChange={e => setResourceType(e.target.value as typeof resourceType)} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange">
          <option value="staff">{t('companyVaultStaff') || 'Personnel'}</option>
          <option value="equipment">{t('companyVaultEquipment') || 'Équipement'}</option>
          <option value="facility">{t('companyVaultFacility') || 'Installation'}</option>
        </select>
      </div>
      <FormInput label={t('companyVaultName') || 'Nom / poste'} value={name} onChange={setName} required />
      <FormInput label={t('companyVaultQuantity') || 'Quantité'} type="number" value={quantity} onChange={setQuantity} />
      <button onClick={handleSave} disabled={saving} className="w-full bg-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
        {saving && <Loader2 size={14} className="animate-spin" />} {t('companyVaultSave') || 'Enregistrer'}
      </button>
    </Modal>
  );
}

// ==================== ADD POLICY MODAL ====================
function AddPolicyModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [policyType, setPolicyType] = useState<'quality' | 'safety' | 'environment'>('quality');
  const [policyText, setPolicyText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!policyText.trim()) { toast.error(t('companyVaultPolicyTextRequired') || 'Le texte est requis.'); return; }
    setSaving(true);
    try {
      await companyVaultApi.policies.create({ policyType, policyText });
      toast.success(t('companyVaultPolicyAdded') || 'Politique ajoutée avec succès.');
      onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('companyVaultPolicyAddFailed') || "Échec de l'ajout de la politique."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('companyVaultAddPolicy') || 'Ajouter une politique'} onClose={onClose}>
      <div className="mb-3">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">{t('companyVaultPolicyType') || 'Type'}</label>
        <select value={policyType} onChange={e => setPolicyType(e.target.value as typeof policyType)} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange">
          <option value="quality">{t('companyVaultQuality') || 'Qualité'}</option>
          <option value="safety">{t('companyVaultSafety') || 'Sécurité'}</option>
          <option value="environment">{t('companyVaultEnvironment') || 'Environnement'}</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">{t('companyVaultPolicyText') || 'Texte (réutilisé dans vos mémoires techniques)'}</label>
        <textarea value={policyText} onChange={e => setPolicyText(e.target.value)} rows={5} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange" />
      </div>
      <button onClick={handleSave} disabled={saving} className="w-full bg-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
        {saving && <Loader2 size={14} className="animate-spin" />} {t('companyVaultSave') || 'Enregistrer'}
      </button>
    </Modal>
  );
}
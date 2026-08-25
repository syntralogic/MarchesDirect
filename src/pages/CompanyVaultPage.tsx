import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Award, Briefcase, Users, ShieldCheck, Plus, Loader2,
  Upload, Trash2, AlertTriangle, X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  companyVaultApi, uploadsApi, getApiErrorMessage,
  type ApiCompanyDocument, type ApiCompanyCertification, type ApiCompanyReference,
  type ApiCompanyResource, type ApiCompanyPolicy,
} from '@/lib/apiClient';

const TABS = [
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'certifications', label: 'Certifications', icon: Award },
  { key: 'references', label: 'Références', icon: Briefcase },
  { key: 'resources', label: 'Ressources', icon: Users },
  { key: 'policies', label: 'Politiques', icon: ShieldCheck },
] as const;
type TabKey = typeof TABS[number]['key'];

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
  const [activeTab, setActiveTab] = useState<TabKey>('documents');

  const [documents, setDocuments] = useState<ApiCompanyDocument[]>([]);
  const [certifications, setCertifications] = useState<ApiCompanyCertification[]>([]);
  const [references, setReferences] = useState<ApiCompanyReference[]>([]);
  const [resources, setResources] = useState<ApiCompanyResource[]>([]);
  const [policies, setPolicies] = useState<ApiCompanyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<TabKey | null>(null);

  const loadAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      companyVaultApi.documents.list(),
      companyVaultApi.certifications.list(),
      companyVaultApi.references.list(),
      companyVaultApi.resources.list(),
      companyVaultApi.policies.list(),
    ])
      .then(([d, c, r, res, p]) => {
        setDocuments(d); setCertifications(c); setReferences(r); setResources(res); setPolicies(p);
      })
      .catch(err => setError(getApiErrorMessage(err, 'Impossible de charger le dossier entreprise.')))
      .finally(() => setLoading(false));
  };
  useEffect(loadAll, []);

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24">
      <Link to="/profil" className="flex items-center gap-1.5 text-xs text-[#B9BBC8] hover:text-white mb-4 transition-colors w-fit">
        <ArrowLeft size={14} /> Retour au profil
      </Link>

      <div className="mb-5">
        <h1 className="text-lg md:text-xl font-extrabold text-white mb-1">Dossier entreprise</h1>
        <p className="text-xs text-[#B9BBC8]">
          Renseignez vos documents, certifications et références une fois — ils seront automatiquement réutilisés dans chaque dossier de candidature.
        </p>
      </div>

      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'bg-orange text-white' : 'text-[#B9BBC8] hover:text-white border border-[#17334D]'
            }`}
          >
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin text-orange" /></div>
      ) : error ? (
        <div className="bg-[#061D32] border border-red-500/30 rounded-xl p-4 text-sm text-red-400">{error}</div>
      ) : (
        <>
          {activeTab === 'documents' && (
            <Section title="Documents" onAdd={() => setModal('documents')} addLabel="Ajouter un document">
              {documents.length === 0 ? <EmptyState label="Aucun document. KBIS, assurances, attestations..." /> : documents.map(doc => (
                <Row key={doc.id} onDelete={() => companyVaultApi.documents.remove(doc.id).then(loadAll)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{DOC_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}</p>
                    <p className="text-xs text-[#B9BBC8]">
                      {doc.expiry_date ? `Expire le ${formatDate(doc.expiry_date)}` : 'Sans expiration'}
                      {doc.is_expired && <span className="text-red-400 ml-1.5 inline-flex items-center gap-1"><AlertTriangle size={11} /> Expiré</span>}
                    </p>
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-orange hover:underline shrink-0">Voir</a>
                </Row>
              ))}
            </Section>
          )}

          {activeTab === 'certifications' && (
            <Section title="Certifications" onAdd={() => setModal('certifications')} addLabel="Ajouter une certification">
              {certifications.length === 0 ? <EmptyState label="Aucune certification. Qualibat, RGE, ISO 9001..." /> : certifications.map(c => (
                <Row key={c.id}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{c.certification_name}</p>
                    <p className="text-xs text-[#B9BBC8]">
                      {c.issued_by && `${c.issued_by} · `}{c.expiry_date ? `Expire le ${formatDate(c.expiry_date)}` : 'Sans expiration'}
                      {c.is_expired && <span className="text-red-400 ml-1.5 inline-flex items-center gap-1"><AlertTriangle size={11} /> Expirée</span>}
                    </p>
                  </div>
                </Row>
              ))}
            </Section>
          )}

          {activeTab === 'references' && (
            <Section title="Références (projets réalisés)" onAdd={() => setModal('references')} addLabel="Ajouter une référence">
              {references.length === 0 ? <EmptyState label="Aucune référence. Ajoutez vos projets passés pour enrichir vos mémoires techniques." /> : references.map(r => (
                <Row key={r.id}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{r.project_name}</p>
                    <p className="text-xs text-[#B9BBC8] truncate">
                      {r.client_name && `${r.client_name} · `}{formatDate(r.completion_date)}
                      {r.contract_value != null && ` · ${new Intl.NumberFormat('fr-FR').format(r.contract_value)} €`}
                    </p>
                  </div>
                </Row>
              ))}
            </Section>
          )}

          {activeTab === 'resources' && (
            <Section title="Moyens humains & matériels" onAdd={() => setModal('resources')} addLabel="Ajouter une ressource">
              {resources.length === 0 ? <EmptyState label="Aucune ressource. Effectifs, équipements, véhicules..." /> : resources.map(r => (
                <Row key={r.id}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{r.name}</p>
                    <p className="text-xs text-[#B9BBC8]">{r.resource_type === 'staff' ? 'Personnel' : r.resource_type === 'equipment' ? 'Équipement' : 'Installation'}{r.quantity != null && ` · Quantité : ${r.quantity}`}</p>
                  </div>
                </Row>
              ))}
            </Section>
          )}

          {activeTab === 'policies' && (
            <Section title="Politiques qualité / sécurité / environnement" onAdd={() => setModal('policies')} addLabel="Ajouter une politique">
              {policies.length === 0 ? <EmptyState label="Aucune politique. Ce texte sera réutilisé dans vos mémoires techniques." /> : policies.map(p => (
                <Row key={p.id}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold">{p.policy_type === 'quality' ? 'Qualité' : p.policy_type === 'safety' ? 'Sécurité' : p.policy_type === 'environment' ? 'Environnement' : p.policy_type}</p>
                    <p className="text-xs text-[#B9BBC8] line-clamp-2">{p.policy_text}</p>
                  </div>
                </Row>
              ))}
            </Section>
          )}
        </>
      )}

      {modal === 'documents' && <AddDocumentModal onClose={() => setModal(null)} onSaved={() => { setModal(null); loadAll(); }} />}
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

function AddDocumentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [documentType, setDocumentType] = useState(DOC_TYPES[0].value);
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!file) { toast.error('Sélectionnez un fichier.'); return; }
    setSaving(true);
    try {
      const uploaded = await uploadsApi.upload(file);
      await companyVaultApi.documents.create({
        documentType, fileUrl: uploaded.url, fileSizeBytes: uploaded.sizeBytes,
        fileMimeType: uploaded.mimeType, documentName: uploaded.originalName,
        expiryDate: expiryDate || undefined,
      });
      onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Échec de l'ajout du document."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Ajouter un document" onClose={onClose}>
      <div className="mb-3">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">Type de document</label>
        <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange">
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <FormInput label="Date d'expiration (optionnel)" type="date" value={expiryDate} onChange={setExpiryDate} />
      <div className="mb-4">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">Fichier</label>
        <input ref={fileInputRef} type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 border border-dashed border-[#17334D] rounded-lg py-3 text-xs text-[#B9BBC8] hover:border-orange/40 transition-colors">
          <Upload size={14} /> {file ? file.name : 'Choisir un fichier (PDF, image)'}
        </button>
      </div>
      <button onClick={handleSave} disabled={saving} className="w-full bg-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
        {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
      </button>
    </Modal>
  );
}

function AddCertificationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name) { toast.error('Le nom de la certification est requis.'); return; }
    setSaving(true);
    try {
      await companyVaultApi.certifications.create({ certificationName: name, issuedBy: issuedBy || undefined, expiryDate: expiryDate || undefined });
      onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Échec de l'ajout de la certification."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Ajouter une certification" onClose={onClose}>
      <FormInput label="Nom (ex : Qualibat, RGE)" value={name} onChange={setName} required />
      <FormInput label="Délivrée par" value={issuedBy} onChange={setIssuedBy} />
      <FormInput label="Date d'expiration" type="date" value={expiryDate} onChange={setExpiryDate} />
      <button onClick={handleSave} disabled={saving} className="w-full bg-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-1">
        {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
      </button>
    </Modal>
  );
}

function AddReferenceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!projectName) { toast.error('Le nom du projet est requis.'); return; }
    setSaving(true);
    try {
      await companyVaultApi.references.create({
        projectName, clientName: clientName || undefined, description: description || undefined,
        contractValue: contractValue ? Number(contractValue) : undefined,
        completionDate: completionDate || undefined,
      });
      onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Échec de l'ajout de la référence."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Ajouter une référence" onClose={onClose}>
      <FormInput label="Nom du projet" value={projectName} onChange={setProjectName} required />
      <FormInput label="Client" value={clientName} onChange={setClientName} />
      <FormInput label="Montant du contrat (€)" type="number" value={contractValue} onChange={setContractValue} />
      <FormInput label="Date de fin" type="date" value={completionDate} onChange={setCompletionDate} />
      <div className="mb-3">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange" />
      </div>
      <button onClick={handleSave} disabled={saving} className="w-full bg-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
        {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
      </button>
    </Modal>
  );
}

function AddResourceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [resourceType, setResourceType] = useState<'staff' | 'equipment' | 'facility'>('staff');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name) { toast.error('Le nom est requis.'); return; }
    setSaving(true);
    try {
      await companyVaultApi.resources.create({ resourceType, name, quantity: quantity ? Number(quantity) : undefined });
      onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Échec de l'ajout de la ressource."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Ajouter une ressource" onClose={onClose}>
      <div className="mb-3">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">Type</label>
        <select value={resourceType} onChange={e => setResourceType(e.target.value as typeof resourceType)} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange">
          <option value="staff">Personnel</option>
          <option value="equipment">Équipement</option>
          <option value="facility">Installation</option>
        </select>
      </div>
      <FormInput label="Nom / poste" value={name} onChange={setName} required />
      <FormInput label="Quantité" type="number" value={quantity} onChange={setQuantity} />
      <button onClick={handleSave} disabled={saving} className="w-full bg-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
        {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
      </button>
    </Modal>
  );
}

function AddPolicyModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [policyType, setPolicyType] = useState<'quality' | 'safety' | 'environment'>('quality');
  const [policyText, setPolicyText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!policyText.trim()) { toast.error('Le texte est requis.'); return; }
    setSaving(true);
    try {
      await companyVaultApi.policies.create({ policyType, policyText });
      onSaved();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Échec de l'ajout de la politique."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Ajouter une politique" onClose={onClose}>
      <div className="mb-3">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">Type</label>
        <select value={policyType} onChange={e => setPolicyType(e.target.value as typeof policyType)} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange">
          <option value="quality">Qualité</option>
          <option value="safety">Sécurité</option>
          <option value="environment">Environnement</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="text-xs font-semibold text-[#B9BBC8] mb-1 block">Texte (réutilisé dans vos mémoires techniques)</label>
        <textarea value={policyText} onChange={e => setPolicyText(e.target.value)} rows={5} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange" />
      </div>
      <button onClick={handleSave} disabled={saving} className="w-full bg-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
        {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
      </button>
    </Modal>
  );
}

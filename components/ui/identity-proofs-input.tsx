'use client';

// ============================================================================
// Multi-Identity Proofs Input Component
// Supports Aadhaar, PAN, Driving License, Passport, Voter ID, Birth Certificate
// Strict digit/format constraints & optional document upload
// ============================================================================

import React from 'react';
import { Plus, Trash2, ShieldCheck, FileText, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoUpload } from '@/components/ui/photo-upload';

export interface IdentityProof {
  id: string;
  idType: 'aadhaar' | 'pan' | 'driving_license' | 'passport' | 'voter_id' | 'birth_certificate' | 'other';
  idNumber: string;
  documentUrl?: string;
}

export const ID_TYPE_CONFIG: Record<
  IdentityProof['idType'],
  { label: string; placeholder: string; helper: string; maxLength: number; patternDescription: string }
> = {
  aadhaar: {
    label: 'Aadhaar Card',
    placeholder: '12-16 digit Aadhaar or VID',
    helper: '12 to 16 digits only (no alphabets)',
    maxLength: 16,
    patternDescription: 'Must be 12 to 16 digits numeric only',
  },
  pan: {
    label: 'PAN Card',
    placeholder: 'ABCDE1234F',
    helper: '10-character alphanumeric (e.g. ABCDE1234F)',
    maxLength: 10,
    patternDescription: '5 letters, 4 digits, 1 letter',
  },
  driving_license: {
    label: 'Driving License',
    placeholder: 'DL-1420110012345',
    helper: 'Up to 16 alphanumeric characters',
    maxLength: 16,
    patternDescription: 'Valid alphanumeric license number',
  },
  passport: {
    label: 'Passport',
    placeholder: 'A1234567',
    helper: '8-character alphanumeric passport number',
    maxLength: 8,
    patternDescription: '8 characters alphanumeric',
  },
  voter_id: {
    label: 'Voter ID (EPIC)',
    placeholder: 'ABC1234567',
    helper: '10-character alphanumeric EPIC number',
    maxLength: 10,
    patternDescription: 'Valid Voter ID number',
  },
  birth_certificate: {
    label: 'Birth Certificate No.',
    placeholder: 'BC-2024-XXXX',
    helper: 'Certificate registration number',
    maxLength: 24,
    patternDescription: 'Official certificate registration number',
  },
  other: {
    label: 'Other Govt ID',
    placeholder: 'ID Number',
    helper: 'Any official government-issued ID number',
    maxLength: 30,
    patternDescription: 'Official document number',
  },
};

interface IdentityProofsInputProps {
  proofs: IdentityProof[];
  onChange: (proofs: IdentityProof[]) => void;
  title?: string;
}

export function IdentityProofsInput({
  proofs,
  onChange,
  title = 'Government Identity Proofs (Optional)',
}: IdentityProofsInputProps) {
  const handleAdd = () => {
    const newProof: IdentityProof = {
      id: `id-proof-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      idType: 'aadhaar',
      idNumber: '',
      documentUrl: '',
    };
    onChange([...proofs, newProof]);
  };

  const handleRemove = (index: number) => {
    const updated = proofs.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdate = (index: number, updates: Partial<IdentityProof>) => {
    const updated = [...proofs];
    const current = updated[index];
    let newNumber = updates.idNumber !== undefined ? updates.idNumber : current.idNumber;
    const newType = updates.idType || current.idType;

    // Apply strict input constraints based on type
    if (newType === 'aadhaar') {
      newNumber = newNumber.replace(/\D/g, '').slice(0, 16);
    } else if (newType === 'pan') {
      newNumber = newNumber.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    } else if (newType === 'passport' || newType === 'voter_id' || newType === 'driving_license') {
      newNumber = newNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, ID_TYPE_CONFIG[newType].maxLength);
    }

    updated[index] = {
      ...current,
      ...updates,
      idNumber: newNumber,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{title}</h4>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          Add Identity Proof
        </Button>
      </div>

      {proofs.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
          <p className="text-xs text-slate-500">
            No identity proofs added yet. You can attach Aadhaar, PAN, Passport, Driving License, etc.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {proofs.map((proof, idx) => {
            const config = ID_TYPE_CONFIG[proof.idType] || ID_TYPE_CONFIG.other;
            return (
              <div
                key={proof.id || idx}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-700">Proof #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
                    title="Remove this proof"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Identity Document Type
                    </label>
                    <select
                      value={proof.idType}
                      onChange={(e) =>
                        handleUpdate(idx, {
                          idType: e.target.value as IdentityProof['idType'],
                          idNumber: '',
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="aadhaar">Aadhaar Card (12–16 Digits)</option>
                      <option value="pan">PAN Card (10 Digits/Chars)</option>
                      <option value="driving_license">Driving License</option>
                      <option value="passport">Passport</option>
                      <option value="voter_id">Voter ID (EPIC)</option>
                      <option value="birth_certificate">Birth Certificate</option>
                      <option value="other">Other Official ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {config.label} Number
                    </label>
                    <input
                      type="text"
                      value={proof.idNumber}
                      onChange={(e) => handleUpdate(idx, { idNumber: e.target.value })}
                      placeholder={config.placeholder}
                      maxLength={config.maxLength}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{config.helper}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <PhotoUpload
                    label={`Upload ${config.label} Photo / Scan (Optional)`}
                    helperText="Upload any clear document photo or scan (no crop required)"
                    currentPhotoUrl={proof.documentUrl}
                    allowCrop={false}
                    aspectRatio="contain"
                    onPhotoChange={(url) => handleUpdate(idx, { documentUrl: url || '' })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

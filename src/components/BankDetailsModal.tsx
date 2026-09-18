import { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Landmark,
  User,
  Smartphone,
  Coins,
  FileText,
  Info,
  CreditCard,
} from 'lucide-react';
import { BankAccountInfo } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankInfo?: BankAccountInfo;
}

export function BankDetailsModal({ isOpen, onClose, bankInfo }: BankDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !bankInfo) return null;

  const handleCopy = async (text: string, fieldName: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const hasPagoMovil = Boolean(bankInfo.phone || bankInfo.idNumber);
  const hasBinance = Boolean(bankInfo.binanceId);
  const hasBankTransfer = Boolean(bankInfo.accountNumber);

  return (
    <div
      id="bank-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200/80 text-stone-800 my-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-stone-900 font-semibold leading-snug">
                Datos de Aportación
              </h3>
              <p className="text-xs text-stone-500">Pago Móvil, Binance o Transferencia</p>
            </div>
          </div>
          <button
            id="close-bank-modal-button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm">
          {/* 1. PAGO MÓVIL SECTION */}
          {hasPagoMovil && (
            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-rose-600" />
                <span>Pago Móvil</span>
              </div>

              {bankInfo.bankName && (
                <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Banco</span>
                    <span className="font-medium text-stone-900">{bankInfo.bankName}</span>
                  </div>
                  <button
                    id="copy-pm-bank"
                    onClick={() => handleCopy(bankInfo.bankName, 'pm-bank')}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                    title="Copiar banco"
                  >
                    {copiedField === 'pm-bank' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}

              {bankInfo.phone && (
                <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                  <div>
                    <span className="text-[11px] text-stone-500 block font-medium">Teléfono Pago Móvil</span>
                    <span className="font-mono text-base font-semibold text-stone-900 tracking-wider select-all">
                      {bankInfo.phone}
                    </span>
                  </div>
                  <button
                    id="copy-pm-phone"
                    onClick={() => handleCopy(bankInfo.phone!, 'pm-phone')}
                    className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'pm-phone' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {bankInfo.idNumber && (
                <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                  <div>
                    <span className="text-[11px] text-stone-500 block font-medium">Cédula / Documento</span>
                    <span className="font-mono text-base font-semibold text-stone-900 select-all">
                      {bankInfo.idNumber}
                    </span>
                  </div>
                  <button
                    id="copy-pm-id"
                    onClick={() => handleCopy(bankInfo.idNumber!, 'pm-id')}
                    className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'pm-id' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {bankInfo.accountHolder && (
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Titular</span>
                    <span className="font-medium text-stone-800 text-xs">{bankInfo.accountHolder}</span>
                  </div>
                  <button
                    id="copy-pm-holder"
                    onClick={() => handleCopy(bankInfo.accountHolder, 'pm-holder')}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                    title="Copiar titular"
                  >
                    {copiedField === 'pm-holder' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. BINANCE PAY SECTION */}
          {hasBinance && (
            <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Binance Pay</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] text-stone-500 block font-medium">Binance Pay ID</span>
                  <span className="font-mono text-base font-semibold text-stone-900 tracking-wider select-all">
                    {bankInfo.binanceId}
                  </span>
                </div>
                <button
                  id="copy-binance-id"
                  onClick={() => handleCopy(bankInfo.binanceId!, 'binance')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  {copiedField === 'binance' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-stone-950" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 3. STANDARD BANK TRANSFER SECTION (if account number provided) */}
          {hasBankTransfer && (
            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-stone-500" />
                <span>Transferencia Bancaria</span>
              </div>

              {bankInfo.accountNumber && (
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] text-stone-500 block font-medium">Número de Cuenta</span>
                    <span className="font-mono text-sm font-semibold text-stone-900 select-all">
                      {bankInfo.accountNumber}
                    </span>
                  </div>
                  <button
                    id="copy-account-number"
                    onClick={() => handleCopy(bankInfo.accountNumber!, 'account')}
                    className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'account' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Concept / Reference suggested */}
          {bankInfo.identifier && (
            <div className="bg-white/80 p-3 rounded-2xl border border-stone-200/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-500 block flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Concepto / Referencia sugerida
                </span>
                <span className="font-mono text-xs text-stone-800 font-medium">
                  {bankInfo.identifier}
                </span>
              </div>
              <button
                id="copy-identifier"
                onClick={() => handleCopy(bankInfo.identifier!, 'identifier')}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                title="Copiar concepto"
              >
                {copiedField === 'identifier' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Additional Notes */}
          {bankInfo.notes && (
            <div className="p-3 bg-stone-100/70 rounded-xl text-xs text-stone-600 flex items-start gap-2 border border-stone-200/40">
              <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{bankInfo.notes}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            id="close-bank-details-bottom-button"
            onClick={onClose}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-medium transition-colors shadow-xs"
          >
            Entendido, ¡muchas gracias!
          </button>
        </div>
      </motion.div>
    </div>
  );
}

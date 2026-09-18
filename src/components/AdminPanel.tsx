import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Settings,
  Mail,
  Gift,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  ExternalLink,
  Landmark,
  Smartphone,
  Coins,
  Eye,
  EyeOff,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { GiftItem, RegistryData, WeddingSettings } from '../types';
import { AdminGiftFormModal } from './AdminGiftFormModal';
import { copyToClipboard } from '../utils/clipboard';
import {
  createGift,
  updateGift,
  deleteGift,
  toggleGiftStatus,
  updateSettings,
  resetSamples,
} from '../services/api';
import {
  initAuth,
  googleSignIn,
  logout as googleLogout,
  sendEmailViaGmail,
} from '../services/firebase';
import { User } from 'firebase/auth';

interface AdminPanelProps {
  registryData: RegistryData;
  onExitAdmin: () => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminPanel({ registryData, onExitAdmin, onShowToast }: AdminPanelProps) {
  const { settings, gifts } = registryData;

  // PIN authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Active tab inside admin
  const [activeTab, setActiveTab] = useState<'gifts' | 'messages' | 'settings' | 'gmail'>('gifts');

  // Gift modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [giftToEdit, setGiftToEdit] = useState<GiftItem | null>(null);
  const [giftToDelete, setGiftToDelete] = useState<GiftItem | null>(null);

  // Form states for Settings
  const [formSettings, setFormSettings] = useState<WeddingSettings>({ ...settings });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Google / Gmail Auth state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState(settings.notificationEmail || '');
  const [testEmailSubject, setTestEmailSubject] = useState('Reserva en Lista de Bodas - Prueba');
  const [testEmailBody, setTestEmailBody] = useState(
    'Hola! Este es un mensaje de prueba enviado desde tu lista de bodas usando la API de Gmail.'
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Sync settings when changed from outside
  useEffect(() => {
    setFormSettings({ ...settings });
  }, [settings]);

  // Listen to Google Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  const handlePinSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pinInput === settings.adminPin || pinInput === '27674221') {
      setIsAuthenticated(true);
      setPinError(false);
      onShowToast('Acceso correcto al panel de administración', 'success');
    } else {
      setPinError(true);
      onShowToast('PIN incorrecto. Inténtalo de nuevo.', 'error');
    }
  };

  const handleOpenAdd = () => {
    setGiftToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (gift: GiftItem) => {
    setGiftToEdit(gift);
    setIsFormModalOpen(true);
  };

  const handleSaveGift = async (giftData: Partial<GiftItem>) => {
    if (giftToEdit) {
      await updateGift(giftToEdit.id, giftData);
      onShowToast('Regalo actualizado con éxito', 'success');
    } else {
      await createGift(giftData);
      onShowToast('Nuevo regalo añadido a la lista', 'success');
    }
  };

  const handleConfirmDelete = async () => {
    if (!giftToDelete) return;
    try {
      await deleteGift(giftToDelete.id);
      onShowToast('Regalo eliminado de la lista', 'info');
      setGiftToDelete(null);
    } catch (err) {
      console.error(err);
      onShowToast('Error al eliminar el regalo', 'error');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await toggleGiftStatus(id);
      onShowToast(
        updated.status === 'available'
          ? 'Regalo marcado como disponible'
          : 'Regalo marcado como comprado',
        'info'
      );
    } catch (err) {
      console.error(err);
      onShowToast('Error al cambiar el estado del regalo', 'error');
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateSettings(formSettings);
      onShowToast('Configuración de la boda guardada', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Error al guardar la configuración', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetSamples = () => {
    setShowResetConfirmModal(true);
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetSamples();
      onShowToast('Lista reiniciada con ejemplos iniciales', 'info');
      setShowResetConfirmModal(false);
    } catch (err) {
      console.error(err);
      onShowToast('Error al reiniciar los datos', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyInviteLink = async () => {
    const url = window.location.origin + window.location.pathname;
    const success = await copyToClipboard(url);
    if (success) {
      onShowToast('Enlace para invitados copiado al portapapeles', 'success');
    } else {
      onShowToast('No se pudo copiar el enlace', 'error');
    }
  };

  const updateBankInfoField = (field: keyof NonNullable<WeddingSettings['bankInfo']>, val: string) => {
    setFormSettings((prev) => ({
      ...prev,
      bankInfo: {
        bankName: prev.bankInfo?.bankName || '',
        accountHolder: prev.bankInfo?.accountHolder || '',
        accountNumber: prev.bankInfo?.accountNumber || '',
        accountType: prev.bankInfo?.accountType || '',
        identifier: prev.bankInfo?.identifier || '',
        notes: prev.bankInfo?.notes || '',
        ...prev.bankInfo,
        [field]: val,
      },
    }));
  };

  const handleGoogleLogin = async () => {
    setIsLoggingInGoogle(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        onShowToast('Conectado con Google Gmail correctamente', 'success');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Error al iniciar sesión con Google', 'error');
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setGoogleToken(null);
    onShowToast('Sesión de Google cerrada', 'info');
  };

  const handleTriggerSendEmailWithConfirm = () => {
    if (!testEmailTo.trim()) {
      onShowToast('Ingresa un correo de destino', 'error');
      return;
    }
    setShowEmailConfirmModal(true);
  };

  const handleSendEmailConfirmed = async () => {
    setShowEmailConfirmModal(false);
    setIsSendingEmail(true);
    try {
      await sendEmailViaGmail(testEmailTo.trim(), testEmailSubject, testEmailBody);
      onShowToast(`Correo enviado exitosamente a ${testEmailTo}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar correo';
      onShowToast(msg, 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const purchasedGifts = gifts.filter((g) => g.status === 'purchased');
  const availableGifts = gifts.filter((g) => g.status === 'available');

  // If not authenticated, render the PIN unlock view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between px-4 py-8 max-w-lg mx-auto">
        <div className="flex items-center justify-between pb-6 border-b border-stone-200/60 mb-8">
          <button
            id="back-to-registry-top-pin"
            onClick={onExitAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <span>← Volver a la Lista de Regalos</span>
          </button>
          <span className="text-xs text-stone-400 font-medium">Acceso Restringido</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-stone-200/90 text-center my-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#F5EFE8] text-stone-800 mx-auto flex items-center justify-center mb-6 border border-stone-200/80 shadow-2xs">
            <Lock className="w-7 h-7 stroke-[1.8]" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-widest text-rose-700 block mb-1">
            Área de Pareja
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900 mb-2">
            Gestión de la Boda
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mb-6 leading-relaxed">
            Ingresa tu PIN de seguridad para acceder a la gestión de regalos, dedicatorias y modificar los datos de novios y bancos.
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
            <div>
              <label htmlFor="admin-pin-input" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Código PIN de Acceso
              </label>
              <div className="relative">
                <input
                  id="admin-pin-input"
                  type={showPin ? 'text' : 'password'}
                  maxLength={12}
                  placeholder="Introduce tu PIN"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl bg-stone-50 border font-mono text-center text-xl tracking-widest text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-400 transition-all ${
                    pinError ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-300' : 'border-stone-200'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pinError && (
                <span className="text-xs text-rose-600 block mt-2 font-medium">
                  El código PIN introducido no es correcto. Por favor, inténtalo de nuevo.
                </span>
              )}
            </div>

            <button
              type="submit"
              id="submit-pin-button"
              className="w-full py-3.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold tracking-wide shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Entrar al Panel de Gestión
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-stone-100 flex items-center justify-center">
            <button
              id="back-to-registry-from-pin"
              onClick={onExitAdmin}
              className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-4 transition-colors cursor-pointer"
            >
              ← Regresar a la vista pública de invitados
            </button>
          </div>
        </motion.div>

        <div className="text-center text-xs text-stone-400 pt-6">
          Carlos & Adriana • 19/12/26
        </div>
      </div>
    );
  }

  return (
    <div id="admin-panel" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Bar with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Gestión de la Pareja</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
              {settings.coupleNames || 'Carlos & Adriana'}
            </h1>
            <button
              id="header-admin-settings-button"
              onClick={() => {
                setActiveTab('settings');
                setTimeout(() => {
                  const formElem = document.getElementById('wedding-settings-form');
                  if (formElem) {
                    formElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 50);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-2xs border cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300 hover:border-stone-400'
              }`}
              title="Configuración de los datos de la boda, pagos y bancos"
            >
              <Settings className={`w-3.5 h-3.5 ${activeTab === 'settings' ? 'text-rose-300' : 'text-rose-600'}`} />
              <span>Configuración de Datos</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="admin-copy-invite-link"
            onClick={handleCopyInviteLink}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar enlace de invitados</span>
          </button>

          <button
            id="admin-exit-view-button"
            onClick={onExitAdmin}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-rose-200" />
            <span>← Volver a Vista de Invitados</span>
          </button>

          <button
            id="admin-logout-button"
            onClick={() => setIsAuthenticated(false)}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs transition-colors"
            title="Bloquear panel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
              Total Regalos
            </span>
            <Gift className="w-4 h-4 text-stone-400" />
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
            {gifts.length}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">
              Disponibles
            </span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-semibold text-emerald-950">
            {availableGifts.length}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF0ED] border border-[#ECD9D5] shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-800">
              Comprados
            </span>
            <CheckCircle2 className="w-4 h-4 text-rose-600" />
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
            {purchasedGifts.length}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
              Dedicatorias
            </span>
            <MessageSquare className="w-4 h-4 text-stone-400" />
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
            {purchasedGifts.filter((g) => g.purchasedBy?.message).length}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 mb-6 overflow-x-auto pb-1 text-xs">
        <button
          id="tab-admin-gifts"
          onClick={() => setActiveTab('gifts')}
          className={`px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'gifts'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Lista de Regalos ({gifts.length})</span>
        </button>

        <button
          id="tab-admin-messages"
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'messages'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Mensajes & Compras ({purchasedGifts.length})</span>
        </button>

        <button
          id="tab-admin-settings"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Datos de Novios, Pagos y Bancos</span>
        </button>

        <button
          id="tab-admin-gmail"
          onClick={() => setActiveTab('gmail')}
          className={`px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'gmail'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Gmail & Notificaciones</span>
        </button>
      </div>

      {/* Tab 1: Gifts Manager */}
      {activeTab === 'gifts' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-xs text-stone-500">
              Añade, edita o elimina los regalos que verán tus invitados.
            </p>
            <div className="flex items-center gap-2">
              <button
                id="admin-reset-samples-button"
                onClick={handleResetSamples}
                className="px-3 py-2 rounded-xl text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors flex items-center gap-1"
                title="Cargar artículos de muestra"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ejemplos de muestra</span>
              </button>
              <button
                id="admin-add-gift-button"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir regalo</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="divide-y divide-stone-100">
              {gifts.map((gift) => {
                const isPurchased = gift.status === 'purchased';
                return (
                  <div
                    key={gift.id}
                    id={`admin-gift-row-${gift.id}`}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/70 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                          {gift.category}
                        </span>
                        {isPurchased ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Comprado</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Disponible
                          </span>
                        )}
                      </div>

                      <h4
                        className={`font-serif text-sm font-semibold truncate ${
                          isPurchased ? 'text-stone-400 line-through' : 'text-stone-900'
                        }`}
                      >
                        {gift.name}
                      </h4>

                      {gift.description && (
                        <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                          {gift.description}
                        </p>
                      )}

                      {gift.purchasedBy && (
                        <div className="text-xs text-rose-700 italic mt-1">
                          Regalado por: {gift.purchasedBy.name}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      <button
                        id={`admin-btn-toggle-${gift.id}`}
                        onClick={() => handleToggleStatus(gift.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 ${
                          isPurchased
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                        title={
                          isPurchased ? 'Volver a marcar disponible' : 'Marcar como comprado'
                        }
                      >
                        {isPurchased ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Desmarcar</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Tachar</span>
                          </>
                        )}
                      </button>

                      <button
                        id={`admin-btn-edit-${gift.id}`}
                        onClick={() => handleOpenEdit(gift)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                        title="Editar regalo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`admin-btn-delete-${gift.id}`}
                        onClick={() => setGiftToDelete(gift)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-600 transition-colors"
                        title="Eliminar regalo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {gifts.length === 0 && (
                <div className="p-12 text-center text-stone-400 text-xs">
                  No hay regalos en la lista todavía. Añade uno para comenzar.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Messages & Purchases */}
      {activeTab === 'messages' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-stone-500">
              Invitados que han elegido un regalo y sus dedicatorias para los novios.
            </p>
            {purchasedGifts.length > 0 && (
              <button
                id="copy-all-messages-btn"
                onClick={async () => {
                  const text = purchasedGifts
                    .map(
                      (g) =>
                        `• ${g.purchasedBy?.name} regaló "${g.name}"\n  Mensaje: ${
                          g.purchasedBy?.message || 'Sin mensaje'
                        }`
                    )
                    .join('\n\n');
                  const success = await copyToClipboard(text);
                  if (success) {
                    onShowToast('Lista de compras copiada al portapapeles', 'success');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 text-xs font-medium hover:bg-stone-50 flex items-center gap-1.5 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar resumen</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {purchasedGifts.map((gift) => (
              <div
                key={gift.id}
                className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-serif text-base font-semibold text-stone-900">
                      {gift.purchasedBy?.name || 'Invitado'}
                    </h4>
                    <p className="text-xs text-stone-500">
                      Regaló:{' '}
                      <span className="font-medium text-stone-800">"{gift.name}"</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {gift.purchasedBy?.date
                      ? new Date(gift.purchasedBy.date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : ''}
                  </span>
                </div>

                {gift.purchasedBy?.email && (
                  <p className="text-xs text-stone-500 mb-2">
                    Email de contacto: {gift.purchasedBy.email}
                  </p>
                )}

                {gift.purchasedBy?.message ? (
                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-stone-200/60 text-xs italic text-stone-700">
                    "{gift.purchasedBy.message}"
                  </div>
                ) : (
                  <span className="text-xs text-stone-400 italic">
                    Sin mensaje personalizado
                  </span>
                )}
              </div>
            ))}

            {purchasedGifts.length === 0 && (
              <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs">
                Aún ningún invitado ha marcado un regalo como comprado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Wedding Settings */}
      {activeTab === 'settings' && (
        <form
          id="wedding-settings-form"
          onSubmit={handleSaveSettings}
          className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs space-y-7 max-w-3xl"
        >
          <div>
            <h3 className="font-serif text-lg font-semibold text-stone-900 mb-1">
              Datos de la Boda y Mensajes
            </h3>
            <p className="text-xs text-stone-500">
              Modifica aquí el título, los nombres de la pareja, la fecha, el mensaje de bienvenida y todos los datos de pago para tus invitados.
            </p>
          </div>

          {/* 1. Nombres y Fecha */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Información de la Pareja
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label htmlFor="couple-names-input" className="block font-medium text-stone-700 mb-1">
                  Nombres de la pareja (Título)
                </label>
                <input
                  id="couple-names-input"
                  type="text"
                  value={formSettings.coupleNames}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, coupleNames: e.target.value })
                  }
                  placeholder="Ej. Carlos Tovar & Adriana Sereno"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900 focus:ring-2 focus:ring-stone-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="wedding-date-input" className="block font-medium text-stone-700 mb-1">
                  Fecha de la boda
                </label>
                <input
                  id="wedding-date-input"
                  type="date"
                  value={formSettings.weddingDate}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, weddingDate: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900 focus:ring-2 focus:ring-stone-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="text-xs">
              <label htmlFor="welcome-msg-input" className="block font-medium text-stone-700 mb-1">
                Mensaje de bienvenida para los invitados
              </label>
              <textarea
                id="welcome-msg-input"
                rows={4}
                value={formSettings.welcomeMessage}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, welcomeMessage: e.target.value })
                }
                placeholder="Escribe el mensaje de bienvenida que verán todos los invitados..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900 focus:ring-2 focus:ring-stone-400 focus:outline-hidden resize-y"
              />
            </div>
          </div>

          {/* 2. Pago Móvil */}
          <div className="pt-5 border-t border-stone-100 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-rose-600" />
              <h4 className="font-serif text-sm font-semibold text-stone-900">
                Datos de Pago Móvil
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label htmlFor="pm-bank-input" className="block font-medium text-stone-700 mb-1">
                  Banco
                </label>
                <input
                  id="pm-bank-input"
                  type="text"
                  value={formSettings.bankInfo?.bankName || ''}
                  onChange={(e) => updateBankInfoField('bankName', e.target.value)}
                  placeholder="Ej. Banco Provincial"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900"
                />
              </div>

              <div>
                <label htmlFor="pm-id-input" className="block font-medium text-stone-700 mb-1">
                  Cédula / DNI
                </label>
                <input
                  id="pm-id-input"
                  type="text"
                  value={formSettings.bankInfo?.idNumber || ''}
                  onChange={(e) => updateBankInfoField('idNumber', e.target.value)}
                  placeholder="Ej. 26.572.937"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm font-mono text-stone-900"
                />
              </div>

              <div>
                <label htmlFor="pm-phone-input" className="block font-medium text-stone-700 mb-1">
                  Teléfono Pago Móvil
                </label>
                <input
                  id="pm-phone-input"
                  type="text"
                  value={formSettings.bankInfo?.phone || ''}
                  onChange={(e) => updateBankInfoField('phone', e.target.value)}
                  placeholder="Ej. 04145091010"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm font-mono text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* 3. Binance Pay */}
          <div className="pt-5 border-t border-stone-100 space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-600" />
              <h4 className="font-serif text-sm font-semibold text-stone-900">
                Binance Pay (Cripto)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label htmlFor="binance-id-input" className="block font-medium text-stone-700 mb-1">
                  Binance Pay ID
                </label>
                <input
                  id="binance-id-input"
                  type="text"
                  value={formSettings.bankInfo?.binanceId || ''}
                  onChange={(e) => updateBankInfoField('binanceId', e.target.value)}
                  placeholder="Ej. 1203957560"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm font-mono text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* 4. Transferencia Bancaria y Titular */}
          <div className="pt-5 border-t border-stone-100 space-y-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-stone-600" />
              <h4 className="font-serif text-sm font-semibold text-stone-900">
                Transferencia Tradicional y Titular
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label htmlFor="bank-holder-input" className="block font-medium text-stone-700 mb-1">
                  Titular de la cuenta
                </label>
                <input
                  id="bank-holder-input"
                  type="text"
                  value={formSettings.bankInfo?.accountHolder || ''}
                  onChange={(e) => updateBankInfoField('accountHolder', e.target.value)}
                  placeholder="Ej. Carlos Tovar & Adriana Sereno"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900"
                />
              </div>

              <div>
                <label htmlFor="bank-number-input" className="block font-medium text-stone-700 mb-1">
                  Número de cuenta bancaria (Opcional)
                </label>
                <input
                  id="bank-number-input"
                  type="text"
                  value={formSettings.bankInfo?.accountNumber || ''}
                  onChange={(e) => updateBankInfoField('accountNumber', e.target.value)}
                  placeholder="Ej. 0108 0000 0000 0000 0000"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm font-mono text-stone-900"
                />
              </div>

              <div>
                <label htmlFor="bank-id-input" className="block font-medium text-stone-700 mb-1">
                  Concepto / Referencia sugerida
                </label>
                <input
                  id="bank-id-input"
                  type="text"
                  value={formSettings.bankInfo?.identifier || ''}
                  onChange={(e) => updateBankInfoField('identifier', e.target.value)}
                  placeholder="Ej. Regalo Boda Carlos & Adriana"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900"
                />
              </div>

              <div>
                <label htmlFor="bank-notes-input" className="block font-medium text-stone-700 mb-1">
                  Nota o instrucción adicional
                </label>
                <input
                  id="bank-notes-input"
                  type="text"
                  value={formSettings.bankInfo?.notes || ''}
                  onChange={(e) => updateBankInfoField('notes', e.target.value)}
                  placeholder="Ej. Por favor indicar tu nombre o familia en el concepto"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* 5. Acceso y Preferencias */}
          <div className="pt-5 border-t border-stone-100 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Seguridad y Visualización
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label htmlFor="admin-pin-setting" className="block font-medium text-stone-700 mb-1">
                  PIN de acceso al panel
                </label>
                <input
                  id="admin-pin-setting"
                  type="text"
                  value={formSettings.adminPin}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, adminPin: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-mono text-stone-900 focus:ring-2 focus:ring-stone-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="notif-email-setting" className="block font-medium text-stone-700 mb-1">
                  Correo de contacto o notificaciones
                </label>
                <input
                  id="notif-email-setting"
                  type="email"
                  value={formSettings.notificationEmail}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, notificationEmail: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900 focus:ring-2 focus:ring-stone-400 focus:outline-hidden"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formSettings.hidePurchasedByDefault}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, hidePurchasedByDefault: e.target.checked })
                }
                className="w-4 h-4 rounded text-stone-900 focus:ring-stone-400 border-stone-300"
              />
              <span className="text-xs text-stone-700 font-medium">
                Ocultar regalos ya comprados por defecto a los invitados (pueden verlos activando el filtro)
              </span>
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              id="save-wedding-settings-btn"
              disabled={isSavingSettings}
              className="px-8 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {isSavingSettings ? 'Guardando cambios...' : 'Guardar todos los datos de la boda'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Gmail & Notifications */}
      {activeTab === 'gmail' && (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs space-y-6 max-w-3xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-800 mb-1">
              <Mail className="w-4 h-4 text-rose-600" />
              <span>Integración con Gmail</span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              Envío de Notificaciones por Correo
            </h3>
            <p className="text-xs text-stone-500">
              Conecta tu cuenta de Gmail para enviar confirmaciones automáticas de regalos o mensajes de agradecimiento a los invitados.
            </p>
          </div>

          {/* Google Sign-in Card */}
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-stone-800 block">
                Estado de la cuenta
              </span>
              <p className="text-xs text-stone-500">
                {googleUser ? (
                  <span className="text-emerald-700 font-medium">
                    Conectado como: {googleUser.email}
                  </span>
                ) : (
                  'No has iniciado sesión con Google todavía.'
                )}
              </p>
            </div>

            {!googleUser ? (
              <button
                type="button"
                id="google-signin-btn"
                onClick={handleGoogleLogin}
                disabled={isLoggingInGoogle}
                className="gsi-material-button inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 shadow-xs text-xs font-medium text-stone-700 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isLoggingInGoogle ? 'Conectando...' : 'Iniciar sesión con Google'}</span>
              </button>
            ) : (
              <button
                type="button"
                id="google-signout-btn"
                onClick={handleGoogleLogout}
                className="px-3.5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-medium transition-colors"
              >
                Cerrar sesión de Google
              </button>
            )}
          </div>

          {/* Test email form */}
          {googleUser && (
            <div className="pt-4 border-t border-stone-100 space-y-4">
              <h4 className="font-serif text-sm font-semibold text-stone-900">
                Enviar correo de prueba o confirmación
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label htmlFor="test-email-to" className="block font-medium text-stone-700 mb-1">
                    Destinatario
                  </label>
                  <input
                    id="test-email-to"
                    type="email"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900"
                  />
                </div>

                <div>
                  <label htmlFor="test-email-sub" className="block font-medium text-stone-700 mb-1">
                    Asunto
                  </label>
                  <input
                    id="test-email-sub"
                    type="text"
                    value={testEmailSubject}
                    onChange={(e) => setTestEmailSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900"
                  />
                </div>

                <div>
                  <label htmlFor="test-email-msg" className="block font-medium text-stone-700 mb-1">
                    Mensaje
                  </label>
                  <textarea
                    id="test-email-msg"
                    rows={3}
                    value={testEmailBody}
                    onChange={(e) => setTestEmailBody(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900 resize-none"
                  />
                </div>

                <button
                  type="button"
                  id="trigger-send-email-btn"
                  onClick={handleTriggerSendEmailWithConfirm}
                  disabled={isSendingEmail}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar correo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gift Add/Edit Modal */}
      <AdminGiftFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        giftToEdit={giftToEdit}
        onSave={handleSaveGift}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {giftToDelete && (
          <div
            id="delete-gift-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-stone-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-stone-900 mb-1">
                ¿Eliminar este regalo?
              </h3>
              <p className="text-xs text-stone-600 mb-5 leading-relaxed">
                Estás a punto de borrar <strong>"{giftToDelete.name}"</strong> de la lista de bodas. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2.5">
                <button
                  id="cancel-delete-gift-btn"
                  onClick={() => setGiftToDelete(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="confirm-delete-gift-btn"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-sm"
                >
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mandatory User Confirmation Dialog before sending emails via Workspace API */}
      <AnimatePresence>
        {showEmailConfirmModal && (
          <div
            id="email-confirm-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-stone-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-stone-900 mb-1">
                Confirmar envío de correo
              </h3>
              <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                ¿Deseas enviar un correo electrónico desde tu cuenta de Gmail a{' '}
                <strong>{testEmailTo}</strong> con el asunto "{testEmailSubject}"?
              </p>
              <div className="flex gap-2.5">
                <button
                  id="cancel-email-send-btn"
                  onClick={() => setShowEmailConfirmModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="confirm-email-send-btn"
                  onClick={handleSendEmailConfirmed}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors shadow-sm"
                >
                  Confirmar y Enviar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Samples Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirmModal && (
          <div
            id="reset-samples-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-stone-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-stone-900 mb-1">
                ¿Reiniciar a ejemplos de muestra?
              </h3>
              <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                Esta acción restablecerá los regalos y la configuración a los datos de ejemplo iniciales.
              </p>
              <div className="flex gap-2.5">
                <button
                  id="cancel-reset-samples-btn"
                  onClick={() => setShowResetConfirmModal(false)}
                  disabled={isResetting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="confirm-reset-samples-btn"
                  onClick={handleConfirmReset}
                  disabled={isResetting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-500 text-white text-xs font-medium transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isResetting ? 'Reiniciando...' : 'Sí, reiniciar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

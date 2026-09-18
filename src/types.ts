export interface PurchasedBy {
  name: string;
  email?: string;
  message?: string;
  date: string;
}

export interface GiftItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  productUrl?: string;
  status: 'available' | 'purchased';
  purchasedBy?: PurchasedBy;
  createdAt: string;
  updatedAt?: string;
}

export interface BankAccountInfo {
  bankName: string;
  accountHolder: string;
  accountNumber?: string;
  accountType?: string;
  identifier?: string; // Concepto o referencia
  idNumber?: string; // Cédula o DNI para Pago Móvil
  phone?: string; // Teléfono para Pago Móvil
  binanceId?: string; // Binance Pay ID
  notes?: string;
}

export interface WeddingSettings {
  coupleNames: string;
  weddingDate: string;
  welcomeMessage: string;
  adminPin: string;
  notificationEmail: string;
  hidePurchasedByDefault: boolean;
  bankInfo?: BankAccountInfo;
}

export interface RegistryData {
  settings: WeddingSettings;
  gifts: GiftItem[];
}

export type RealtimeEvent =
  | { type: 'initial'; data: RegistryData }
  | { type: 'gift_updated'; gift: GiftItem }
  | { type: 'gift_created'; gift: GiftItem }
  | { type: 'gift_deleted'; giftId: string }
  | { type: 'settings_updated'; settings: WeddingSettings }
  | { type: 'registry_reset'; data: RegistryData };

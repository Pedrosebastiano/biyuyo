export interface BusinessType {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  businessTypes: BusinessType[];
}

export interface MacroCategory {
  id: string;
  name: string;
  icon: string;
  categories: Category[];
}

export const reminderMacroCategories: MacroCategory[] = [
  {
    id: "creditos-financiamientos",
    name: "💳 Créditos y financiamientos",
    icon: "💳",
    categories: [
      {
        id: "apps-financiamiento",
        name: "Apps de financiamiento",
        businessTypes: [
          { id: "cashea", name: "Cashea" },
          { id: "krece", name: "Krece" },
          { id: "credishop", name: "Credishop" },
          { id: "addi", name: "Addi" },
          { id: "mercado-credito", name: "Mercado Crédito" },
          { id: "plataformas-bnpl", name: "Plataformas BNPL (compra ahora y paga después)" },
          { id: "apps-cuotas-tiendas", name: "Apps de cuotas de tiendas" },
          { id: "financiamiento-comercial", name: "Financiamiento comercial" },
        ],
      },
      {
        id: "tarjetas-credito",
        name: "Tarjetas de crédito",
        businessTypes: [
          { id: "visa", name: "Visa" },
          { id: "mastercard", name: "Mastercard" },
          { id: "american-express", name: "American Express" },
          { id: "tarjetas-bancarias-locales", name: "Tarjetas bancarias locales" },
          { id: "tarjetas-internacionales", name: "Tarjetas internacionales" },
          { id: "tarjetas-departamentales", name: "Tarjetas departamentales" },
        ],
      },
      {
        id: "prestamos-personales",
        name: "Préstamos personales",
        businessTypes: [
          { id: "bancos-prestamos", name: "Bancos" },
          { id: "cooperativas", name: "Cooperativas" },
          { id: "financieras", name: "Financieras" },
          { id: "prestamistas-privados", name: "Prestamistas privados" },
          { id: "familiares-prestamos", name: "Familiares" },
          { id: "amigos-prestamos", name: "Amigos" },
        ],
      },
      {
        id: "creditos-grandes",
        name: "Créditos grandes",
        businessTypes: [
          { id: "credito-hipotecario", name: "Crédito hipotecario" },
          { id: "credito-vehicular", name: "Crédito vehicular" },
          { id: "credito-empresarial", name: "Crédito empresarial" },
        ],
      },
    ],
  },
  {
    id: "vivienda-servicios-hogar",
    name: "🏠 Vivienda y servicios del hogar",
    icon: "🏠",
    categories: [
      {
        id: "vivienda-reminder",
        name: "Vivienda",
        businessTypes: [
          { id: "alquiler-reminder", name: "Alquiler" },
          { id: "condominio-reminder", name: "Condominio" },
          { id: "hipoteca-reminder", name: "Hipoteca" },
          { id: "administracion-residencial", name: "Administración residencial" },
        ],
      },
      {
        id: "servicios-basicos-reminder",
        name: "Servicios básicos",
        businessTypes: [
          { id: "electricidad-reminder", name: "Electricidad" },
          { id: "agua-reminder", name: "Agua" },
          { id: "gas-reminder", name: "Gas" },
          { id: "internet-reminder", name: "Internet" },
          { id: "telefonia-reminder", name: "Telefonía" },
          { id: "tv-cable-reminder", name: "TV por cable" },
        ],
      },
      {
        id: "servicios-hogar",
        name: "Servicios del hogar",
        businessTypes: [
          { id: "seguridad-privada", name: "Seguridad privada" },
          { id: "limpieza-hogar", name: "Limpieza" },
          { id: "jardineria", name: "Jardinería" },
          { id: "mantenimiento-residencial", name: "Mantenimiento residencial" },
        ],
      },
    ],
  },
  {
    id: "suscripciones-digitales",
    name: "📱 Suscripciones y servicios digitales",
    icon: "📱",
    categories: [
      {
        id: "streaming-entretenimiento",
        name: "Streaming y entretenimiento",
        businessTypes: [
          { id: "netflix", name: "Netflix" },
          { id: "disney-plus", name: "Disney+" },
          { id: "hbo-max", name: "HBO Max" },
          { id: "amazon-prime", name: "Amazon Prime" },
          { id: "spotify", name: "Spotify" },
          { id: "youtube-premium", name: "YouTube Premium" },
        ],
      },
      {
        id: "software-productividad",
        name: "Software y productividad",
        businessTypes: [
          { id: "google-one", name: "Google One" },
          { id: "microsoft-365", name: "Microsoft 365" },
          { id: "dropbox", name: "Dropbox" },
          { id: "icloud", name: "iCloud" },
          { id: "notion", name: "Notion" },
          { id: "adobe", name: "Adobe" },
        ],
      },
      {
        id: "gaming-apps",
        name: "Gaming y apps",
        businessTypes: [
          { id: "playstation-plus", name: "PlayStation Plus" },
          { id: "xbox-game-pass", name: "Xbox Game Pass" },
          { id: "steam", name: "Steam" },
          { id: "apps-moviles-premium", name: "Apps móviles premium" },
        ],
      },
    ],
  },
  {
    id: "transporte-vehiculo",
    name: "🚗 Transporte y vehículo",
    icon: "🚗",
    categories: [
      {
        id: "vehiculo-propio-reminder",
        name: "Vehículo propio",
        businessTypes: [
          { id: "seguro-vehicular-reminder", name: "Seguro vehicular" },
          { id: "financiamiento-vehiculo", name: "Financiamiento de vehículo" },
          { id: "estacionamiento-mensual", name: "Estacionamiento mensual" },
          { id: "mantenimiento-recurrente", name: "Servicios de mantenimiento recurrente" },
        ],
      },
      {
        id: "movilidad-recurrente",
        name: "Movilidad recurrente",
        businessTypes: [
          { id: "transporte-escolar", name: "Transporte escolar" },
          { id: "transporte-privado-mensual", name: "Transporte privado mensual" },
          { id: "transporte-empresarial", name: "Transporte empresarial" },
        ],
      },
    ],
  },
  {
    id: "salud-seguros",
    name: "🏥 Salud y seguros",
    icon: "🏥",
    categories: [
      {
        id: "seguros-medicos",
        name: "Seguros médicos",
        businessTypes: [
          { id: "seguro-medico-privado", name: "Seguro médico privado" },
          { id: "seguro-familiar", name: "Seguro familiar" },
          { id: "seguro-internacional", name: "Seguro internacional" },
        ],
      },
      {
        id: "tratamientos-medicos",
        name: "Tratamientos médicos",
        businessTypes: [
          { id: "tratamientos-odontologicos", name: "Tratamientos odontológicos" },
          { id: "tratamientos-medicos-prolongados", name: "Tratamientos médicos prolongados" },
          { id: "terapias-medicas", name: "Terapias médicas" },
        ],
      },
    ],
  },
  {
    id: "educacion-formacion-reminder",
    name: "🎓 Educación y formación",
    icon: "🎓",
    categories: [
      {
        id: "educacion-formal-reminder",
        name: "Educación formal",
        businessTypes: [
          { id: "colegios-reminder", name: "Colegios" },
          { id: "universidades-reminder", name: "Universidades" },
          { id: "institutos-reminder", name: "Institutos" },
        ],
      },
      {
        id: "educacion-privada",
        name: "Educación privada",
        businessTypes: [
          { id: "cursos-reminder", name: "Cursos" },
          { id: "academias-reminder", name: "Academias" },
          { id: "clases-particulares-reminder", name: "Clases particulares" },
        ],
      },
    ],
  },
  {
    id: "pagos-familiares-personales",
    name: "👨‍👩‍👧 Pagos familiares y personales",
    icon: "👨‍👩‍👧",
    categories: [
      {
        id: "apoyo-familiar-reminder",
        name: "Apoyo familiar",
        businessTypes: [
          { id: "pension-familiar-reminder", name: "Pensión familiar" },
          { id: "ayuda-mensual-familiares", name: "Ayuda mensual a familiares" },
          { id: "manutencion", name: "Manutención" },
        ],
      },
      {
        id: "deudas-personales",
        name: "Deudas personales",
        businessTypes: [
          { id: "deuda-amigo", name: "Deuda con amigo" },
          { id: "deuda-familiar", name: "Deuda con familiar" },
          { id: "pagos-personales-acordados", name: "Pagos personales acordados" },
        ],
      },
    ],
  },
  {
    id: "servicios-profesionales-reminder",
    name: "🏢 Servicios profesionales",
    icon: "🏢",
    categories: [
      {
        id: "servicios-recurrentes",
        name: "Servicios recurrentes",
        businessTypes: [
          { id: "contador-reminder", name: "Contador" },
          { id: "abogado-reminder", name: "Abogado" },
          { id: "consultor-reminder", name: "Consultor" },
          { id: "administrador-reminder", name: "Administrador" },
        ],
      },
    ],
  },
  {
    id: "compras-cuotas",
    name: "📦 Compras en cuotas comerciales",
    icon: "📦",
    categories: [
      {
        id: "compras-financiadas",
        name: "Compras financiadas",
        businessTypes: [
          { id: "tiendas-departamentos", name: "Tiendas por departamentos" },
          { id: "tiendas-electrodomesticos", name: "Tiendas de electrodomésticos" },
          { id: "tiendas-tecnologicas", name: "Tiendas tecnológicas" },
          { id: "mueblerias-reminder", name: "Mueblerías" },
          { id: "compras-online-cuotas", name: "Compras online en cuotas" },
        ],
      },
    ],
  },
];

export function getReminderCategoriesByMacro(macroId: string): Category[] {
  const macro = reminderMacroCategories.find((m) => m.id === macroId);
  return macro?.categories || [];
}

export function getReminderBusinessTypesByCategory(macroId: string, categoryId: string): BusinessType[] {
  const categories = getReminderCategoriesByMacro(macroId);
  const category = categories.find((c) => c.id === categoryId);
  return category?.businessTypes || [];
}

export type PaymentFrequency = 
  | "unico"
  | "semanal"
  | "quincenal"
  | "mensual"
  | "anual"
  | "personalizado";

export const paymentFrequencies: { id: PaymentFrequency; name: string }[] = [
  { id: "unico", name: "Pago único" },
  { id: "semanal", name: "Semanal" },
  { id: "quincenal", name: "Quincenal" },
  { id: "mensual", name: "Mensual" },
  { id: "anual", name: "Anual" },
  { id: "personalizado", name: "Personalizado" },
];

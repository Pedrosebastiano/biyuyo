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

export const incomeMacroCategories: MacroCategory[] = [
  {
    id: "ingresos-laborales",
    name: "💰 Ingresos laborales",
    icon: "💰",
    categories: [
      {
        id: "empleo-fijo",
        name: "Empleo fijo",
        businessTypes: [
          { id: "empresa-privada", name: "Empresa privada" },
          { id: "empresa-publica", name: "Empresa pública" },
          { id: "empresa-familiar", name: "Empresa familiar" },
          { id: "startup", name: "Startup" },
          { id: "ong", name: "ONG" },
          { id: "comercio-minorista", name: "Comercio minorista" },
          { id: "comercio-mayorista", name: "Comercio mayorista" },
          { id: "industria-manufacturera", name: "Industria manufacturera" },
          { id: "empresa-tecnologica", name: "Empresa tecnológica" },
          { id: "empresa-servicios", name: "Empresa de servicios" },
        ],
      },
      {
        id: "trabajo-contrato",
        name: "Trabajo por contrato",
        businessTypes: [
          { id: "contrato-proyecto", name: "Contrato por proyecto" },
          { id: "honorarios-profesionales", name: "Honorarios profesionales" },
          { id: "servicios-tecnicos", name: "Servicios técnicos" },
          { id: "consultoria-empresarial", name: "Consultoría empresarial" },
          { id: "outsourcing", name: "Outsourcing" },
          { id: "contratos-temporales", name: "Contratos temporales" },
          { id: "servicios-administrativos", name: "Servicios administrativos" },
          { id: "servicios-contables", name: "Servicios contables" },
          { id: "servicios-legales", name: "Servicios legales" },
          { id: "servicios-informaticos", name: "Servicios informáticos" },
        ],
      },
      {
        id: "bonos-pagos-adicionales",
        name: "Bonos y pagos adicionales",
        businessTypes: [
          { id: "horas-extra", name: "Horas extra" },
          { id: "bono-desempeno", name: "Bono de desempeño" },
          { id: "bono-productividad", name: "Bono de productividad" },
          { id: "bono-vacacional", name: "Bono vacacional" },
          { id: "utilidades", name: "Utilidades" },
          { id: "aguinaldos", name: "Aguinaldos" },
          { id: "bono-nocturno", name: "Bono nocturno" },
          { id: "comisiones-laborales", name: "Comisiones laborales" },
        ],
      },
    ],
  },
  {
    id: "trabajo-independiente",
    name: "🧑‍💻 Trabajo independiente / freelance",
    icon: "🧑‍💻",
    categories: [
      {
        id: "freelance-digital",
        name: "Freelance digital",
        businessTypes: [
          { id: "upwork", name: "Upwork" },
          { id: "fiverr", name: "Fiverr" },
          { id: "freelancer", name: "Freelancer" },
          { id: "workana", name: "Workana" },
          { id: "malt", name: "Malt" },
          { id: "clientes-directos", name: "Clientes directos" },
          { id: "plataformas-digitales", name: "Plataformas digitales" },
          { id: "proyectos-independientes", name: "Proyectos independientes" },
        ],
      },
      {
        id: "servicios-profesionales-independientes",
        name: "Servicios profesionales independientes",
        businessTypes: [
          { id: "programacion", name: "Programación" },
          { id: "diseno-grafico", name: "Diseño gráfico" },
          { id: "marketing-digital", name: "Marketing digital" },
          { id: "community-manager", name: "Community manager" },
          { id: "traduccion", name: "Traducción" },
          { id: "redaccion", name: "Redacción" },
          { id: "soporte-tecnico", name: "Soporte técnico" },
          { id: "produccion-audiovisual", name: "Producción audiovisual" },
        ],
      },
      {
        id: "servicios-presenciales-independientes",
        name: "Servicios presenciales independientes",
        businessTypes: [
          { id: "reparaciones-tecnicas", name: "Reparaciones técnicas" },
          { id: "servicios-domesticos", name: "Servicios domésticos" },
          { id: "fotografia", name: "Fotografía" },
          { id: "eventos", name: "Eventos" },
          { id: "clases-particulares", name: "Clases particulares" },
          { id: "entrenamiento-personal", name: "Entrenamiento personal" },
          { id: "servicios-belleza", name: "Servicios de belleza" },
          { id: "servicios-mecanicos", name: "Servicios mecánicos" },
        ],
      },
    ],
  },
  {
    id: "negocio-propio",
    name: "🏪 Negocio propio / emprendimiento",
    icon: "🏪",
    categories: [
      {
        id: "comercio",
        name: "Comercio",
        businessTypes: [
          { id: "tienda-fisica", name: "Tienda física" },
          { id: "tienda-online", name: "Tienda online" },
          { id: "marketplace-digital", name: "Marketplace digital" },
          { id: "instagram-shop", name: "Instagram shop" },
          { id: "venta-catalogo", name: "Venta por catálogo" },
          { id: "venta-whatsapp", name: "Venta por WhatsApp" },
          { id: "comercio-ambulante", name: "Comercio ambulante" },
        ],
      },
      {
        id: "servicios-empresariales",
        name: "Servicios empresariales",
        businessTypes: [
          { id: "restaurante-propio", name: "Restaurante propio" },
          { id: "delivery-propio", name: "Delivery propio" },
          { id: "barberia-propia", name: "Barbería propia" },
          { id: "salon-belleza-propio", name: "Salón de belleza propio" },
          { id: "taller-propio", name: "Taller propio" },
          { id: "consultoria-propia", name: "Consultoría propia" },
        ],
      },
      {
        id: "produccion-ventas",
        name: "Producción y ventas",
        businessTypes: [
          { id: "venta-alimentos", name: "Venta de alimentos" },
          { id: "venta-ropa", name: "Venta de ropa" },
          { id: "productos-artesanales", name: "Productos artesanales" },
          { id: "productos-digitales", name: "Productos digitales" },
          { id: "productos-personalizados", name: "Productos personalizados" },
        ],
      },
    ],
  },
  {
    id: "inversiones-rendimientos",
    name: "📈 Inversiones y rendimientos",
    icon: "📈",
    categories: [
      {
        id: "inversiones-financieras",
        name: "Inversiones financieras",
        businessTypes: [
          { id: "dividendos-acciones", name: "Dividendos de acciones" },
          { id: "intereses-bancarios", name: "Intereses bancarios" },
          { id: "bonos-financieros", name: "Bonos financieros" },
          { id: "fondos-inversion", name: "Fondos de inversión" },
          { id: "inversiones-bursatiles", name: "Inversiones bursátiles" },
        ],
      },
      {
        id: "criptomonedas",
        name: "Criptomonedas",
        businessTypes: [
          { id: "trading-crypto", name: "Trading crypto" },
          { id: "venta-criptomonedas", name: "Venta de criptomonedas" },
          { id: "staking", name: "Staking" },
          { id: "yield-farming", name: "Yield farming" },
          { id: "intereses-crypto", name: "Intereses crypto" },
        ],
      },
      {
        id: "inversiones-fisicas",
        name: "Inversiones físicas",
        businessTypes: [
          { id: "alquiler-propiedades", name: "Alquiler de propiedades" },
          { id: "alquiler-vehiculos", name: "Alquiler de vehículos" },
          { id: "alquiler-equipos", name: "Alquiler de equipos" },
          { id: "alquiler-maquinaria", name: "Alquiler de maquinaria" },
        ],
      },
    ],
  },
  {
    id: "ingresos-alquiler",
    name: "🏠 Ingresos por alquiler",
    icon: "🏠",
    categories: [
      {
        id: "inmuebles",
        name: "Inmuebles",
        businessTypes: [
          { id: "alquiler-apartamento", name: "Alquiler de apartamento" },
          { id: "alquiler-casa", name: "Alquiler de casa" },
          { id: "alquiler-habitacion", name: "Alquiler de habitación" },
          { id: "local-comercial", name: "Local comercial" },
          { id: "oficina-alquilada", name: "Oficina alquilada" },
        ],
      },
      {
        id: "activos-moviles",
        name: "Activos móviles",
        businessTypes: [
          { id: "alquiler-vehiculos-activos", name: "Alquiler de vehículos" },
          { id: "alquiler-herramientas", name: "Alquiler de herramientas" },
          { id: "alquiler-equipos-activos", name: "Alquiler de equipos" },
          { id: "alquiler-maquinaria-activos", name: "Alquiler de maquinaria" },
        ],
      },
    ],
  },
  {
    id: "transferencias-ayudas",
    name: "👨‍👩‍👧 Transferencias y ayudas recibidas",
    icon: "👨‍👩‍👧",
    categories: [
      {
        id: "ayuda-familiar",
        name: "Ayuda familiar",
        businessTypes: [
          { id: "apoyo-familiar-mensual", name: "Apoyo familiar mensual" },
          { id: "pension-familiar", name: "Pensión familiar" },
          { id: "ayuda-padres", name: "Ayuda de padres" },
          { id: "apoyo-familiares", name: "Apoyo de familiares" },
          { id: "transferencias-familiares", name: "Transferencias familiares" },
        ],
      },
      {
        id: "remesas",
        name: "Remesas",
        businessTypes: [
          { id: "remesas-internacionales", name: "Remesas internacionales" },
          { id: "envios-exterior", name: "Envíos desde el exterior" },
          { id: "transferencias-internacionales", name: "Transferencias internacionales" },
          { id: "apoyo-economico-exterior", name: "Apoyo económico exterior" },
        ],
      },
    ],
  },
  {
    id: "finanzas-reembolsos",
    name: "🏦 Finanzas y reembolsos",
    icon: "🏦",
    categories: [
      {
        id: "reembolsos",
        name: "Reembolsos",
        businessTypes: [
          { id: "reembolso-laboral", name: "Reembolso laboral" },
          { id: "reembolso-medico", name: "Reembolso médico" },
          { id: "reembolso-compras", name: "Reembolso de compras" },
          { id: "gastos-corporativos-reintegrados", name: "Gastos corporativos reintegrados" },
        ],
      },
      {
        id: "devoluciones-reintegros",
        name: "Devoluciones y reintegros",
        businessTypes: [
          { id: "reintegro-bancario", name: "Reintegro bancario" },
          { id: "devoluciones-comerciales", name: "Devoluciones comerciales" },
          { id: "reversos-pagos", name: "Reversos de pagos" },
          { id: "correcciones-cobros", name: "Correcciones de cobros" },
        ],
      },
    ],
  },
  {
    id: "ingresos-ocasionales",
    name: "🎁 Ingresos ocasionales",
    icon: "🎁",
    categories: [
      {
        id: "venta-bienes-personales",
        name: "Venta de bienes personales",
        businessTypes: [
          { id: "venta-vehiculo", name: "Venta de vehículo" },
          { id: "venta-electronicos", name: "Venta de electrónicos" },
          { id: "venta-muebles", name: "Venta de muebles" },
          { id: "venta-ropa-usada", name: "Venta de ropa usada" },
          { id: "venta-herramientas", name: "Venta de herramientas" },
          { id: "venta-equipos-usados", name: "Venta de equipos usados" },
        ],
      },
      {
        id: "premios-sorteos",
        name: "Premios y sorteos",
        businessTypes: [
          { id: "loteria", name: "Lotería" },
          { id: "rifas", name: "Rifas" },
          { id: "premios-concursos", name: "Premios en concursos" },
          { id: "competencias", name: "Competencias" },
          { id: "sorteos", name: "Sorteos" },
        ],
      },
      {
        id: "regalos-aportes",
        name: "Regalos y aportes",
        businessTypes: [
          { id: "regalos-monetarios", name: "Regalos monetarios" },
          { id: "aportes-familiares", name: "Aportes familiares" },
          { id: "regalos-eventos", name: "Regalos de eventos" },
          { id: "donaciones-recibidas", name: "Donaciones recibidas" },
        ],
      },
    ],
  },
];

export function getIncomeCategoriesByMacro(macroId: string): Category[] {
  const macro = incomeMacroCategories.find((m) => m.id === macroId);
  return macro?.categories || [];
}

export function getIncomeBusinessTypesByCategory(macroId: string, categoryId: string): BusinessType[] {
  const categories = getIncomeCategoriesByMacro(macroId);
  const category = categories.find((c) => c.id === categoryId);
  return category?.businessTypes || [];
}

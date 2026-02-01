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

export const macroCategories: MacroCategory[] = [
  {
    id: "alimentos-bebidas",
    name: "🧾 Alimentos y bebidas",
    icon: "🧾",
    categories: [
      {
        id: "supermercados-abastos",
        name: "Supermercados y abastos",
        businessTypes: [
          { id: "supermercados", name: "Supermercados" },
          { id: "abastos", name: "Abastos" },
          { id: "bodegas", name: "Bodegas" },
          { id: "mercados-municipales", name: "Mercados municipales" },
          { id: "carnicerias", name: "Carnicerías" },
          { id: "charcuterias", name: "Charcuterías" },
          { id: "pescaderias", name: "Pescaderías" },
          { id: "fruterias", name: "Fruterías" },
          { id: "verdulerias", name: "Verdulerías" },
          { id: "panaderias", name: "Panaderías" },
          { id: "pastelerias", name: "Pastelerías" },
        ],
      },
      {
        id: "comida-preparada",
        name: "Comida preparada",
        businessTypes: [
          { id: "restaurantes", name: "Restaurantes" },
          { id: "comida-rapida", name: "Comida rápida" },
          { id: "areperas", name: "Areperas" },
          { id: "pizzerias", name: "Pizzerías" },
          { id: "hamburgueserias", name: "Hamburgueserías" },
          { id: "polleras-asaderos", name: "Polleras / Asaderos" },
          { id: "food-trucks", name: "Food trucks" },
          { id: "delivery-comida", name: "Delivery de comida" },
        ],
      },
      {
        id: "bebidas-cafes",
        name: "Bebidas y cafés",
        businessTypes: [
          { id: "cafeterias", name: "Cafeterías" },
          { id: "juguerias", name: "Juguerías" },
          { id: "heladerias", name: "Heladerías" },
          { id: "licorerias", name: "Licorerías" },
          { id: "bares", name: "Bares" },
          { id: "cervecerias", name: "Cervecerías" },
        ],
      },
    ],
  },
  {
    id: "vivienda-hogar",
    name: "🏠 Vivienda y hogar",
    icon: "🏠",
    categories: [
      {
        id: "vivienda",
        name: "Vivienda",
        businessTypes: [
          { id: "alquiler", name: "Alquiler" },
          { id: "condominio", name: "Condominio" },
          { id: "hipoteca", name: "Hipoteca" },
          { id: "administracion-condominio", name: "Administración de condominio" },
          { id: "mantenimiento-hogar", name: "Mantenimiento del hogar" },
        ],
      },
      {
        id: "servicios-basicos",
        name: "Servicios básicos",
        businessTypes: [
          { id: "electricidad", name: "Electricidad" },
          { id: "agua", name: "Agua" },
          { id: "gas", name: "Gas" },
          { id: "aseo-urbano", name: "Aseo urbano" },
          { id: "internet", name: "Internet" },
          { id: "telefonia-fija", name: "Telefonía fija" },
          { id: "telefonia-movil", name: "Telefonía móvil" },
          { id: "tv-cable", name: "TV por cable" },
          { id: "streaming-hogar", name: "Streaming hogar" },
        ],
      },
      {
        id: "hogar-muebles",
        name: "Hogar y muebles",
        businessTypes: [
          { id: "mueblerias", name: "Mueblerías" },
          { id: "ferreterias", name: "Ferreterías" },
          { id: "decoracion", name: "Decoración" },
          { id: "pinturas", name: "Pinturas" },
          { id: "electrodomesticos", name: "Electrodomésticos" },
          { id: "articulos-limpieza", name: "Artículos de limpieza" },
        ],
      },
    ],
  },
  {
    id: "transporte-movilidad",
    name: "🚗 Transporte y movilidad",
    icon: "🚗",
    categories: [
      {
        id: "transporte-diario",
        name: "Transporte diario",
        businessTypes: [
          { id: "transporte-publico", name: "Transporte público" },
          { id: "metro", name: "Metro" },
          { id: "autobus", name: "Autobús" },
          { id: "taxi", name: "Taxi" },
          { id: "mototaxi", name: "Mototaxi" },
          { id: "apps-transporte", name: "Apps de transporte" },
        ],
      },
      {
        id: "vehiculo-propio",
        name: "Vehículo propio",
        businessTypes: [
          { id: "gasolineras", name: "Gasolineras" },
          { id: "taller-mecanico", name: "Taller mecánico" },
          { id: "venta-repuestos", name: "Venta de repuestos" },
          { id: "venta-cauchos", name: "Venta de cauchos" },
          { id: "lavado-vehiculos", name: "Lavado de vehículos" },
          { id: "seguro-vehicular", name: "Seguro vehicular" },
          { id: "estacionamientos", name: "Estacionamientos" },
          { id: "peajes", name: "Peajes" },
        ],
      },
      {
        id: "viajes-alquiler",
        name: "Viajes y alquiler",
        businessTypes: [
          { id: "pasajes-nacionales", name: "Pasajes nacionales" },
          { id: "pasajes-internacionales", name: "Pasajes internacionales" },
          { id: "alquiler-vehiculos", name: "Alquiler de vehículos" },
        ],
      },
    ],
  },
  {
    id: "salud-bienestar",
    name: "🏥 Salud y bienestar",
    icon: "🏥",
    categories: [
      {
        id: "servicios-medicos",
        name: "Servicios médicos",
        businessTypes: [
          { id: "clinicas", name: "Clínicas" },
          { id: "hospitales", name: "Hospitales" },
          { id: "consultas-medicas", name: "Consultas médicas" },
          { id: "laboratorios", name: "Laboratorios" },
          { id: "centros-imagenes", name: "Centros de imágenes" },
          { id: "odontologia", name: "Odontología" },
          { id: "psicologia-psiquiatria", name: "Psicología / Psiquiatría" },
          { id: "oftalmologia", name: "Oftalmología" },
        ],
      },
      {
        id: "farmacias-cuidado",
        name: "Farmacias y cuidado",
        businessTypes: [
          { id: "farmacias", name: "Farmacias" },
          { id: "medicamentos", name: "Medicamentos" },
          { id: "suplementos", name: "Suplementos" },
          { id: "opticas", name: "Ópticas" },
          { id: "ortopedias", name: "Ortopedias" },
        ],
      },
      {
        id: "bienestar-fisico",
        name: "Bienestar físico",
        businessTypes: [
          { id: "gimnasios", name: "Gimnasios" },
          { id: "yoga-pilates", name: "Yoga / pilates" },
          { id: "spas", name: "Spas" },
          { id: "masajes", name: "Masajes" },
          { id: "terapias-alternativas", name: "Terapias alternativas" },
        ],
      },
    ],
  },
  {
    id: "ropa-accesorios",
    name: "👕 Ropa y accesorios",
    icon: "👕",
    categories: [
      {
        id: "vestimenta",
        name: "Vestimenta",
        businessTypes: [
          { id: "tiendas-ropa", name: "Tiendas de ropa" },
          { id: "zapaterias", name: "Zapaterías" },
          { id: "ropa-deportiva", name: "Ropa deportiva" },
          { id: "ropa-interior", name: "Ropa interior" },
          { id: "ropa-infantil", name: "Ropa infantil" },
        ],
      },
      {
        id: "accesorios-lujo",
        name: "Accesorios y lujo",
        businessTypes: [
          { id: "joyerias", name: "Joyerías" },
          { id: "relojerias", name: "Relojerías" },
          { id: "bolsos-carteras", name: "Bolsos y carteras" },
          { id: "perfumerias", name: "Perfumerías" },
        ],
      },
      {
        id: "servicios-ropa",
        name: "Servicios de ropa",
        businessTypes: [
          { id: "sastrerias", name: "Sastrerías" },
          { id: "modistas", name: "Modistas" },
          { id: "lavanderias", name: "Lavanderías" },
          { id: "tintorerias", name: "Tintorerías" },
        ],
      },
    ],
  },
  {
    id: "educacion-formacion",
    name: "📚 Educación y formación",
    icon: "📚",
    categories: [
      {
        id: "educacion-formal",
        name: "Educación formal",
        businessTypes: [
          { id: "colegios", name: "Colegios" },
          { id: "universidades", name: "Universidades" },
          { id: "institutos-tecnicos", name: "Institutos técnicos" },
          { id: "postgrados", name: "Postgrados" },
        ],
      },
      {
        id: "educacion-complementaria",
        name: "Educación complementaria",
        businessTypes: [
          { id: "cursos-online", name: "Cursos online" },
          { id: "academias-idiomas", name: "Academias de idiomas" },
          { id: "talleres", name: "Talleres" },
          { id: "certificaciones", name: "Certificaciones" },
        ],
      },
      {
        id: "material-educativo",
        name: "Material educativo",
        businessTypes: [
          { id: "librerias", name: "Librerías" },
          { id: "papelerias", name: "Papelerías" },
          { id: "utiles-escolares", name: "Útiles escolares" },
        ],
      },
    ],
  },
  {
    id: "entretenimiento-ocio",
    name: "🎮 Entretenimiento y ocio",
    icon: "🎮",
    categories: [
      {
        id: "eventos-salidas",
        name: "Eventos y salidas",
        businessTypes: [
          { id: "cines", name: "Cines" },
          { id: "teatros", name: "Teatros" },
          { id: "conciertos", name: "Conciertos" },
          { id: "eventos", name: "Eventos" },
          { id: "discotecas", name: "Discotecas" },
        ],
      },
      {
        id: "entretenimiento-digital",
        name: "Entretenimiento digital",
        businessTypes: [
          { id: "videojuegos", name: "Videojuegos" },
          { id: "streaming", name: "Streaming" },
          { id: "musica-digital", name: "Música digital" },
          { id: "suscripciones-digitales", name: "Suscripciones digitales" },
        ],
      },
      {
        id: "recreacion",
        name: "Recreación",
        businessTypes: [
          { id: "parques", name: "Parques" },
          { id: "clubes", name: "Clubes" },
          { id: "actividades-recreativas", name: "Actividades recreativas" },
          { id: "turismo-interno", name: "Turismo interno" },
        ],
      },
    ],
  },
  {
    id: "tecnologia-comunicaciones",
    name: "🧑‍💻 Tecnología y comunicaciones",
    icon: "🧑‍💻",
    categories: [
      {
        id: "tecnologia-equipos",
        name: "Tecnología y equipos",
        businessTypes: [
          { id: "tiendas-electronica", name: "Tiendas de electrónica" },
          { id: "computacion", name: "Computación" },
          { id: "tiendas-telefonos", name: "Tiendas de teléfonos" },
          { id: "accesorios-tecnologicos", name: "Accesorios tecnológicos" },
          { id: "reparacion-tecnica", name: "Reparación técnica" },
        ],
      },
      {
        id: "servicios-digitales",
        name: "Servicios digitales",
        businessTypes: [
          { id: "apps", name: "Apps" },
          { id: "software-saas", name: "Software SaaS" },
          { id: "hosting", name: "Hosting" },
          { id: "dominios-web", name: "Dominios web" },
          { id: "almacenamiento-nube", name: "Almacenamiento en la nube" },
        ],
      },
    ],
  },
  {
    id: "finanzas-obligaciones",
    name: "🏦 Finanzas y obligaciones",
    icon: "🏦",
    categories: [
      {
        id: "servicios-financieros",
        name: "Servicios financieros",
        businessTypes: [
          { id: "bancos", name: "Bancos" },
          { id: "transferencias", name: "Transferencias" },
          { id: "comisiones-bancarias", name: "Comisiones bancarias" },
          { id: "casas-cambio", name: "Casas de cambio" },
          { id: "cambio-divisas", name: "Cambio de divisas" },
          { id: "criptomonedas", name: "Criptomonedas" },
        ],
      },
      {
        id: "deudas-creditos",
        name: "Deudas y créditos",
        businessTypes: [
          { id: "tarjetas-credito", name: "Tarjetas de crédito" },
          { id: "prestamos-personales", name: "Préstamos personales" },
          { id: "prestamos-familiares", name: "Préstamos familiares" },
          { id: "microcreditos", name: "Microcréditos" },
        ],
      },
      {
        id: "pagos-legales-impuestos",
        name: "Pagos legales e impuestos",
        businessTypes: [
          { id: "impuestos-municipales", name: "Impuestos municipales" },
          { id: "multas", name: "Multas" },
          { id: "tramites-legales", name: "Trámites legales" },
        ],
      },
    ],
  },
  {
    id: "familia-dependientes",
    name: "👶 Familia y dependientes",
    icon: "👶",
    categories: [
      {
        id: "hijos",
        name: "Hijos",
        businessTypes: [
          { id: "guarderias", name: "Guarderías" },
          { id: "colegios-hijos", name: "Colegios" },
          { id: "utiles-escolares-hijos", name: "Útiles escolares" },
          { id: "actividades-extracurriculares", name: "Actividades extracurriculares" },
        ],
      },
      {
        id: "adultos-mayores",
        name: "Adultos mayores",
        businessTypes: [
          { id: "cuidados-especiales", name: "Cuidados especiales" },
          { id: "medicamentos-adultos", name: "Medicamentos" },
          { id: "atencion-medica", name: "Atención médica" },
        ],
      },
      {
        id: "mascotas",
        name: "Mascotas",
        businessTypes: [
          { id: "veterinarias", name: "Veterinarias" },
          { id: "tiendas-mascotas", name: "Tiendas de mascotas" },
          { id: "accesorios-mascotas", name: "Accesorios para mascotas" },
          { id: "peluqueria-canina", name: "Peluquería canina" },
        ],
      },
    ],
  },
  {
    id: "servicios-personales-profesionales",
    name: "🧹 Servicios personales y profesionales",
    icon: "🧹",
    categories: [
      {
        id: "servicios-profesionales",
        name: "Servicios profesionales",
        businessTypes: [
          { id: "contadores", name: "Contadores" },
          { id: "abogados", name: "Abogados" },
          { id: "notarias", name: "Notarías" },
          { id: "gestores", name: "Gestores" },
          { id: "consultores", name: "Consultores" },
        ],
      },
      {
        id: "servicios-personales",
        name: "Servicios personales",
        businessTypes: [
          { id: "peluquerias", name: "Peluquerías" },
          { id: "barberias", name: "Barberías" },
          { id: "salones-belleza", name: "Salones de belleza" },
          { id: "manicure-pedicure", name: "Manicure / pedicure" },
        ],
      },
    ],
  },
  {
    id: "construccion-remodelacion",
    name: "🏗️ Construcción y remodelación",
    icon: "🏗️",
    categories: [
      {
        id: "materiales-herramientas",
        name: "Materiales y herramientas",
        businessTypes: [
          { id: "materiales-construccion", name: "Materiales de construcción" },
          { id: "herramientas", name: "Herramientas" },
        ],
      },
      {
        id: "servicios-obra",
        name: "Servicios de obra",
        businessTypes: [
          { id: "albanileria", name: "Albañilería" },
          { id: "electricistas", name: "Electricistas" },
          { id: "plomeros", name: "Plomeros" },
          { id: "carpinteria", name: "Carpintería" },
        ],
      },
    ],
  },
  {
    id: "viajes-turismo",
    name: "✈️ Viajes y turismo",
    icon: "✈️",
    categories: [
      {
        id: "hospedaje-turismo",
        name: "Hospedaje y turismo",
        businessTypes: [
          { id: "hoteles", name: "Hoteles" },
          { id: "posadas", name: "Posadas" },
          { id: "agencias-viaje", name: "Agencias de viaje" },
          { id: "tours", name: "Tours" },
          { id: "paquetes-turisticos", name: "Paquetes turísticos" },
          { id: "excursiones", name: "Excursiones" },
        ],
      },
    ],
  },
  {
    id: "regalos-celebraciones",
    name: "🎁 Regalos y celebraciones",
    icon: "🎁",
    categories: [
      {
        id: "eventos-regalos",
        name: "Eventos y regalos",
        businessTypes: [
          { id: "tiendas-regalos", name: "Tiendas de regalos" },
          { id: "decoraciones", name: "Decoraciones" },
          { id: "floristerias", name: "Floristerías" },
          { id: "organizacion-fiestas", name: "Organización de fiestas" },
          { id: "eventos-privados", name: "Eventos privados" },
        ],
      },
    ],
  },
  {
    id: "otros-gastos",
    name: "🧾 Otros gastos controlados",
    icon: "🧾",
    categories: [
      {
        id: "varios",
        name: "Varios",
        businessTypes: [
          { id: "gastos-imprevistos", name: "Gastos imprevistos" },
          { id: "donaciones", name: "Donaciones" },
          { id: "ayudas-familiares", name: "Ayudas familiares" },
          { id: "suscripciones-no-categorizadas", name: "Suscripciones no categorizadas" },
          { id: "otros", name: "Otros" },
        ],
      },
    ],
  },
];

export function getCategoriesByMacro(macroId: string): Category[] {
  const macro = macroCategories.find((m) => m.id === macroId);
  return macro?.categories || [];
}

export function getBusinessTypesByCategory(macroId: string, categoryId: string): BusinessType[] {
  const categories = getCategoriesByMacro(macroId);
  const category = categories.find((c) => c.id === categoryId);
  return category?.businessTypes || [];
}

/* =========================================================
   Datos del juego — basados en el folleto de la carrera
   Ingeniería de Sistemas e Informática · USS
   ========================================================= */

/* Cartas: "¿Un ingeniero de sistemas puede...?"
   CARTAS_SI -> respuesta correcta SÍ (curso y ciclo de la malla)
   CARTAS_NO -> respuesta correcta NO (pero con un "¡pero sí...!") */
const CARTAS_SI = [
  { emoji: "📱", texto: "Crear una app como TikTok o Instagram", curso: "Desarrollo de Aplicaciones Móviles", ciclo: "VIII", explica: "Aprendes a crear apps para Android y iPhone." },
  { emoji: "🛡️", texto: "Proteger a un banco de los hackers", curso: "Ciberseguridad", ciclo: "IX", explica: "Aprendes a defender sistemas y datos de ataques informáticos." },
  { emoji: "🤖", texto: "Enseñarle a una inteligencia artificial a reconocer caras", curso: "Machine Learning", ciclo: "VII", explica: "Entrenas a las computadoras para que aprendan de los datos." },
  { emoji: "🌐", texto: "Crear la página web de la tienda de tu familia", curso: "Desarrollo de Aplicaciones Web", ciclo: "VI", explica: "Construyes sitios y sistemas web completos." },
  { emoji: "📊", texto: "Usar datos para predecir qué series te van a gustar", curso: "Analítica de Datos", ciclo: "VIII", explica: "Conviertes millones de datos en decisiones inteligentes." },
  { emoji: "🚀", texto: "Fundar tu propia startup tecnológica", curso: "Generación de Empresas de Base Tecnológica", ciclo: "IX", explica: "La USS te forma con visión emprendedora para crear tus propias oportunidades." },
  { emoji: "☁️", texto: "Guardar millones de fotos en la nube", curso: "Infraestructura de Redes Informáticas y Cloud", ciclo: "VI", explica: "Aprendes cómo funcionan los servidores y la nube." },
  { emoji: "🎮", texto: "Programar tu propio videojuego", curso: "Algoritmia y Programación", ciclo: "II", explica: "¡Desde el segundo ciclo ya estás programando!" },
  { emoji: "📶", texto: "Hacer que la wifi funcione en toda una empresa", curso: "Redes de Computadoras", ciclo: "V", explica: "Aprendes cómo viajan los datos por Internet y las redes." },
  { emoji: "🗄️", texto: "Organizar los datos de millones de clientes", curso: "Fundamentos de Base de Datos", ciclo: "IV", explica: "Guardas y consultas información con bases de datos y SQL." },
  { emoji: "🏅", texto: "Certificarte como programador ANTES de terminar la carrera", curso: "Certificación: Programador de Aplicaciones", ciclo: "IV", explica: "Al terminar el ciclo IV ya eres Programador de Aplicaciones certificado." },
  { emoji: "🎖️", texto: "Certificarte como Administrador de Bases de Datos mientras estudias", curso: "Certificación: Administrador de Bases de Datos Empresariales", ciclo: "VI", explica: "En el ciclo VI obtienes tu segunda certificación." },
  { emoji: "🧭", texto: "Ganar un tercer certificado en el ciclo VIII", curso: "Certificación: Diseñador de Soluciones de Sistemas de Información Empresarial", ciclo: "VIII", explica: "¡Tres certificados antes de egresar!" },
  { emoji: "🎨", texto: "Diseñar apps fáciles y bonitas de usar", curso: "Interacción Humano - Computadora", ciclo: "VII", explica: "Aprendes diseño de experiencia de usuario (UX/UI)." },
  { emoji: "🌍", texto: "Conectarte con universidades del extranjero", curso: "Conexión con el mundo", ciclo: "USS", explica: "La USS tiene convenios con universidades del extranjero." },
  { emoji: "💬", texto: "Crear un chatbot que responda preguntas", curso: "Machine Learning", ciclo: "VII", explica: "Los chatbots usan inteligencia artificial que aprende de los datos." },
  { emoji: "🛒", texto: "Crear una tienda online para vender por Internet", curso: "Desarrollo de Aplicaciones Web", ciclo: "VI", explica: "Programas el frontend y el backend de una tienda web." },
  { emoji: "📈", texto: "Hacer gráficos y dashboards para que una empresa decida mejor", curso: "Inteligencia de Negocios", ciclo: "VIII", explica: "Conviertes datos en reportes para tomar decisiones." },
  { emoji: "💻", texto: "Entender cómo funciona una computadora por dentro", curso: "Arquitectura de Computadoras", ciclo: "III", explica: "Conoces el procesador, la memoria y cómo se comunican." },
  { emoji: "🐧", texto: "Saber cómo funcionan Windows, Linux o Android", curso: "Sistemas Operativos", ciclo: "IV", explica: "Aprendes cómo un sistema operativo maneja procesos y memoria." },
  { emoji: "🧮", texto: "Usar matemáticas para resolver problemas con la computadora", curso: "Matemática Computacional", ciclo: "V", explica: "Las matemáticas + la computadora = soluciones poderosas." },
  { emoji: "📋", texto: "Dirigir al equipo que crea un software", curso: "Gerencia de Proyectos SI/TI", ciclo: "IX", explica: "Aprendes a planificar y liderar proyectos tecnológicos." },
  { emoji: "🕵️", texto: "Revisar si los sistemas de una empresa son seguros y confiables", curso: "Auditoría de Tecnologías de Información", ciclo: "X", explica: "Evalúas los riesgos y controles de los sistemas." },
  { emoji: "🗣️", texto: "Entrevistar a un cliente para saber qué app necesita", curso: "Ingeniería de Requisitos", ciclo: "VI", explica: "Antes de programar, descubres qué necesita realmente el cliente." },
  { emoji: "🏢", texto: "Trabajar en una empresa real antes de graduarte", curso: "Prácticas Preprofesionales", ciclo: "X", explica: "Aplicas todo lo aprendido en un trabajo real." },
  { emoji: "🎯", texto: "Resolver un problema real con un proyecto final", curso: "Capstone Project", ciclo: "IX", explica: "Un proyecto integrador de principio a fin." },
  { emoji: "🔬", texto: "Investigar y descubrir cosas nuevas sobre la tecnología", curso: "Investigación I, II y III", ciclo: "VIII–X", explica: "Desarrollas tu propia investigación científica." },
  { emoji: "💰", texto: "Aprender finanzas para tu propio negocio", curso: "Finanzas para Emprender", ciclo: "IV", explica: "Costos, presupuestos y cómo hacer crecer un proyecto." },
  { emoji: "⚙️", texto: "Hacer que una empresa trabaje más rápido mejorando sus procesos", curso: "Gestión de Procesos de Negocio", ciclo: "VII", explica: "Modelas y optimizas cómo trabaja una organización." },
  { emoji: "🎤", texto: "Presentar sus proyectos como un profesional", curso: "Comunicación Técnica y Profesional", ciclo: "V", explica: "Aprendes a redactar informes y a presentar con impacto." },
  { emoji: "🇬🇧", texto: "Llevar un curso de innovación en inglés", curso: "Entrepreneurship and Innovation", ciclo: "VIII", explica: "¡Emprendimiento e innovación en inglés!" },
  { emoji: "🏛️", texto: "Decidir cómo una empresa usa su tecnología", curso: "Gobierno de TI", ciclo: "X", explica: "Diriges el uso de la tecnología en una organización." },
  { emoji: "🧱", texto: "Programar usando 'objetos', como en Java", curso: "Programación Orientada a Objetos", ciclo: "IV", explica: "Clases, objetos y herencia para crear software grande." },
  { emoji: "🔁", texto: "Diseñar software usando 'recetas' que usan los profesionales", curso: "Patrones de Diseño de Software y Arquitectura", ciclo: "V", explica: "Soluciones probadas para construir software de calidad." },
  { emoji: "🧑‍💼", texto: "Prepararse para conseguir trabajo con un buen CV", curso: "Empleabilidad", ciclo: "VII", explica: "Aprendes a destacar en entrevistas de trabajo." },
  { emoji: "🧪", texto: "Practicar en laboratorios y talleres modernos", curso: "Formación integral", ciclo: "USS", explica: "Docentes de excelencia y laboratorios para pasar a la acción." },
  { emoji: "🌱", texto: "Crear tecnología que cuide el medio ambiente", curso: "Responsabilidad Social y Ambiental", ciclo: "V", explica: "Piensas en el impacto de la tecnología en la sociedad." }
];

const CARTAS_NO = [
  { emoji: "🩺", texto: "Operar a un paciente en un hospital", explica: "Eso es Medicina 😅 ¡Pero sí puedes crear el sistema que guarda las historias clínicas!" },
  { emoji: "🌉", texto: "Construir un puente de concreto", explica: "Eso es Ingeniería Civil 😅 ¡Pero sí puedes programar el software que controla la obra!" },
  { emoji: "⚖️", texto: "Defender a alguien en un juicio", explica: "Eso es Derecho 😅 ¡Pero sí puedes crear la app que organiza los casos de los abogados!" },
  { emoji: "🍰", texto: "Hornear los pasteles de una pastelería", explica: "Eso es Gastronomía 😅 ¡Pero sí puedes crear la app de delivery de la pastelería!" },
  { emoji: "🦷", texto: "Curar las caries de un paciente", explica: "Eso es Odontología 😅 ¡Pero sí puedes crear el sistema de citas del dentista!" },
  { emoji: "✈️", texto: "Pilotear un avión comercial", explica: "Eso es para pilotos 😅 ¡Pero sí puedes crear el sistema de reservas de vuelos!" },
  { emoji: "⚽", texto: "Ser árbitro en un partido de fútbol", explica: "No es su trabajo 😅 ¡Pero sí puedes crear la app de estadísticas del partido!" },
  { emoji: "🐄", texto: "Vacunar a las vacas de una granja", explica: "Eso es Veterinaria 😅 ¡Pero sí puedes crear el sistema que controla el ganado!" },
  { emoji: "💇", texto: "Cortar el cabello en una peluquería", explica: "No es su trabajo 😅 ¡Pero sí puedes crear la app para reservar turnos!" },
  { emoji: "🚗", texto: "Reparar el motor de un auto", explica: "Eso es Mecánica 😅 ¡Pero sí puedes crear el software que detecta fallas del auto!" }
];

/* Jefes: aparecen al llegar a cada umbral de puntos. Cada uno es más fuerte.
   vida: puntos de vida · dano: daño por golpe · cada: ms entre ataques [min, max]
   aviso: ms que tienes para defenderte cuando el jefe carga su ataque */
const JEFES = [
  { umbral: 40,  emoji: "🐛", nombre: "Bug Travieso", bala: "",       vida: 50,  dano: 12, cada: [1900, 2700], aviso: 1000, color: "#22c07a",
    dato: "Los bugs (errores) se vencen con buena lógica: lo aprendes en Algoritmia y Programación (ciclo II)." },
  { umbral: 100, emoji: "📧", nombre: "Spam Infinito", bala: "✉️",      vida: 70,  dano: 14, cada: [1700, 2500], aviso: 920,  color: "#4a63d8",
    dato: "Los filtros de spam usan inteligencia artificial: Machine Learning (ciclo VII)." },
  { umbral: 150, emoji: "🦠", nombre: "Virus Troyano", bala: "🦠",      vida: 90,  dano: 16, cada: [1600, 2300], aviso: 850,  color: "#9b59ff",
    dato: "Para vencer virus necesitas Ciberseguridad (ciclo IX)." },
  { umbral: 200, emoji: "🔥", nombre: "Servidor en Llamas", bala: "🔥", vida: 110, dano: 18, cada: [1500, 2100], aviso: 780,  color: "#ff8a3d",
    dato: "Mantener servidores en pie se aprende en Infraestructura de Redes Informáticas y Cloud (ciclo VI)." },
  { umbral: 250, emoji: "🕶️", nombre: "Hacker Oscuro", bala: "💾",      vida: 130, dano: 20, cada: [1400, 2000], aviso: 720,  color: "#555b7a",
    dato: "Contra los hackers: Ciberseguridad (ciclo IX) y Auditoría de TI (ciclo X)." },
  { umbral: 300, emoji: "💀", nombre: "Ransomware", bala: "🔒",         vida: 150, dano: 22, cada: [1300, 1850], aviso: 660,  color: "#ff5a5f",
    dato: "Los respaldos de datos te salvan: Base de Datos Avanzada (ciclo V)." },
  { umbral: 350, emoji: "👾", nombre: "Malware Rey", bala: "👾",        vida: 170, dano: 24, cada: [1200, 1700], aviso: 610,  color: "#e040fb",
    dato: "Gestionar servicios de TI sin caídas: Gestión de Servicios de TI (ciclo IX)." },
  { umbral: 400, emoji: "⚡", nombre: "EL GRAN APAGÓN", bala: "⚡",     vida: 210, dano: 26, cada: [1100, 1550], aviso: 560,  color: "#f5a623", final: true,
    dato: "Solo un verdadero Ingeniero de Sistemas e Informática puede volver a encender el mundo. 💡" }
];

const META = 400;

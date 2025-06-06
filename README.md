# TalentMatch - Plataforma de Reclutamiento con IA

TalentMatch es una plataforma que utiliza inteligencia artificial para emparejar candidatos con vacantes laborales de forma eficiente y precisa.

## Características Principales

1. **Emparejamiento inteligente con IA** que analiza perfiles y requisitos
2. **Dashboards personalizados** para candidatos, reclutadores y administradores
3. **Gestión completa** del proceso de reclutamiento
4. **Análisis de perfiles** con recomendaciones personalizadas
5. **Modo de demostración** para explorar la plataforma sin backend

## Tecnologías Principales

### Backend
- **Spring Boot 3.2** (Java 17)
- **MySQL 8**
- **Google Generative AI** (Gemini 1.5 Flash)
- **Firebase Storage**

### Frontend
- **Next.js 14** (React 18)
- **TypeScript**
- **Tailwind CSS**

## Modo Demo

**Disponible solo cuando el backend está inactivo**

| Correo | Contraseña | Rol |
|--------|------------|-----|
| candidato@demo.com | candidato | Candidato |
| reclutador@demo.com | reclutador | Reclutador |
| admin@demo.com | admin | Administrador |

Ideal para demostraciones y pruebas rápidas sin backend.

## Requisitos e Instalación

### Requisitos Esenciales
- Java 17, Maven 3.8
- MySQL 8
- Node.js 18, npm 9
- Cuentas de Firebase y Google Cloud

### Pasos Rápidos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/talentmatch.git
   ```

2. **Backend**
   ```bash
   cd backend
   # Configurar application.properties con credenciales
   mvn spring-boot:run
   ```
   Servidor: `http://localhost:8080/api`

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Aplicación: `http://localhost:3000`

## Estructura Principal

### Backend
- **Entity**: Modelos de datos
- **Service**: Lógica de negocio
- **Controller**: API REST
- **Security**: Autenticación JWT

### Frontend
- **app**: Páginas y rutas (dashboards, login)
- **components**: Componentes reutilizables
- **contexts**: Estado global (AuthContext)
- **services**: Comunicación con backend

## Funcionalidades IA

- **Emparejamiento**: Cálculo de compatibilidad candidato-vacante
- **Recomendaciones**: Sugerencias personalizadas
- **Análisis**: Evaluación de perfiles

## Mejoras en Integración de IA

### Mejoras en Prompts y Respuestas

Se han realizado las siguientes mejoras en la integración de IA para proporcionar respuestas más relevantes y profesionales:

1. **Estructuración de Prompts**: 
   - Se mejoró la estructura de los prompts enviados a Gemini AI utilizando secciones claras con títulos y subtítulos.
   - Se agregaron instrucciones más detalladas y específicas para cada tipo de análisis.
   - Se incluyeron más datos contextuales en cada solicitud.

2. **Formato de Respuestas**:
   - Se especificaron estructuras JSON claras y bien definidas para cada tipo de respuesta.
   - Se agregaron campos adicionales para obtener información más completa y útil.

3. **Mensajes Personalizados**:
   - Se mejoraron los mensajes predeterminados que se muestran cuando la IA no proporciona respuestas satisfactorias.
   - Se crearon mensajes contextuales basados en los porcentajes de compatibilidad y otros factores.

4. **Manejo de Errores**:
   - Se implementó un sistema más robusto para manejar errores en las respuestas de IA.
   - Se crearon respuestas de error informativas y útiles para el usuario final.

5. **Análisis de Perfil**:
   - Se reemplazaron respuestas simuladas con análisis basados en datos reales del perfil.
   - Se implementó un sistema de puntuación más preciso basado en la completitud del perfil.

6. **Generación de Contenido**:
   - Se mejoró el proceso de generación de descripciones de vacantes con prompts más detallados.
   - Se implementó un sistema de respaldo para garantizar contenido de calidad incluso cuando falla la API de IA.

Estas mejoras permiten proporcionar una experiencia más profesional y valiosa a los usuarios de TalentMatch, manteniendo el enfoque en recomendaciones y análisis personalizados para la empresa Vertex.



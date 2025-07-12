"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SkillItem } from "@/components/skill-item"
import { ExperienceItem } from "@/components/experience-item"
import { EducationItem } from "@/components/education-item"
import { CertificationItem } from "@/components/certification-item"
import { LanguageItem } from "@/components/language-item"
import { AddExperienceForm } from "@/components/add-experience-form"
import { AddEducationForm } from "@/components/add-education-form"
import { AddSkillForm } from "@/components/add-skill-form"
import { AddCertificationForm } from "@/components/add-certification-form"
import { AddLanguageForm } from "@/components/add-language-form"
import { Upload, Plus, Save, Trash2, Loader2, AlertCircle } from "lucide-react"
import { ModalForm } from "@/components/modal-form"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { candidatoService } from "@/services/candidatoService"
import { authService } from "@/services/authService"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GoogleAvatarImage } from "@/components/ui/google-avatar"
import { documentoService } from "@/services/documentoService"

// Función para limpiar nombres de archivos codificados
const limpiarNombreArchivo = (nombreArchivo: string | null): string => {
  if (!nombreArchivo) return '';
  
  // Decodificar URI
  let nombreDecodificado = '';
  try {
    nombreDecodificado = decodeURIComponent(nombreArchivo);
  } catch (error) {
    nombreDecodificado = nombreArchivo;
  }
  
  // Extraer solo el nombre del archivo sin la ruta completa
  const partesRuta = nombreDecodificado.split('/');
  let nombreFinal = partesRuta[partesRuta.length - 1];
  
  // Si el nombre contiene prefijos generados por el sistema como "candidatos_1_cv_curriculum_20250604_010316_", eliminarlos
  if (nombreFinal.includes('candidatos_') && nombreFinal.includes('curriculum_')) {
    // Extraer solo el nombre original del archivo, quitando la parte generada por el sistema
    const match = nombreFinal.match(/curriculum_\d{8}_\d{6}_(.+)/);
    if (match && match[1]) {
      nombreFinal = match[1];
    }
  }
  
  // Eliminar caracteres no deseados
  nombreFinal = nombreFinal.replace(/[%&\\/:\s*?"<>|]/g, '_');
  
  // Si el nombre sigue siendo muy largo, truncarlo
  if (nombreFinal.length > 25) {
    // Mantener la extensión del archivo
    const partes = nombreFinal.split('.');
    const extension = partes.length > 1 ? '.' + partes[partes.length - 1] : '';
    const nombreBase = partes[0];
    
    // Truncar el nombre base y añadir la extensión
    nombreFinal = nombreBase.substring(0, 22) + '...' + extension;
  }
  
  return nombreFinal;
};

export default function PerfilPage() {
  // Estados para almacenar datos del candidato y estado de carga
  const [usuario, setUsuario] = useState<any>(null);
  const [candidato, setCandidato] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analizandoCv, setAnalizandoCv] = useState(false);
  
  // Estados para campos editables
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [tituloProfesional, setTituloProfesional] = useState("");
  const [resumenPerfil, setResumenPerfil] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  
  // Estados para secciones adicionales
  const [experiencias, setExperiencias] = useState<any[]>([]);
  const [educacion, setEducacion] = useState<any[]>([]);
  const [habilidades, setHabilidades] = useState<any[]>([]);
  const [certificaciones, setCertificaciones] = useState<any[]>([]);
  const [idiomas, setIdiomas] = useState<any[]>([]);
  
  // Estados para indicar carga de cada sección
  const [cargandoExperiencias, setCargandoExperiencias] = useState(false);
  const [cargandoEducacion, setCargandoEducacion] = useState(false);
  const [cargandoHabilidades, setCargandoHabilidades] = useState(false);
  const [cargandoCertificaciones, setCargandoCertificaciones] = useState(false);
  const [cargandoIdiomas, setCargandoIdiomas] = useState(false);
  
  // Estado para mostrar todas las habilidades en la tarjeta de perfil
  const [mostrarTodasHabilidades, setMostrarTodasHabilidades] = useState(false);
  
  // Referencia al input file para el CV
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivoCv, setArchivoCv] = useState<File | null>(null);
  const [subiendoCv, setSubiendoCv] = useState(false);
  const [nombreArchivoCv, setNombreArchivoCv] = useState<string | null>(null);
  
  // Estados para mostrar formularios de agregar
  const [mostrarFormExperiencia, setMostrarFormExperiencia] = useState(false);
  const [mostrarFormEducacion, setMostrarFormEducacion] = useState(false);
  const [mostrarFormHabilidad, setMostrarFormHabilidad] = useState(false);
  const [mostrarFormCertificacion, setMostrarFormCertificacion] = useState(false);
  const [mostrarFormIdioma, setMostrarFormIdioma] = useState(false);
  
  // Calcular el porcentaje de completitud del perfil
  const calcularCompletitudPerfil = (candidato: any) => {
    if (!candidato) return 0;
    
    const camposRequeridos = [
      'nombre', 'apellido', 'email', 'telefono', 'ubicacion', 'tituloProfesional',
      'resumenPerfil', 'linkedinUrl', 'githubUrl', 'portfolioUrl'
    ];
    
    const camposCompletados = camposRequeridos.filter(campo => 
      candidato[campo] && candidato[campo].trim() !== ''
    ).length;
    
    return Math.round((camposCompletados / camposRequeridos.length) * 100);
  };
  
  // Calcular completitud
  const profileCompleteness = candidato ? calcularCompletitudPerfil(candidato) : 0;
  const camposCompletados = candidato ? Math.round(profileCompleteness * 10 / 100) : 0;
  
  const [tabActivo, setTabActivo] = useState<string>("personal");
  
  // Cargar datos del usuario y candidato al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null);
        
        // Obtener usuario actual
        const usuarioActual = authService.getUsuarioActual();
        if (!usuarioActual || usuarioActual.rol !== 'CANDIDATO') {
          setError('Solo los candidatos pueden acceder a esta página');
          setCargando(false);
          return;
        }
        
        setUsuario(usuarioActual);
        
        // Cargar perfil completo del candidato
        const datosCandidato = await candidatoService.obtenerPerfilCandidato(usuarioActual.id);
        setCandidato(datosCandidato);
        
        // Actualizar estados con datos del candidato
        setNombre(datosCandidato.nombre || '');
        setApellido(datosCandidato.apellido || '');
        setEmail(datosCandidato.email || '');
        setTelefono(datosCandidato.telefono || '');
        setUbicacion(datosCandidato.ubicacion || '');
        setPortfolioUrl(datosCandidato.portfolioUrl || '');
        setTituloProfesional(datosCandidato.tituloProfesional || '');
        setResumenPerfil(datosCandidato.resumenPerfil || '');
        setLinkedinUrl(datosCandidato.linkedinUrl || '');
        setGithubUrl(datosCandidato.githubUrl || '');
        
        // Verificar si tiene CV y extraer el nombre del archivo
        if (datosCandidato.urlCurriculum) {
          const nombreArchivoMatch = datosCandidato.urlCurriculum.match(/[^/\\&?]+\.\w{3,4}(?=([?&].*$|$))/);
          if (nombreArchivoMatch) {
            // Usar la función auxiliar para limpiar el nombre del archivo
            setNombreArchivoCv(limpiarNombreArchivo(nombreArchivoMatch[0]));
          } else {
            // Extraer solo la última parte de la URL y limpiarla
            const partes = datosCandidato.urlCurriculum.split('/');
            const ultimaParte = partes[partes.length - 1].split('?')[0];
            if (ultimaParte) {
              setNombreArchivoCv(limpiarNombreArchivo(ultimaParte));
            } else {
              setNombreArchivoCv(`CV_${datosCandidato.nombre || 'candidato'}.pdf`);
            }
          }
        }
        
        // Cargar datos adicionales
        await cargarExperienciasLaborales(usuarioActual.id);
        await cargarEducacion(usuarioActual.id);
        await cargarHabilidades(usuarioActual.id);
        await cargarCertificaciones(usuarioActual.id);
        await cargarIdiomas(usuarioActual.id);
        
        console.log('Datos del candidato cargados con éxito');
      } catch (error) {
        console.error('Error al cargar datos del candidato:', error);
        setError('No se pudieron cargar los datos del perfil');
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, []);
  
  // Cargar experiencias laborales
  const cargarExperienciasLaborales = async (candidatoId: number) => {
    try {
      setCargandoExperiencias(true);
      const experiencias = await candidatoService.obtenerExperienciaLaboral(candidatoId);
      setExperiencias(Array.isArray(experiencias) ? experiencias : []);
    } catch (error) {
      console.error('Error al cargar experiencias:', error);
      setExperiencias([]);
      toast.error('No se pudieron cargar las experiencias laborales. Por favor, intenta más tarde.');
    } finally {
      setCargandoExperiencias(false);
    }
  };
  
  // Cargar educación
  const cargarEducacion = async (candidatoId: number) => {
    try {
      setCargandoEducacion(true);
      const educacion = await candidatoService.obtenerEducacion(candidatoId);
      setEducacion(Array.isArray(educacion) ? educacion : []);
    } catch (error) {
      console.error('Error al cargar educación:', error);
      setEducacion([]);
    } finally {
      setCargandoEducacion(false);
    }
  };
  
  // Cargar habilidades
  const cargarHabilidades = async (candidatoId: number) => {
    try {
      setCargandoHabilidades(true);
      const habilidades = await candidatoService.obtenerHabilidades(candidatoId);
      setHabilidades(Array.isArray(habilidades) ? habilidades : []);
    } catch (error) {
      console.error('Error al cargar habilidades:', error);
      setHabilidades([]);
    } finally {
      setCargandoHabilidades(false);
    }
  };
  
  // Cargar certificaciones
  const cargarCertificaciones = async (candidatoId: number) => {
    try {
      setCargandoCertificaciones(true);
      const certificaciones = await candidatoService.obtenerCertificaciones(candidatoId);
      setCertificaciones(Array.isArray(certificaciones) ? certificaciones : []);
    } catch (error) {
      console.error('Error al cargar certificaciones:', error);
      setCertificaciones([]);
    } finally {
      setCargandoCertificaciones(false);
    }
  };
  
  // Cargar idiomas
  const cargarIdiomas = async (candidatoId: number) => {
    try {
      setCargandoIdiomas(true);
      const idiomas = await candidatoService.obtenerIdiomas(candidatoId);
      setIdiomas(Array.isArray(idiomas) ? idiomas : []);
    } catch (error) {
      console.error('Error al cargar idiomas:', error);
      setIdiomas([]);
    } finally {
      setCargandoIdiomas(false);
    }
  };
  
  // Función para manejar la selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Verificar tipo de archivo
      const tiposValidos = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!tiposValidos.includes(file.type)) {
        toast.error('Formato no válido. Por favor, sube un archivo PDF o DOCX.');
        return;
      }
      
      // Verificar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
        return;
      }
      
      // Si el nombre contiene caracteres especiales, sustituirlos por guiones
      const nombreLimpio = file.name.replace(/[%&\\/:\s*?"<>|]/g, '_');
      
      setArchivoCv(file);
      setNombreArchivoCv(nombreLimpio);
    }
  };
  
  // Función para abrir el selector de archivos
  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Función para eliminar el CV
  const handleEliminarCv = () => {
    setArchivoCv(null);
    setNombreArchivoCv(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Función para recargar todos los datos del perfil
  const recargarDatosPerfil = async () => {
    if (!usuario?.id) return;
    
    try {
      // Recargar datos básicos del candidato
      const candidatoActualizado = await candidatoService.obtenerPerfilCandidato(usuario.id);
      if (candidatoActualizado) {
        setCandidato(candidatoActualizado);
        setNombre(candidatoActualizado.nombre || '');
        setApellido(candidatoActualizado.apellido || '');
        setEmail(candidatoActualizado.email || '');
        setTelefono(candidatoActualizado.telefono || '');
        setUbicacion(candidatoActualizado.ubicacion || '');
        setPortfolioUrl(candidatoActualizado.portfolioUrl || '');
        setTituloProfesional(candidatoActualizado.tituloProfesional || '');
        setResumenPerfil(candidatoActualizado.resumenPerfil || '');
        setLinkedinUrl(candidatoActualizado.linkedinUrl || '');
        setGithubUrl(candidatoActualizado.githubUrl || '');
      }
      
      // Recargar experiencias
      await cargarExperienciasLaborales(usuario.id);
      
      // Recargar educación
      await cargarEducacion(usuario.id);
      
      // Recargar habilidades
      await cargarHabilidades(usuario.id);
      
      // Recargar certificaciones
      await cargarCertificaciones(usuario.id);
      
      // Recargar idiomas
      await cargarIdiomas(usuario.id);
      
      toast.success('Datos del perfil actualizados correctamente', { duration: 3000 });
    } catch (error) {
      console.error('Error al recargar datos del perfil:', error);
      toast.error('Error al recargar los datos del perfil');
    }
  };
  
  // Función para subir y analizar el currículum con IA
  const handleSubirCv = async () => {
    if (!archivoCv || !usuario?.id) {
      toast.error('Selecciona un archivo PDF o DOCX para subir.');
      return;
    }
    
    try {
      setSubiendoCv(true);
      toast.info('Iniciando procesamiento del currículum...', { duration: 3000 });
      
      // Subir como documento para que aparezca en la sección de documentos
      try {
        await documentoService.subirDocumento(
          usuario.id,
          archivoCv,
          'CURRICULUM_VITAE',
          'Currículum procesado con IA',
          true // Establecer como principal
        );
      } catch (error) {
        console.error('Error al registrar como documento:', error);
        // Continuamos con el proceso aunque falle el registro como documento
      }
      
      // Primer paso: Subir el CV (continuamos con el flujo original)
      const urlCV = await candidatoService.subirCurriculum(usuario.id, archivoCv);
      
      if (urlCV) {
        toast.success('Currículum subido correctamente. Comenzando análisis con IA...', { duration: 4000 });
        
        // Segundo paso: Analizar el CV con IA
        setAnalizandoCv(true);
        
        try {
          const analisisCv = await candidatoService.analizarCurriculumConIA(archivoCv);
          
          if (analisisCv) {
            console.log('Datos extraídos del CV:', analisisCv);
            toast.info('Análisis completado. Actualizando tu perfil...', { duration: 3000 });
            
            // Actualizar campos con datos extraídos del CV
            let datosActualizados: any = {};
            let elementosActualizados = 0;
            
            // Procesar datos personales si están disponibles
            if (analisisCv.datosPersonales) {
              const datosPersonales = analisisCv.datosPersonales;
              
              // Actualizar nombre si está disponible y el campo está vacío
              if (datosPersonales.nombre && (!nombre || nombre.trim() === '')) {
                setNombre(datosPersonales.nombre);
                datosActualizados.nombre = datosPersonales.nombre;
                elementosActualizados++;
                toast.success(`Nombre extraído: ${datosPersonales.nombre}`, { duration: 2000 });
              }
              
              // Actualizar apellido si está disponible y el campo está vacío
              if (datosPersonales.apellido && (!apellido || apellido.trim() === '')) {
                setApellido(datosPersonales.apellido);
                datosActualizados.apellido = datosPersonales.apellido;
                elementosActualizados++;
                toast.success(`Apellido extraído: ${datosPersonales.apellido}`, { duration: 2000 });
              }
              
              // Actualizar teléfono si está disponible y el campo está vacío
              if (datosPersonales.telefono && (!telefono || telefono.trim() === '')) {
                setTelefono(datosPersonales.telefono);
                datosActualizados.telefono = datosPersonales.telefono;
                elementosActualizados++;
                toast.success(`Teléfono extraído correctamente`, { duration: 2000 });
              }
              
              // Actualizar ubicación si está disponible y el campo está vacío
              if (datosPersonales.ubicacion && (!ubicacion || ubicacion.trim() === '')) {
                setUbicacion(datosPersonales.ubicacion);
                datosActualizados.ubicacion = datosPersonales.ubicacion;
                elementosActualizados++;
                toast.success(`Ubicación extraída correctamente`, { duration: 2000 });
              }
              
              // Actualizar sitio web/portfolio si está disponible y el campo está vacío
              if (datosPersonales.sitioWeb && (!portfolioUrl || portfolioUrl.trim() === '')) {
                setPortfolioUrl(datosPersonales.sitioWeb);
                datosActualizados.portfolioUrl = datosPersonales.sitioWeb;
                elementosActualizados++;
                toast.success(`Sitio web extraído correctamente`, { duration: 2000 });
              }
              
              // Actualizar LinkedIn URL si está disponible y el campo está vacío
              if (datosPersonales.linkedinUrl && (!linkedinUrl || linkedinUrl.trim() === '')) {
                setLinkedinUrl(datosPersonales.linkedinUrl);
                datosActualizados.linkedinUrl = datosPersonales.linkedinUrl;
                elementosActualizados++;
                toast.success(`URL de LinkedIn extraída correctamente`, { duration: 2000 });
              }
              
              // Actualizar GitHub URL si está disponible y el campo está vacío
              if (datosPersonales.githubUrl && (!githubUrl || githubUrl.trim() === '')) {
                setGithubUrl(datosPersonales.githubUrl);
                datosActualizados.githubUrl = datosPersonales.githubUrl;
                elementosActualizados++;
                toast.success(`URL de GitHub extraída correctamente`, { duration: 2000 });
              }
            }
            
            // Actualizar título profesional si no existe
            if (analisisCv.tituloProfesional && (!tituloProfesional || tituloProfesional.trim() === '')) {
              setTituloProfesional(analisisCv.tituloProfesional);
              datosActualizados.tituloProfesional = analisisCv.tituloProfesional;
              elementosActualizados++;
              toast.success(`Título profesional extraído: ${analisisCv.tituloProfesional}`, { duration: 3000 });
            }
            
            // Actualizar resumen del perfil si no existe
            if (analisisCv.resumenPerfil && (!resumenPerfil || resumenPerfil.trim() === '')) {
              setResumenPerfil(analisisCv.resumenPerfil);
              datosActualizados.resumenPerfil = analisisCv.resumenPerfil;
              elementosActualizados++;
              toast.success('Resumen profesional extraído correctamente', { duration: 3000 });
            }
            
            // Procesar experiencia laboral
            if (analisisCv.experienciaLaboral && Array.isArray(analisisCv.experienciaLaboral)) {
              try {
                // Obtener el año actual
                const añoActual = new Date().getFullYear();
                
                const nuevasExperiencias = analisisCv.experienciaLaboral.map((exp: any) => {
                  // Procesar fechas como strings para el backend
                  let fechaInicio = `${añoActual-1}-01-01`; // Valor predeterminado - año anterior
                  let fechaFin = `${añoActual}-12-31`; // Valor predeterminado - año actual
                  
                  // Procesar fecha de inicio - mantenerla como string en formato ISO
                  if (exp.fechaInicio) {
                    // Verificar si ya está en formato ISO
                    if (/^\d{4}-\d{2}-\d{2}$/.test(exp.fechaInicio)) {
                      fechaInicio = exp.fechaInicio;
                    } else {
                      // Intentar extraer año si está presente
                      const coincidenciasInicio = exp.fechaInicio.match(/\b(19|20)\d{2}\b/);
                      if (coincidenciasInicio && coincidenciasInicio[0]) {
                        const año = parseInt(coincidenciasInicio[0]);
                        if (año <= añoActual) {
                          fechaInicio = `${año}-01-01`; // Formatear como string ISO
                        }
                      }
                    }
                  }
                  
                  // Procesar fecha de fin - mantenerla como string en formato ISO
                  if (exp.fechaFin) {
                    // Verificar si ya está en formato ISO
                    if (/^\d{4}-\d{2}-\d{2}$/.test(exp.fechaFin)) {
                      fechaFin = exp.fechaFin;
                    } else if (exp.fechaFin.toLowerCase().includes('presente') || 
                               exp.fechaFin.toLowerCase().includes('actual') ||
                               exp.fechaFin.toLowerCase().includes('current')) {
                      // Para "presente" usar fecha actual en formato ISO
                      const hoy = new Date();
                      fechaFin = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
                    } else {
                      // Intentar extraer año
                      const coincidenciasFin = exp.fechaFin.match(/\b(19|20)\d{2}\b/);
                      if (coincidenciasFin && coincidenciasFin[0]) {
                        const año = parseInt(coincidenciasFin[0]);
                        if (año <= añoActual) {
                          fechaFin = `${año}-12-31`; // Último día del año
                        }
                      }
                    }
                  }
                  
                  console.log(`Experiencia procesada - Fechas: inicio=${fechaInicio}, fin=${fechaFin}`);
                  
                  // Asegurar que tengamos datos específicos de puesto y empresa
                  let position = 'Cargo no especificado';
                  if (exp.puesto && exp.puesto.trim() !== '') {
                    position = exp.puesto;
                  } else if (exp.cargo && exp.cargo.trim() !== '') {
                    position = exp.cargo;
                  } else if (exp.titulo && exp.titulo.trim() !== '') {
                    position = exp.titulo;
                  } else if (exp.rol && exp.rol.trim() !== '') {
                    position = exp.rol;
                  }
                  
                  let company = 'Empresa no especificada';
                  if (exp.empresa && exp.empresa.trim() !== '') {
                    company = exp.empresa;
                  } else if (exp.compania && exp.compania.trim() !== '') {
                    company = exp.compania;
                  } else if (exp.organizacion && exp.organizacion.trim() !== '') {
                    company = exp.organizacion;
                  }
                  
                  return {
                    position: position,
                    company: company,
                    location: exp.ubicacion || exp.localizacion || '',
                    startDate: fechaInicio,
                    endDate: fechaFin,
                    description: exp.descripcion || ''
                  };
                });
                
                if (nuevasExperiencias.length > 0) {
                  // Actualizar UI con las experiencias existentes más las nuevas
                  const experienciasActualizadas = [...experiencias, ...nuevasExperiencias];
                  setExperiencias(experienciasActualizadas);
                  elementosActualizados++;
                  toast.success(`${nuevasExperiencias.length} experiencias laborales extraídas`, { duration: 3000 });
                  
                  // Intentar guardar las experiencias en el backend, pero continuamos incluso si fallan
                  let experienciasGuardadas = 0;
                  
                  // Mensaje de información
                  toast.info('Guardando experiencias en el servidor...', { duration: 3000 });
                  
                  try {
                    // Guardar experiencias de una en una para minimizar errores
                    for (const experiencia of nuevasExperiencias) {
                      try {
                        // Intentamos guardar cada experiencia individualmente
                        // Esperar un pequeño tiempo entre peticiones para evitar sobrecarga
                        await new Promise(resolve => setTimeout(resolve, 500));
                        await candidatoService.agregarExperienciaLaboral(usuario.id, experiencia);
                        experienciasGuardadas++;
                      } catch (err) {
                        console.error('Error al guardar experiencia individual:', err);
                        // Continuar con la siguiente experiencia
                      }
                    }
                    
                    if (experienciasGuardadas > 0) {
                      toast.success(`${experienciasGuardadas} experiencias guardadas correctamente`, { duration: 3000 });
                    } else {
                      toast.warning('No se pudieron guardar las experiencias en el servidor. Las verás en la interfaz hasta que recargues la página.', { duration: 4000 });
                    }
                  } catch (guardarError) {
                    console.error('Error al guardar experiencias laborales:', guardarError);
                    toast.warning('No se pudieron guardar las experiencias en el servidor. Las verás en la interfaz hasta que recargues la página.', { duration: 4000 });
                  }
                }
              } catch (experienciaError) {
                console.error('Error al procesar sección de experiencia laboral:', experienciaError);
                toast.error('Error al procesar la información de experiencia laboral del CV', { duration: 3000 });
              }
            }
            
            // Procesar educación
            if (analisisCv.educacion && Array.isArray(analisisCv.educacion)) {
              try {
                const nuevaEducacion = analisisCv.educacion.map((edu: any) => {
                  // Procesar fechas
                  let fechaInicio = '';
                  let fechaFin = '';
                  
                  // Extraer año de inicio si está disponible
                  if (edu.fechaInicio) {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(edu.fechaInicio)) {
                      fechaInicio = edu.fechaInicio;
                    } else {
                      const coincidenciasInicio = edu.fechaInicio.match(/\b(19|20)\d{2}\b/);
                      if (coincidenciasInicio && coincidenciasInicio[0]) {
                        fechaInicio = `${coincidenciasInicio[0]}-01-01`;
                      }
                    }
                  }
                  
                  // Extraer año de fin si está disponible
                  if (edu.fechaFin) {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(edu.fechaFin)) {
                      fechaFin = edu.fechaFin;
                    } else if (edu.fechaFin.toLowerCase().includes('presente') ||
                               edu.fechaFin.toLowerCase().includes('actual')) {
                      const hoy = new Date();
                      fechaFin = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
                    } else {
                      const coincidenciasFin = edu.fechaFin.match(/\b(19|20)\d{2}\b/);
                      if (coincidenciasFin && coincidenciasFin[0]) {
                        fechaFin = `${coincidenciasFin[0]}-12-31`;
                      }
                    }
                  }
                  
                  // Determinamos valores para los campos requeridos
                  let degree = 'Grado no especificado';
                  if (edu.titulo && edu.titulo.trim() !== '') {
                    degree = edu.titulo;
                  } else if (edu.grado && edu.grado.trim() !== '') {
                    degree = edu.grado;
                  }
                  
                  let institution = 'Institución no especificada';
                  if (edu.institucion && edu.institucion.trim() !== '') {
                    institution = edu.institucion;
                  } else if (edu.centro && edu.centro.trim() !== '') {
                    institution = edu.centro;
                  } else if (edu.escuela && edu.escuela.trim() !== '') {
                    institution = edu.escuela;
                  }
                  
                  return {
                    degree: degree,
                    institution: institution,
                    location: edu.ubicacion || '',
                    startDate: fechaInicio,
                    endDate: fechaFin,
                    description: edu.descripcion || ''
                  };
                });
                
                if (nuevaEducacion.length > 0) {
                  // Actualizar UI con los registros existentes más los nuevos
                  const educacionActualizada = [...educacion, ...nuevaEducacion];
                  setEducacion(educacionActualizada);
                  elementosActualizados++;
                  toast.success(`${nuevaEducacion.length} registros de educación extraídos`, { duration: 3000 });
                  
                  // Intentar guardar en el backend
                  toast.info('Guardando información de educación...', { duration: 2000 });
                  let educacionGuardada = 0;
                  
                  try {
                    for (const edu of nuevaEducacion) {
                      try {
                        // Espaciar las peticiones para evitar sobrecarga
                        await new Promise(resolve => setTimeout(resolve, 400));
                        await candidatoService.agregarEducacion(usuario.id, edu);
                        educacionGuardada++;
                      } catch (err) {
                        console.error('Error al guardar educación individual:', err);
                        // Continuar con el siguiente elemento
                      }
                    }
                    
                    if (educacionGuardada > 0) {
                      toast.success(`${educacionGuardada} registros de educación guardados`, { duration: 3000 });
                    } else {
                      toast.warning('No se pudieron guardar los registros de educación en el servidor. Los verás en la interfaz hasta que recargues la página.', { duration: 4000 });
                    }
                  } catch (guardarError) {
                    console.error('Error al guardar educación:', guardarError);
                    toast.warning('No se pudieron guardar los registros de educación en el servidor. Los verás en la interfaz hasta que recargues la página.', { duration: 4000 });
                  }
                }
              } catch (educacionError) {
                console.error('Error al procesar sección de educación:', educacionError);
                toast.error('Error al procesar la información de educación del CV', { duration: 3000 });
              }
            }
            
            // Procesar habilidades técnicas
            if (analisisCv.habilidadesTecnicas && Array.isArray(analisisCv.habilidadesTecnicas)) {
              try {
                // Normalizar el formato de las habilidades
                const nuevasHabilidades = analisisCv.habilidadesTecnicas
                  .filter((hab: any) => typeof hab === 'string' ? hab.trim() !== '' : hab && hab.name)
                  .map((hab: any) => {
                    const nombreHabilidad = typeof hab === 'string' ? hab : (hab.name || hab.habilidad || '');
                    return {
                      name: nombreHabilidad.trim(),
                      level: typeof hab === 'object' && hab.level ? hab.level : 75
                    };
                  })
                  .filter((hab: {name: string, level: number}) => hab.name);

                if (nuevasHabilidades.length > 0) {
                  // Actualizar UI con las habilidades existentes más las nuevas
                  const habilidadesActualizadas = [...habilidades, ...nuevasHabilidades];
                  setHabilidades(habilidadesActualizadas);
                  elementosActualizados++;
                  toast.success(`${nuevasHabilidades.length} habilidades técnicas extraídas`, { duration: 3000 });

                  // Actualizar habilidades principales
                  const todasLasHabilidades = habilidadesActualizadas.map(h => h.name).join(',');
                  const datosActualizadosHabilidades = {
                    ...candidato,
                    habilidadesPrincipales: todasLasHabilidades
                  };

                  try {
                    const candidatoActualizado = await candidatoService.actualizarPerfilCandidato(usuario.id, datosActualizadosHabilidades);
                    if (candidatoActualizado) {
                      setCandidato(candidatoActualizado);
                      console.log('Habilidades principales actualizadas:', todasLasHabilidades);
                    }
                  } catch (errorActualizacion) {
                    console.error('Error al actualizar habilidades principales:', errorActualizacion);
                  }

                  // Intentar guardar en el backend
                  toast.info('Guardando habilidades técnicas...', { duration: 2000 });
                  let habilidadesGuardadas = 0;

                  try {
                    for (const habilidad of nuevasHabilidades) {
                      try {
                        await new Promise(resolve => setTimeout(resolve, 300));
                        const habilidadExistente = habilidades.find(h => 
                          h.name && h.name.toLowerCase() === habilidad.name.toLowerCase()
                        );
                        
                        if (habilidadExistente) {
                          console.log(`Habilidad "${habilidad.name}" ya existe, omitiendo`);
                          continue;
                        }
                        
                        await candidatoService.agregarHabilidad(usuario.id, habilidad);
                        habilidadesGuardadas++;
                      } catch (err) {
                        console.error('Error al guardar habilidad individual:', err);
                      }
                    }
                    
                    if (habilidadesGuardadas > 0) {
                      toast.success(`${habilidadesGuardadas} habilidades guardadas correctamente`, { duration: 3000 });
                    } else {
                      toast.info('No se guardaron nuevas habilidades (pueden ser duplicadas)', { duration: 4000 });
                    }
                  } catch (guardarError) {
                    console.error('Error al guardar habilidades:', guardarError);
                    toast.warning('No se pudieron guardar las habilidades en el servidor. Las verás en la interfaz hasta que recargues la página.', { duration: 4000 });
                  }
                }
              } catch (habilidadesError) {
                console.error('Error al procesar sección de habilidades:', habilidadesError);
                toast.error('Error al procesar las habilidades del CV', { duration: 3000 });
              }
            }
            
            // Procesar certificaciones si existen
            if (analisisCv.certificaciones && Array.isArray(analisisCv.certificaciones)) {
              try {
                // Procesamos las certificaciones del CV
                const nuevasCertificaciones = analisisCv.certificaciones.map((cert: any) => {
                  // Si es un string, intentamos parsearlo
                  if (typeof cert === 'string') {
                    // El formato esperado es "Nombre | Entidad | Año/Fecha"
                    const partes = cert.split('|').map(p => p.trim());
                    
                    return {
                      name: partes[0] || 'Certificación no especificada',
                      issuer: partes[1] || 'Entidad no especificada',
                      issueDate: partes[2] ? `${partes[2]}-01-01` : '',
                      expirationDate: '', // No expira por defecto
                      credentialId: '',
                      credentialUrl: ''
                    };
                  } else if (typeof cert === 'object') {
                    // Si ya es un objeto, extraemos los campos
                    return {
                      name: cert.nombre || cert.name || 'Certificación no especificada',
                      issuer: cert.entidad || cert.issuer || cert.emisor || 'Entidad no especificada',
                      issueDate: cert.fechaEmision || cert.issueDate || cert.fecha || '',
                      expirationDate: cert.fechaExpiracion || cert.expirationDate || '',
                      credentialId: cert.credentialId || cert.id || '',
                      credentialUrl: cert.credentialUrl || cert.url || ''
                    };
                  }
                  
                  // Valor por defecto si no se pudo procesar
                  return {
                    name: 'Certificación no especificada',
                    issuer: 'Entidad no especificada',
                    issueDate: '',
                    expirationDate: '',
                    credentialId: '',
                    credentialUrl: ''
                  };
                });
                
                // Guardar certificaciones
                for (const cert of nuevasCertificaciones) {
                  await candidatoService.agregarCertificacion(usuario.id, cert);
                }
                
                toast.success('Certificaciones procesadas y guardadas correctamente', { duration: 3000 });
              } catch (error) {
                console.error('Error al procesar certificaciones:', error);
                toast.error('Error al procesar certificaciones', { duration: 3000 });
              }
            }
            
            // Procesar idiomas
            if (analisisCv.idiomas && Array.isArray(analisisCv.idiomas)) {
              try {
                // Normalizar y validar idiomas
                const nuevosIdiomas = analisisCv.idiomas
                  .filter((idioma: any) => 
                    (typeof idioma === 'string' && idioma.trim() !== '') || 
                    (idioma && (idioma.nombre || idioma.idioma))
                  )
                  .map((idioma: any) => {
                    // Si es string, usarlo como nombre con nivel básico
                    if (typeof idioma === 'string') {
                      return {
                        name: idioma.trim(),
                        level: 'basic'
                      };
                    }
                    
                    // Normalizar nivel si existe
                    let nivel = idioma.nivel || 'basic';
                    
                    // Mapear niveles comunes a categorías estándar
                    const nivelNormalizado = nivel.toLowerCase();
                    if (nivelNormalizado.includes('bás') || nivelNormalizado.includes('princ') || nivelNormalizado.includes('basic')) {
                      nivel = 'basic';
                    } else if (nivelNormalizado.includes('inter') || nivelNormalizado.includes('medi')) {
                      nivel = 'intermediate';
                    } else if (nivelNormalizado.includes('avan') || nivelNormalizado.includes('adv')) {
                      nivel = 'advanced';
                    } else if (nivelNormalizado.includes('flu')) {
                      nivel = 'fluent';
                    } else if (nivelNormalizado.includes('nat') || nivelNormalizado.includes('mater')) {
                      nivel = 'native';
                    }
                    
                    return {
                      name: (idioma.nombre || idioma.idioma || idioma.name || '').trim(),
                      level: nivel
                    };
                  })
                  .filter((idioma: any) => idioma.name && idioma.name.trim() !== '');
                
                if (nuevosIdiomas.length > 0) {
                  // Actualizar UI con los idiomas existentes más los nuevos
                  const idiomasActualizados = [...idiomas, ...nuevosIdiomas];
                  setIdiomas(idiomasActualizados);
                  elementosActualizados++;
                  toast.success(`${nuevosIdiomas.length} idiomas extraídos`, { duration: 3000 });
                  
                  // Intentar guardar en el backend
                  toast.info('Guardando idiomas...', { duration: 2000 });
                  let idiomasGuardados = 0;
                  
                  try {
                    for (const idioma of nuevosIdiomas) {
                      try {
                        // Espaciar las peticiones para evitar sobrecarga
                        await new Promise(resolve => setTimeout(resolve, 300));
                        
                        // Verificar si ya existe un idioma con el mismo nombre
                        const idiomaExistente = idiomas.find(i => 
                          i.name && i.name.toLowerCase() === idioma.name.toLowerCase()
                        );
                        
                        if (idiomaExistente) {
                          console.log(`Idioma "${idioma.name}" ya existe, omitiendo`);
                          continue;
                        }
                        
                        await candidatoService.agregarIdioma(usuario.id, idioma);
                        idiomasGuardados++;
                      } catch (err) {
                        console.error('Error al guardar idioma individual:', err);
                        // Continuar con el siguiente idioma
                      }
                    }
                    
                    if (idiomasGuardados > 0) {
                      toast.success(`${idiomasGuardados} idiomas guardados correctamente`, { duration: 3000 });
                    } else {
                      toast.info('No se guardaron nuevos idiomas (pueden ser duplicados)', { duration: 4000 });
                    }
                  } catch (guardarError) {
                    console.error('Error al guardar idiomas:', guardarError);
                    toast.warning('No se pudieron guardar los idiomas en el servidor. Los verás en la interfaz hasta que recargues la página.', { duration: 4000 });
                  }
                }
              } catch (idiomasError) {
                console.error('Error al procesar sección de idiomas:', idiomasError);
                toast.error('Error al procesar los idiomas del CV', { duration: 3000 });
              }
            }
            
            // Actualizar datos básicos si se extrajeron
            if (Object.keys(datosActualizados).length > 0) {
              const resultadoActualizacion = await candidatoService.actualizarPerfilCandidato(usuario.id, datosActualizados);
              if (resultadoActualizacion) {
                toast.success('Información básica del perfil actualizada correctamente', { duration: 3000 });
              }
            }
            
            if (elementosActualizados > 0) {
              // Determinar qué pestaña mostrar basado en los datos extraídos
              let nuevaPestana = "personal";
              
              if (experiencias.length > 0) {
                nuevaPestana = "experience";
              } else if (educacion.length > 0) {
                nuevaPestana = "education";
              } else if (habilidades.length > 0) {
                nuevaPestana = "skills";
              } else if (certificaciones.length > 0) {
                nuevaPestana = "certifications";
              } else if (idiomas.length > 0) {
                nuevaPestana = "languages";
              }
              
              // Cambiar a la pestaña correspondiente
              setTabActivo(nuevaPestana);
              
              toast.success(`¡Análisis completo! Se actualizaron ${elementosActualizados} secciones de tu perfil`, {
                duration: 5000
              });
              
              // Recargar todos los datos del perfil para asegurar la sincronización con el backend
              await recargarDatosPerfil();
            } else {
              toast.info('No se detectaron datos para actualizar en tu perfil', { duration: 4000 });
            }
          } else {
            toast.warning('El análisis no devolvió datos. Verifica que tu CV contiene información relevante.', {
              duration: 4000
            });
          }
        } catch (analisisError: any) {
          console.error('Error al analizar el CV con IA:', analisisError);
          toast.error(`Error al analizar el CV: ${analisisError.message || 'Error desconocido'}`, {
            duration: 5000
          });
        }
      }
      
      // Actualizar datos del candidato
      const datosCandidato = await candidatoService.obtenerPerfilCandidato(usuario.id);
      setCandidato(datosCandidato);
      
      // Recargar todos los datos
      if (usuario.id) {
        await cargarExperienciasLaborales(usuario.id);
        await cargarEducacion(usuario.id);
        await cargarHabilidades(usuario.id);
        await cargarCertificaciones(usuario.id);
        await cargarIdiomas(usuario.id);
      }
      
      // Limpiar selección de archivo para permitir nueva subida
      setArchivoCv(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error al subir el currículum:', error);
      toast.error(`Error al subir el currículum: ${error.message || 'Error desconocido'}. Por favor, inténtalo de nuevo.`, {
        duration: 5000
      });
    } finally {
      setSubiendoCv(false);
      setAnalizandoCv(false);
    }
  };
  
  // Manejar guardado de cambios
  const guardarCambios = async () => {
    try {
      setGuardando(true);
      
      if (!usuario || !usuario.id) {
        toast.error('No se pudo identificar al usuario');
        return;
      }
      
      // Validar campos obligatorios
      if (!nombre.trim() || !apellido.trim()) {
        toast.error('El nombre y apellido son campos obligatorios');
        setGuardando(false);
        return;
      }
      
      const datosActualizados = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        ubicacion: ubicacion.trim(),
        tituloProfesional: tituloProfesional.trim(),
        resumenPerfil: resumenPerfil.trim(),
        linkedinUrl: linkedinUrl.trim(),
        githubUrl: githubUrl.trim(),
        portfolioUrl: portfolioUrl.trim()
      };
      
      console.log('Enviando datos actualizados:', datosActualizados);
      
      await candidatoService.actualizarPerfilCandidato(usuario.id, datosActualizados);
      toast.success('Perfil actualizado correctamente');
      
      // Actualizar datos del candidato
      const datosCandidato = await candidatoService.obtenerPerfilCandidato(usuario.id);
      setCandidato(datosCandidato);
    } catch (error: any) {
      console.error('Error al guardar cambios:', error);
      toast.error(`Error al guardar los cambios: ${error.message || 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };
  
  // Funciones para manejar experiencia laboral
  const agregarExperiencia = async (experiencia: any) => {
    try {
      if (!usuario) return;
      
      setCargandoExperiencias(true);
      const nuevaExperiencia = await candidatoService.agregarExperienciaLaboral(usuario.id, experiencia);
      setExperiencias(prev => [...prev, nuevaExperiencia]);
      setMostrarFormExperiencia(false);
      toast.success("Experiencia laboral agregada con éxito");
    } catch (error) {
      console.error("Error al agregar experiencia:", error);
      toast.error("No se pudo agregar la experiencia laboral");
    } finally {
      setCargandoExperiencias(false);
    }
  };
  
  const editarExperiencia = async (id: number, experiencia: any) => {
    try {
      if (!usuario) return;
      
      setCargandoExperiencias(true);
      const experienciaActualizada = await candidatoService.actualizarExperienciaLaboral(usuario.id, id, experiencia);
      setExperiencias(prev => prev.map(item => item.id === id ? experienciaActualizada : item));
      toast.success("Experiencia laboral actualizada con éxito");
    } catch (error) {
      console.error("Error al actualizar experiencia:", error);
      toast.error("No se pudo actualizar la experiencia laboral");
    } finally {
      setCargandoExperiencias(false);
    }
  };
  
  const eliminarExperiencia = async (id: number) => {
    try {
      if (!usuario) return;
      
      setCargandoExperiencias(true);
      await candidatoService.eliminarExperienciaLaboral(usuario.id, id);
      setExperiencias(prev => prev.filter(item => item.id !== id));
      toast.success("Experiencia laboral eliminada con éxito");
    } catch (error) {
      console.error("Error al eliminar experiencia:", error);
      toast.error("No se pudo eliminar la experiencia laboral");
    } finally {
      setCargandoExperiencias(false);
    }
  };
  
  // Funciones para manejar educación
  const agregarEducacion = async (educacion: any) => {
    try {
      if (!usuario) return;
      
      setCargandoEducacion(true);
      // Corregir nombre de la función
      const nuevaEducacion = await candidatoService.agregarEducacion(usuario.id, educacion);
      setEducacion(prev => [...prev, nuevaEducacion]);
      setMostrarFormEducacion(false);
      toast.success("Educación agregada con éxito");
    } catch (error) {
      console.error("Error al agregar educación:", error);
      toast.error("No se pudo agregar la educación");
    } finally {
      setCargandoEducacion(false);
    }
  };
  
  const editarEducacion = async (id: number, educacion: any) => {
    try {
      if (!usuario) return;
      
      setCargandoEducacion(true);
      const educacionActualizada = await candidatoService.actualizarEducacion(usuario.id, id, educacion);
      setEducacion(prev => prev.map(item => item.id === id ? educacionActualizada : item));
      toast.success("Educación actualizada con éxito");
    } catch (error) {
      console.error("Error al actualizar educación:", error);
      toast.error("No se pudo actualizar la educación");
    } finally {
      setCargandoEducacion(false);
    }
  };
  
  const eliminarEducacion = async (id: number) => {
    try {
      if (!usuario) return;
      
      setCargandoEducacion(true);
      await candidatoService.eliminarEducacion(usuario.id, id);
      setEducacion(prev => prev.filter(item => item.id !== id));
      toast.success("Educación eliminada con éxito");
    } catch (error) {
      console.error("Error al eliminar educación:", error);
      toast.error("No se pudo eliminar la educación");
    } finally {
      setCargandoEducacion(false);
    }
  };
  
  // Funciones para manejar habilidades
  const agregarHabilidad = async (habilidad: any) => {
    try {
      if (!usuario) return;
      
      setCargandoHabilidades(true);
      
      // Agregar propiedad destacada si es necesario
      if (habilidad.destacada === undefined) {
        habilidad.destacada = true; // Por defecto, las nuevas habilidades son destacadas
      }
      
      const nuevaHabilidad = await candidatoService.agregarHabilidad(usuario.id, habilidad);
      const habilidadesActualizadas = [...habilidades, nuevaHabilidad];
      setHabilidades(habilidadesActualizadas);
      
      setMostrarFormHabilidad(false);
      toast.success("Habilidad agregada con éxito");
    } catch (error) {
      console.error("Error al agregar habilidad:", error);
      toast.error("No se pudo agregar la habilidad");
    } finally {
      setCargandoHabilidades(false);
    }
  };
  
  const editarHabilidad = async (id: number, habilidad: any) => {
    try {
      if (!usuario) return;
      
      setCargandoHabilidades(true);
      const habilidadActualizada = await candidatoService.actualizarHabilidad(usuario.id, id, habilidad);
      const habilidadesActualizadas = habilidades.map(item => item.id === id ? habilidadActualizada : item);
      setHabilidades(habilidadesActualizadas);
      
      toast.success("Habilidad actualizada con éxito");
    } catch (error) {
      console.error("Error al actualizar habilidad:", error);
      toast.error("No se pudo actualizar la habilidad");
    } finally {
      setCargandoHabilidades(false);
    }
  };
  
  const eliminarHabilidad = async (id: number) => {
    try {
      if (!usuario) return;
      
      setCargandoHabilidades(true);
      await candidatoService.eliminarHabilidad(usuario.id, id);
      const habilidadesActualizadas = habilidades.filter(item => item.id !== id);
      setHabilidades(habilidadesActualizadas);
      
      toast.success("Habilidad eliminada con éxito");
    } catch (error) {
      console.error("Error al eliminar habilidad:", error);
      toast.error("No se pudo eliminar la habilidad");
    } finally {
      setCargandoHabilidades(false);
    }
  };
  
  // Funciones para manejar certificaciones
  const agregarCertificacion = async (certificacion: any) => {
    try {
      if (!usuario) return;
      
      setCargandoCertificaciones(true);
      // Corregir nombre de la función
      const nuevaCertificacion = await candidatoService.agregarCertificacion(usuario.id, certificacion);
      setCertificaciones(prev => [...prev, nuevaCertificacion]);
      setMostrarFormCertificacion(false);
      toast.success("Certificación agregada con éxito");
    } catch (error) {
      console.error("Error al agregar certificación:", error);
      toast.error("No se pudo agregar la certificación");
    } finally {
      setCargandoCertificaciones(false);
    }
  };
  
  const editarCertificacion = async (id: number, certificacion: any) => {
    try {
      if (!usuario) return;
      
      setCargandoCertificaciones(true);
      const certificacionActualizada = await candidatoService.actualizarCertificacion(usuario.id, id, certificacion);
      setCertificaciones(prev => prev.map(item => item.id === id ? certificacionActualizada : item));
      toast.success("Certificación actualizada con éxito");
    } catch (error) {
      console.error("Error al actualizar certificación:", error);
      toast.error("No se pudo actualizar la certificación");
    } finally {
      setCargandoCertificaciones(false);
    }
  };
  
  const eliminarCertificacion = async (id: number) => {
    try {
      if (!usuario) return;
      
      setCargandoCertificaciones(true);
      await candidatoService.eliminarCertificacion(usuario.id, id);
      setCertificaciones(prev => prev.filter(item => item.id !== id));
      toast.success("Certificación eliminada con éxito");
    } catch (error) {
      console.error("Error al eliminar certificación:", error);
      toast.error("No se pudo eliminar la certificación");
    } finally {
      setCargandoCertificaciones(false);
    }
  };
  
  // Función para agregar un idioma
  const agregarIdioma = async (idioma: any) => {
    try {
      if (!usuario) return;
      
      // Verificar si ya existe un idioma con el mismo nombre
      const existeIdioma = idiomas.some(i => 
        i.name.toLowerCase() === idioma.name.toLowerCase()
      );
      
      if (existeIdioma) {
        toast.error(`Ya existe un idioma con el nombre "${idioma.name}"`);
        return;
      }
      
      setCargandoIdiomas(true);
      const nuevoIdioma = await candidatoService.agregarIdioma(usuario.id, idioma);
      setIdiomas(prev => [...prev, nuevoIdioma]);
      setMostrarFormIdioma(false);
      toast.success("Idioma agregado con éxito");
    } catch (error) {
      console.error("Error en agregarIdioma:", error);
      toast.error("No se pudo agregar el idioma");
    } finally {
      setCargandoIdiomas(false);
    }
  };
  
  const editarIdioma = async (id: number, idioma: any) => {
    try {
      if (!usuario) return;
      
      setCargandoIdiomas(true);
      const idiomaActualizado = await candidatoService.actualizarIdioma(usuario.id, id, idioma);
      setIdiomas(prev => prev.map(item => item.id === id ? idiomaActualizado : item));
      toast.success("Idioma actualizado con éxito");
    } catch (error) {
      console.error("Error al actualizar idioma:", error);
      toast.error("No se pudo actualizar el idioma");
    } finally {
      setCargandoIdiomas(false);
    }
  };
  
  const eliminarIdioma = async (id: number) => {
    try {
      if (!usuario) return;
      
      setCargandoIdiomas(true);
      await candidatoService.eliminarIdioma(usuario.id, id);
      setIdiomas(prev => prev.filter(item => item.id !== id));
      toast.success("Idioma eliminado con éxito");
    } catch (error) {
      console.error("Error al eliminar idioma:", error);
      toast.error("No se pudo eliminar el idioma");
    } finally {
      setCargandoIdiomas(false);
    }
  };
  
  // Función para manejar el cambio de foto de perfil
  const handleFotoPerfilChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      
      // Comenzar a actualizar la foto de perfil
      toast.info('Procesando imagen...', { duration: 2000 });
      
      // Validar tipo de archivo
      const tiposValidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!tiposValidos.includes(file.type)) {
        toast.error('Formato de imagen no válido. Por favor, sube una imagen en formato JPEG, PNG, WEBP o GIF.');
        return;
      }
      
      // Validar tamaño del archivo
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande. El tamaño máximo permitido es 2MB.');
        return;
      }
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('archivo', file);
      
      // Llamar al servicio para actualizar la foto (usando el endpoint de usuarios)
      const token = authService.getToken();
      
      const respuesta = await fetch(`http://localhost:8080/api/usuarios/${usuario.id}/foto-perfil`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!respuesta.ok) {
        // Intentar obtener el mensaje de error del servidor
        let mensajeError = 'Error al actualizar foto de perfil';
        try {
          const textoError = await respuesta.text();
          if (textoError) {
            mensajeError = textoError;
          }
        } catch (error) {
          console.error('No se pudo leer el mensaje de error:', error);
        }
        
        throw new Error(mensajeError);
      }
      
      const urlFoto = await respuesta.text();
      console.log("Nueva URL de foto recibida:", urlFoto);
      
      // Asegurarse de que la URL sea válida
      const esUrlValida = urlFoto && (
        urlFoto.startsWith('http://') || 
        urlFoto.startsWith('https://') || 
        urlFoto.startsWith('data:')
      );
      
      // Si la URL no es válida, mostrar error y no actualizar
      if (!esUrlValida) {
        throw new Error('La URL de imagen recibida no es válida');
      }
      
      // Precargar la imagen para verificar que se puede cargar
      try {
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = urlFoto;
          
          // Timeout para evitar esperar indefinidamente
          setTimeout(resolve, 3000);
        });
      } catch (err) {
        console.warn('No se pudo precargar la imagen, pero continuamos con el proceso:', err);
      }
      
      // Actualizar el estado del candidato con la nueva URL de la foto
      setCandidato((prevCandidato: any) => ({
        ...prevCandidato,
        urlFoto
      }));
      
      // Actualizar también el objeto de usuario en localStorage
      const usuarioActualizado = {
        ...usuario,
        urlFoto
      };
      
      // Actualizar estado local
      setUsuario(usuarioActualizado);
      
      // Actualizar en el servicio de autenticación
      authService.actualizarUsuarioActual(usuarioActualizado);
      
      // Forzar una actualización global para que el navbar reconozca el cambio
      // Evento personalizado para que otros componentes sepan que la foto cambió
      const event = new CustomEvent('userPhotoUpdated', { 
        detail: { urlFoto } 
      });
      window.dispatchEvent(event);
      
      // Actualizar el localStorage directamente también para asegurar la propagación
      const userData = localStorage.getItem('talentmatch_user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          parsedUser.urlFoto = urlFoto;
          localStorage.setItem('talentmatch_user', JSON.stringify(parsedUser));
        } catch (err) {
          console.error('Error actualizando localStorage:', err);
        }
      }
      
      toast.success('Foto de perfil actualizada correctamente', { duration: 3000 });
      
      // Limpiar el input de archivo
      e.target.value = '';
      
      // Forzar recarga de la página para actualizar todas las instancias
      window.location.reload();
    } catch (error) {
      console.error('Error al actualizar la foto de perfil:', error);
      
      // Mensaje de error simplificado para evitar problemas de tipado
      let mensaje = 'Error al actualizar la foto de perfil';
      if (error && typeof error === 'object' && 'message' in error) {
        mensaje = typeof error.message === 'string' ? error.message : mensaje;
      }
      
      toast.error(mensaje);
      
      // Limpiar el input de archivo
      if (e.target) e.target.value = '';
    }
  };
  
  // Función para eliminar la foto de perfil
  const handleEliminarFotoPerfil = async () => {
    try {
      // Confirmación antes de eliminar
      if (!confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
        return;
      }
      
      toast.info('Eliminando foto de perfil...', { duration: 2000 });
      
      // Llamar al servicio para eliminar la foto
      const token = authService.getToken();
      
      const respuesta = await fetch(`http://localhost:8080/api/usuarios/${usuario.id}/foto-perfil`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!respuesta.ok) {
        // Intentar obtener el mensaje de error del servidor
        let mensajeError = `Error al eliminar foto de perfil: ${respuesta.status}`;
        try {
          const textoError = await respuesta.text();
          if (textoError) {
            mensajeError = textoError;
          }
        } catch (err) {
          console.error('No se pudo leer el mensaje de error:', err);
        }
        
        throw new Error(mensajeError);
      }
      
      // Obtener la URL de la foto por defecto
      const urlFotoDefault = await respuesta.text();
      console.log("URL de foto por defecto recibida:", urlFotoDefault);
      
      // Asegurarse de que la URL sea válida y accesible
      const esUrlValida = urlFotoDefault && (
        urlFotoDefault.startsWith('http://') || 
        urlFotoDefault.startsWith('https://') || 
        urlFotoDefault.startsWith('data:')
      );
      
      // Si la URL no es válida, usar una URL alternativa
      const urlFinal = esUrlValida 
        ? urlFotoDefault 
        : `https://ui-avatars.com/api/?name=${usuario.nombre?.charAt(0) || ''}${usuario.apellido?.charAt(0) || ''}&background=38bdf8&color=fff`;
      
      // Actualizar el estado del candidato con la URL de la foto por defecto
      setCandidato((prevCandidato: any) => ({
        ...prevCandidato,
        urlFoto: urlFinal
      }));
      
      // Actualizar también el objeto de usuario en localStorage
      const usuarioActualizado = {
        ...usuario,
        urlFoto: urlFinal
      };
      
      // Actualizar estado local
      setUsuario(usuarioActualizado);
      
      // Actualizar en el servicio de autenticación
      authService.actualizarUsuarioActual(usuarioActualizado);
      
      // Forzar una actualización global para que el navbar reconozca el cambio
      // Evento personalizado para que otros componentes sepan que la foto cambió
      const event = new CustomEvent('userPhotoUpdated', { 
        detail: { urlFoto: urlFinal } 
      });
      window.dispatchEvent(event);
      
      // Actualizar el localStorage directamente también para asegurar la propagación
      const userData = localStorage.getItem('talentmatch_user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          parsedUser.urlFoto = urlFinal;
          localStorage.setItem('talentmatch_user', JSON.stringify(parsedUser));
        } catch (err) {
          console.error('Error actualizando localStorage:', err);
        }
      }
      
      toast.success('Foto de perfil eliminada correctamente', { duration: 3000 });
      
      // Forzar recarga de la página para actualizar todas las instancias
      window.location.reload();
    } catch (error) {
      console.error('Error al eliminar la foto de perfil:', error);
      
      // Mensaje de error simplificado para evitar problemas de tipado
      let mensaje = 'Error al eliminar la foto de perfil';
      if (error && typeof error === 'object' && 'message' in error) {
        mensaje = typeof error.message === 'string' ? error.message : mensaje;
      }
      
      toast.error(mensaje);
    }
  };
  
  if (cargando) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8] mx-auto" />
          <p className="text-muted-foreground">Cargando datos del perfil...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg">
            <p className="font-medium">{error}</p>
            <p className="mt-2 text-sm">Vuelve a iniciar sesión o contacta al soporte técnico.</p>
          </div>
        </div>
      </div>
    );
  }

  // Actualizar la sección de experiencia laboral en el render
  const renderExperienciaLaboral = () => {
    if (cargandoExperiencias) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    return (
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-[#0a192f] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#38bdf8]">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              Experiencia laboral
            </CardTitle>
            <CardDescription>Añade tu historial laboral y experiencia profesional</CardDescription>
          </div>
          <Button 
            className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
            onClick={() => setMostrarFormExperiencia(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir experiencia
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {experiencias.length > 0 ? (
            <div className="space-y-6">
              {experiencias.map((experiencia, index) => (
                <ExperienceItem 
                  key={experiencia.id ? `experiencia-${experiencia.id}` : `experiencia-temp-${index}`}
                  experience={experiencia} 
                  onEdit={editarExperiencia}
                  onDelete={eliminarExperiencia}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay experiencias laborales registradas
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Actualizar la sección de educación en el render
  const renderEducacion = () => {
    if (cargandoEducacion) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    return (
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-[#0a192f] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#38bdf8]">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              Educación
            </CardTitle>
            <CardDescription>Añade tu formación académica</CardDescription>
          </div>
          <Button 
            className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
            onClick={() => setMostrarFormEducacion(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir educación
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {educacion.length > 0 ? (
            <div className="space-y-6">
              {educacion.map((edu, index) => (
                <EducationItem 
                  key={edu.id ? `educacion-${edu.id}` : `educacion-temp-${index}`}
                  education={edu} 
                  onEdit={editarEducacion}
                  onDelete={eliminarEducacion}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay educación registrada
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Actualizar la sección de habilidades en el render
  const renderHabilidades = () => {
    if (cargandoHabilidades) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    return (
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-[#0a192f] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#38bdf8]">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
              Habilidades técnicas
            </CardTitle>
            <CardDescription>Añade tus habilidades y nivel de competencia</CardDescription>
          </div>
          <Button 
            className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
            onClick={() => setMostrarFormHabilidad(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir habilidad
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {habilidades.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {habilidades.map((habilidad, index) => (
                <SkillItem 
                  key={habilidad.id ? `habilidad-${habilidad.id}` : `habilidad-temp-${index}`}
                  skill={habilidad} 
                  onEdit={editarHabilidad}
                  onDelete={eliminarHabilidad}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay habilidades registradas
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Actualizar la sección de certificaciones en el render
  const renderCertificaciones = () => {
    if (cargandoCertificaciones) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    return (
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-[#0a192f] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#38bdf8]">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
              Certificaciones
            </CardTitle>
            <CardDescription>Añade tus certificaciones profesionales</CardDescription>
          </div>
          <Button 
            className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
            onClick={() => setMostrarFormCertificacion(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir certificación
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {certificaciones.length > 0 ? (
            <div className="space-y-6">
              {certificaciones.map((certificacion, index) => (
                <CertificationItem 
                  key={certificacion.id ? `certificacion-${certificacion.id}` : `certificacion-temp-${index}`}
                  certification={certificacion} 
                  onEdit={editarCertificacion}
                  onDelete={eliminarCertificacion}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay certificaciones registradas
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Actualizar la sección de idiomas en el render
  const renderIdiomas = () => {
    if (cargandoIdiomas) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    return (
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-[#0a192f] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#38bdf8]">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              Idiomas
            </CardTitle>
            <CardDescription>Añade los idiomas que dominas y tu nivel</CardDescription>
          </div>
          <Button 
            className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
            onClick={() => setMostrarFormIdioma(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir idioma
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {idiomas.length > 0 ? (
            <div className="space-y-6">
              {idiomas.map((idioma, index) => (
                <LanguageItem 
                  key={idioma.id ? `idioma-${idioma.id}` : `idioma-temp-${index}`}
                  language={idioma} 
                  onEdit={editarIdioma}
                  onDelete={eliminarIdioma}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay idiomas registrados
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6 px-2 py-4 md:px-4 lg:px-5 max-w-[100%] w-full mx-auto">
      {/* Encabezado mejorado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-[#0a192f] to-[#112240] p-5 rounded-xl shadow-md">
        <div className="text-white">
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-gray-300 mt-1">
            Gestiona tu información profesional y mejora tus oportunidades de empleo
          </p>
        </div>
        <Button 
          className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0a192f] font-semibold shadow-sm"
          onClick={guardarCambios}
          disabled={guardando}
        >
          {guardando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
          <Save className="mr-2 h-4 w-4" />
          Guardar cambios
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Profile card mejorado */}
          <Card className="overflow-hidden border-none shadow-md">
            <div className="bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] h-20"></div>
            <CardContent className="pt-0 relative pb-4 px-5">
              <div className="flex flex-col items-center text-center">
                <div className="relative -mt-10 mb-3">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                    {candidato?.urlFoto ? (
                      <GoogleAvatarImage 
                        src={candidato.urlFoto} 
                        alt={`${nombre} ${apellido}`} 
                      />
                    ) : null}
                    <AvatarFallback className="text-lg bg-[#38bdf8] text-white">
                      {nombre && apellido ? `${nombre.charAt(0)}${apellido.charAt(0)}` : 'NN'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-full border-2 border-background bg-white shadow-sm hover:bg-gray-100"
                      onClick={() => document.getElementById('fotoPerfil')?.click()}
                      title="Cambiar foto de perfil"
                    >
                      <Upload className="h-3 w-3" />
                      <span className="sr-only">Cambiar foto</span>
                    </Button>
                    {candidato?.urlFoto && 
                     !candidato.urlFoto.includes("default-avatar") && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full border-2 border-background bg-white shadow-sm hover:bg-gray-100 hover:text-red-500"
                        onClick={handleEliminarFotoPerfil}
                        title="Eliminar foto de perfil"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Eliminar foto</span>
                      </Button>
                    )}
                    <input 
                      type="file" 
                      id="fotoPerfil" 
                      className="hidden" 
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFotoPerfilChange}
                    />
                  </div>
                </div>
                <h2 className="text-xl font-bold mt-1">{nombre} {apellido}</h2>
                <p className="text-[#38bdf8] font-medium">{tituloProfesional || "Sin título profesional"}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {habilidades
                    .filter(habilidad => habilidad.destacada)
                    .slice(0, mostrarTodasHabilidades ? undefined : 5)
                    .map((habilidad) => (
                    <Badge 
                      key={`habilidad-principal-${habilidad.id}-${habilidad.name}`}
                      variant="secondary" 
                      className="bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20 font-medium"
                    >
                      {habilidad.name}
                    </Badge>
                  ))}
                  {/* Mostrar indicador si hay más de 5 habilidades destacadas y no se están mostrando todas */}
                  {!mostrarTodasHabilidades && habilidades.filter(h => h.destacada).length > 5 && (
                    <Badge 
                      variant="secondary" 
                      className="bg-gray-100 text-gray-600 border-gray-200 font-medium cursor-pointer hover:bg-gray-200"
                      onClick={() => setMostrarTodasHabilidades(true)}
                    >
                      +{habilidades.filter(h => h.destacada).length - 5} más
                    </Badge>
                  )}
                  {/* Botón para mostrar menos si se están mostrando todas */}
                  {mostrarTodasHabilidades && habilidades.filter(h => h.destacada).length > 5 && (
                    <Badge 
                      variant="secondary" 
                      className="bg-gray-100 text-gray-600 border-gray-200 font-medium cursor-pointer hover:bg-gray-200"
                      onClick={() => setMostrarTodasHabilidades(false)}
                    >
                      Mostrar menos
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile completeness mejorado */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#38bdf8]">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Completitud del perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 px-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{profileCompleteness}% completo</span>
                <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">{camposCompletados}/10 campos</span>
              </div>
              <Progress value={profileCompleteness} className="mt-2 h-2 bg-gray-200" />
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  {
                    id: 'personal',
                    label: 'Información personal',
                    completed: nombre && apellido,
                    onClick: () => setTabActivo("personal")
                  },
                  {
                    id: 'experience',
                    label: 'Experiencia laboral',
                    completed: experiencias.length > 0,
                    onClick: () => setTabActivo("experience")
                  },
                  {
                    id: 'education',
                    label: 'Educación',
                    completed: educacion.length > 0,
                    onClick: () => setTabActivo("education")
                  }
                ].map((item) => (
                  <li key={`completitud-${item.id}`} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                        item.completed ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {item.completed ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        )}
                      </div>
                      {item.label}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-xs text-[#38bdf8]" 
                      onClick={item.onClick}
                    >
                      {item.completed ? "Completado" : "Completar"}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* CV Upload mejorado */}
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-[#0a192f] to-[#112240] text-white px-5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#38bdf8]">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <line x1="10" y1="9" x2="8" y2="9"></line>
                </svg>
                Curriculum Vitae
              </CardTitle>
              <CardDescription className="text-gray-300 text-sm">
                Sube tu CV (PDF/DOCX) y extrae información con IA
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 px-5">
              <div 
                className={`flex flex-col items-center justify-center space-y-1 rounded-lg border-2 ${
                  archivoCv 
                    ? 'border-green-300 bg-gradient-to-b from-green-50 to-green-100' 
                    : (candidato?.urlCurriculum 
                      ? 'border-blue-300 bg-gradient-to-b from-blue-50 to-blue-100' 
                      : 'border-dashed border-gray-300 hover:border-[#38bdf8]')
                } p-4 cursor-pointer hover:bg-slate-50/80 transition-all duration-200`}
                onClick={handleSelectFileClick}
              >
                <div className={`rounded-full p-2 ${
                  archivoCv 
                    ? 'bg-green-500 text-white' 
                    : (candidato?.urlCurriculum 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-[#38bdf8]/10 text-[#38bdf8]')
                }`}>
                  <Upload className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium mt-1">
                    {archivoCv 
                      ? 'CV seleccionado' 
                      : (candidato?.urlCurriculum 
                        ? 'CV ya subido' 
                        : 'Subir CV')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5" title={nombreArchivoCv || ''}>
                    {archivoCv 
                      ? limpiarNombreArchivo(nombreArchivoCv) 
                      : (nombreArchivoCv 
                        ? limpiarNombreArchivo(nombreArchivoCv) 
                        : 'PDF o DOCX, máx. 5MB')}
                  </p>
                </div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
              </div>
              
              {archivoCv && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-2 text-sm bg-gray-50 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-blue-500 p-1.5 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <line x1="10" y1="9" x2="8" y2="9"></line>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-[150px]">{limpiarNombreArchivo(nombreArchivoCv || '')}</p>
                        <p className="text-xs text-gray-500">
                          {archivoCv.size < 1024 * 1024 
                            ? `${(archivoCv.size / 1024).toFixed(1)} KB` 
                            : `${(archivoCv.size / (1024 * 1024)).toFixed(1)} MB`}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarCv();
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                    
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full bg-[#38bdf8] hover:bg-[#0ea5e9] text-white gap-1 text-sm h-8"
                      onClick={handleSubirCv}
                      disabled={subiendoCv || analizandoCv}
                    >
                      {subiendoCv ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Subiendo...
                        </>
                      ) : analizandoCv ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                            <path d="M9 12h.01"/>
                            <path d="M12 12h.01"/>
                            <path d="M15 12h.01"/>
                          </svg>
                          Procesar con IA
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
                
              {(nombreArchivoCv || candidato?.urlCurriculum) && !archivoCv && (
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-lg border p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-green-500 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15V6m-4-3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"></path>
                          <path d="M17 21h-5l-5-5v-5h5l5 5z"></path>
                          <path d="M11 16v-5h5"></path>
                        </svg>
                      </div>
                      <span className="font-medium truncate max-w-[150px]" title={nombreArchivoCv || 'CV ya subido'}>
                        {nombreArchivoCv ? limpiarNombreArchivo(nombreArchivoCv) : 'CV del candidato'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {candidato?.urlCurriculum && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-blue-500"
                          onClick={async () => {
                            // Usar el método del servicio para obtener URL firmada
                            if (usuario?.id) {
                              try {
                                const data = await candidatoService.obtenerUrlFirmadaCV(usuario.id);
                                if (data.url) {
                                  window.open(data.url, '_blank');
                                } else {
                                  toast.error('No se pudo obtener la URL del currículum');
                                }
                              } catch (error: any) {
                                console.error('Error al obtener URL firmada:', error);
                                toast.error('Error al acceder al currículum: ' + error.message);
                              }
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      className="flex-1 text-sm py-0 h-7"
                      onClick={handleSelectFileClick}
                    >
                      Actualizar CV
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-sm py-0 h-7 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={async () => {
                        // Usar el método del servicio para obtener URL firmada
                        if (candidato?.urlCurriculum && usuario?.id) {
                          try {
                            const data = await candidatoService.obtenerUrlFirmadaCV(usuario.id);
                            if (data.url) {
                              window.open(data.url, '_blank');
                            } else {
                              toast.error('No se pudo obtener la URL del currículum');
                            }
                          } catch (error: any) {
                            console.error('Error al obtener URL firmada:', error);
                            toast.error('Error al acceder al currículum: ' + error.message);
                          }
                        }
                      }}
                      disabled={!candidato?.urlCurriculum}
                    >
                      Ver CV
                    </Button>
                  </div>
                </div>
              )}
              
              <Alert className="mt-3 bg-blue-50 border-blue-200 py-2 px-3">
                <div className="flex gap-1.5 items-start">
                  <AlertCircle className="h-3 w-3 mt-0.5 text-blue-500" />
                  <div>
                    <AlertTitle className="text-sm text-blue-700 font-medium">IA extrae automáticamente:</AlertTitle>
                    <AlertDescription className="text-xs text-blue-600">
                      Experiencia, educación, habilidades, certificaciones e idiomas. PDF/DOCX (máx. 5MB).
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="space-y-4">
          <Tabs defaultValue="personal" value={tabActivo} onValueChange={setTabActivo} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gray-100 p-1 rounded-xl">
              <TabsTrigger 
                key="tab-personal"
                value="personal" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#0a192f] data-[state=active]:shadow-sm rounded-lg"
              >
                Personal
              </TabsTrigger>
              <TabsTrigger 
                key="tab-experience"
                value="experience" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#0a192f] data-[state=active]:shadow-sm rounded-lg"
              >
                Experiencia
              </TabsTrigger>
              <TabsTrigger 
                key="tab-education"
                value="education" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#0a192f] data-[state=active]:shadow-sm rounded-lg"
              >
                Educación
              </TabsTrigger>
              <TabsTrigger 
                key="tab-skills"
                value="skills" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#0a192f] data-[state=active]:shadow-sm rounded-lg"
              >
                Habilidades
              </TabsTrigger>
              <TabsTrigger 
                key="tab-certifications"
                value="certifications" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#0a192f] data-[state=active]:shadow-sm rounded-lg"
              >
                Certificaciones
              </TabsTrigger>
              <TabsTrigger 
                key="tab-languages"
                value="languages" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#0a192f] data-[state=active]:shadow-sm rounded-lg"
              >
                Idiomas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              {/* Contenido de la pestaña Personal */}
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle className="text-lg font-semibold text-[#0a192f] flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#38bdf8]">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Información personal
                  </CardTitle>
                  <CardDescription>Actualiza tus datos personales y de contacto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first-name" className="font-medium">Nombre</Label>
                      <Input 
                        id="first-name" 
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="border-gray-300 focus:border-[#38bdf8] focus:ring-[#38bdf8]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name" className="font-medium">Apellido</Label>
                      <Input 
                        id="last-name" 
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        className="border-gray-300 focus:border-[#38bdf8] focus:ring-[#38bdf8]/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-medium">Correo electrónico</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-medium">Teléfono</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="border-gray-300 focus:border-[#38bdf8] focus:ring-[#38bdf8]/20"
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="font-medium">Ubicación</Label>
                      <Input 
                        id="location" 
                        value={ubicacion}
                        onChange={(e) => setUbicacion(e.target.value)}
                        className="border-gray-300 focus:border-[#38bdf8] focus:ring-[#38bdf8]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="font-medium">Sitio web / Portfolio</Label>
                      <Input 
                        id="website" 
                        type="url" 
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        className="border-gray-300 focus:border-[#38bdf8] focus:ring-[#38bdf8]/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headline" className="font-medium">Título profesional</Label>
                    <Input 
                      id="headline" 
                      value={tituloProfesional}
                      onChange={(e) => setTituloProfesional(e.target.value)}
                      className="border-gray-300 focus:border-[#38bdf8] focus:ring-[#38bdf8]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="font-medium">Biografía profesional</Label>
                    <Textarea
                      id="bio"
                      rows={4}
                      value={resumenPerfil}
                      onChange={(e) => setResumenPerfil(e.target.value)}
                      className="border-gray-300 focus:border-[#38bdf8] focus:ring-[#38bdf8]/20 min-h-[120px]"
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0077b5]">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                        LinkedIn
                      </Label>
                      <Input 
                        id="linkedin" 
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="border-gray-300 focus:border-[#38bdf8] focus:ring-[#38bdf8]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github" className="font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#333]">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                        GitHub
                      </Label>
                      <Input 
                        id="github" 
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="border-gray-300 focus:border-[#38bdf8] focus:ring-[#38bdf8]/20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience" className="space-y-4">
              {/* Contenido de la pestaña Experiencia */}
              {renderExperienciaLaboral()}
            </TabsContent>

            <TabsContent value="education" className="space-y-4">
              {/* Contenido de la pestaña Educación */}
              {renderEducacion()}
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              {/* Contenido de la pestaña Habilidades */}
              {renderHabilidades()}
            </TabsContent>

            <TabsContent value="certifications" className="space-y-4">
              {/* Contenido de la pestaña Certificaciones */}
              {renderCertificaciones()}
            </TabsContent>

            <TabsContent value="languages" className="space-y-4">
              {/* Contenido de la pestaña Idiomas */}
              {renderIdiomas()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Modales para formularios */}
      <ModalForm 
        title="Añadir experiencia laboral"
        description="Completa los datos de tu experiencia profesional"
        isOpen={mostrarFormExperiencia}
        onClose={() => setMostrarFormExperiencia(false)}
      >
        <AddExperienceForm 
          onAdd={agregarExperiencia}
          onCancel={() => setMostrarFormExperiencia(false)}
        />
      </ModalForm>
      
      <ModalForm 
        title="Añadir educación"
        description="Completa los datos de tu formación académica"
        isOpen={mostrarFormEducacion}
        onClose={() => setMostrarFormEducacion(false)}
      >
        <AddEducationForm 
          onAdd={agregarEducacion}
          onCancel={() => setMostrarFormEducacion(false)}
        />
      </ModalForm>
      
      <ModalForm 
        title="Añadir habilidad técnica"
        description="Completa los datos de tu habilidad técnica"
        isOpen={mostrarFormHabilidad}
        onClose={() => setMostrarFormHabilidad(false)}
      >
        <AddSkillForm 
          onAdd={agregarHabilidad}
          onCancel={() => setMostrarFormHabilidad(false)}
        />
      </ModalForm>
      
      <ModalForm 
        title="Añadir certificación"
        description="Completa los datos de tu certificación profesional"
        isOpen={mostrarFormCertificacion}
        onClose={() => setMostrarFormCertificacion(false)}
      >
        <AddCertificationForm 
          onAdd={agregarCertificacion}
          onCancel={() => setMostrarFormCertificacion(false)}
        />
      </ModalForm>
      
      <ModalForm 
        title="Añadir idioma"
        description="Completa los datos del idioma que dominas"
        isOpen={mostrarFormIdioma}
        onClose={() => setMostrarFormIdioma(false)}
      >
        <AddLanguageForm 
          onAdd={agregarIdioma}
          onCancel={() => setMostrarFormIdioma(false)}
        />
      </ModalForm>
    </div>
  )
}

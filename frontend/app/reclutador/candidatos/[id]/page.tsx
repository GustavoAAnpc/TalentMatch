"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Mail, MapPin, Phone, Briefcase, Globe, Award, Languages, Download, FileText, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { candidatoService } from "@/services/candidatoService"
import { authService } from "@/services/authService"
import { toast } from "sonner"
import { formatearFecha } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export default function DetalleCandidatoPage() {
  const router = useRouter()
  const params = useParams()
  const candidatoId = params.id as string
  
  const [candidato, setCandidato] = useState<any>(null)
  const [experiencias, setExperiencias] = useState<any[]>([])
  const [educacion, setEducacion] = useState<any[]>([])
  const [habilidades, setHabilidades] = useState<any[]>([])
  const [certificaciones, setCertificaciones] = useState<any[]>([])
  const [idiomas, setIdiomas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar autenticación
  useEffect(() => {
    const usuario = authService.getUsuario()
    
    if (!usuario || !usuario.id) {
      router.push("/login")
      return
    }
    
    if (usuario.rol !== "RECLUTADOR" && usuario.rol !== "ADMIN") {
      router.push("/")
      return
    }
    
    cargarDatosCandidato()
  }, [router, candidatoId])
  
  // Cargar datos del candidato
  const cargarDatosCandidato = async () => {
    setCargando(true)
    setError(null)
    
    try {
      // Cargar datos básicos del candidato
      console.log(`Cargando datos básicos del candidato ID: ${candidatoId}`)
      const datosCandidato = await candidatoService.obtenerPerfilCandidato(Number(candidatoId))
      console.log('Datos básicos recibidos:', datosCandidato)
      setCandidato(datosCandidato)
      
      // Cargar experiencia laboral
      try {
        console.log(`Cargando experiencia laboral del candidato ID: ${candidatoId}`)
        const experienciaLaboral = await candidatoService.obtenerExperienciaLaboral(Number(candidatoId))
        console.log('Experiencia laboral recibida:', experienciaLaboral)
        setExperiencias(experienciaLaboral || [])
      } catch (err) {
        console.error("Error al cargar experiencia laboral:", err)
        setExperiencias([])
      }
      
      // Cargar educación
      try {
        console.log(`Cargando educación del candidato ID: ${candidatoId}`)
        const datosEducacion = await candidatoService.obtenerEducacion(Number(candidatoId))
        console.log('Educación recibida:', datosEducacion)
        setEducacion(datosEducacion || [])
      } catch (err) {
        console.error("Error al cargar educación:", err)
        setEducacion([])
      }
      
      // Cargar habilidades
      try {
        console.log(`Cargando habilidades del candidato ID: ${candidatoId}`)
        const datosHabilidades = await candidatoService.obtenerHabilidades(Number(candidatoId))
        console.log('Habilidades recibidas:', datosHabilidades)
        setHabilidades(datosHabilidades || [])
      } catch (err) {
        console.error("Error al cargar habilidades:", err)
        setHabilidades([])
      }
      
      // Cargar certificaciones
      try {
        console.log(`Cargando certificaciones del candidato ID: ${candidatoId}`)
        const datosCertificaciones = await candidatoService.obtenerCertificaciones(Number(candidatoId))
        console.log('Certificaciones recibidas:', datosCertificaciones)
        setCertificaciones(datosCertificaciones || [])
      } catch (err) {
        console.error("Error al cargar certificaciones:", err)
        setCertificaciones([])
      }
      
      // Cargar idiomas
      try {
        console.log(`Cargando idiomas del candidato ID: ${candidatoId}`)
        const datosIdiomas = await candidatoService.obtenerIdiomas(Number(candidatoId))
        console.log('Idiomas recibidos:', datosIdiomas)
        setIdiomas(datosIdiomas || [])
      } catch (err) {
        console.error("Error al cargar idiomas:", err)
        setIdiomas([])
      }
    } catch (err: any) {
      console.error("Error completo al cargar datos:", err)
      setError(err.message || "Error al cargar datos del candidato")
      toast.error("No se pudieron cargar los datos del candidato")
    } finally {
      setCargando(false)
    }
  }
  
  // Obtener iniciales para el avatar
  const obtenerIniciales = (nombre: string, apellido: string) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase()
  }
  
  // Traducir nombre de idioma al español
  const traducirNombreIdioma = (nombre: string | undefined) => {
    if (!nombre) return 'No especificado';
    
    // Convertir a minúsculas para facilitar comparación
    const nombreLower = nombre.toLowerCase();
    
    // Mapeo de idiomas en inglés a español
    const traducciones: Record<string, string> = {
      'english': 'Inglés',
      'spanish': 'Español',
      'french': 'Francés',
      'german': 'Alemán',
      'italian': 'Italiano',
      'portuguese': 'Portugués',
      'russian': 'Ruso',
      'chinese': 'Chino',
      'japanese': 'Japonés',
      'korean': 'Coreano',
      'arabic': 'Árabe',
      'dutch': 'Holandés',
      'swedish': 'Sueco',
      'finnish': 'Finlandés',
      'danish': 'Danés',
      'norwegian': 'Noruego',
      'hindi': 'Hindi',
      'bengali': 'Bengalí',
      'turkish': 'Turco',
      'thai': 'Tailandés',
      'vietnamese': 'Vietnamita'
    };
    
    // Intentar encontrar una traducción exacta
    if (traducciones[nombreLower]) {
      return traducciones[nombreLower];
    }
    
    // Si no hay coincidencia, devolver el nombre original con la primera letra en mayúscula
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  }
  
  // Traducir nivel de idioma al español
  const traducirNivelIdioma = (nivel: string | undefined) => {
    if (!nivel) return 'No especificado';
    
    // Convertir a minúsculas para facilitar comparación
    const nivelLower = nivel.toLowerCase();
    
    // Mapeo de niveles en inglés a español
    const traducciones: Record<string, string> = {
      'native': 'Nativo',
      'fluent': 'Fluido',
      'advanced': 'Avanzado',
      'intermediate': 'Intermedio',
      'basic': 'Básico',
      'beginner': 'Principiante',
      'professional': 'Profesional',
      'conversational': 'Conversacional',
      'elementary': 'Elemental',
      'c2': 'C2 - Nativo',
      'c1': 'C1 - Avanzado',
      'b2': 'B2 - Intermedio Alto',
      'b1': 'B1 - Intermedio',
      'a2': 'A2 - Básico Alto',
      'a1': 'A1 - Básico'
    };
    
    // Intentar encontrar una traducción exacta
    if (traducciones[nivelLower]) {
      return traducciones[nivelLower];
    }
    
    // Si no hay traducción exacta, comprobar coincidencias parciales
    for (const [clave, valor] of Object.entries(traducciones)) {
      if (nivelLower.includes(clave)) {
        return valor;
      }
    }
    
    // Si no hay coincidencia, devolver el nivel original
    return nivel;
  }

  // Renderizar esqueleto de carga
  if (cargando) {
    return (
      <div className="flex flex-col space-y-6 p-8 pt-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-full" />
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
                <div className="w-full space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  // Renderizar mensaje de error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <Button onClick={() => router.push("/reclutador/candidatos")}>
          Volver a la lista de candidatos
        </Button>
      </div>
    )
  }
  
  // Si no hay datos del candidato
  if (!candidato) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="text-xl mb-4">No se encontró el candidato solicitado</div>
        <Button onClick={() => router.push("/reclutador/candidatos")}>
          Volver a la lista de candidatos
        </Button>
      </div>
    )
  }
  
  // Log para verificar los datos antes de renderizar
  console.log('Renderizando datos:', {
    experiencias: experiencias.length,
    educacion: educacion.length,
    habilidades: habilidades.length,
    certificaciones: certificaciones.length,
    idiomas: idiomas.length
  });

  return (
    <div className="flex flex-col space-y-6 p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => router.push("/reclutador/candidatos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Perfil del Candidato</h2>
      </div>
      
      {/* Resumen visual rápido */}
      <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            {candidato.urlFoto ? (
              <AvatarImage src={candidato.urlFoto} alt={candidato.nombre} />
            ) : null}
            <AvatarFallback className="text-lg bg-primary/10">
              {obtenerIniciales(candidato.nombre, candidato.apellido)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{`${candidato.nombre} ${candidato.apellido || ''}`}</h3>
            <p className="text-muted-foreground text-sm">{candidato.tituloProfesional || 'Sin título profesional'}</p>
          </div>
        </div>
        
        <div className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground">Ubicación</div>
          <div className="font-medium flex items-center">
            <MapPin className="h-4 w-4 mr-1 text-primary/70" />
            {candidato.ubicacion || 'No especificada'}
          </div>
        </div>
        
        <div className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground">Experiencia</div>
          <div className="font-medium flex items-center">
            <Briefcase className="h-4 w-4 mr-1 text-primary/70" />
            {experiencias.length > 0 
              ? (candidato.experienciaAnios ? `${candidato.experienciaAnios} años` : `${experiencias.length} experiencia(s)`) 
              : 'Sin experiencia registrada'}
          </div>
        </div>
        
        <div className="flex flex-col justify-center">
          <div className="text-sm text-muted-foreground">Estado</div>
          <div className="font-medium">
            <Badge variant={candidato.estado === "ACTIVO" ? "default" : "secondary"} className="mt-1">
              {candidato.estadoProceso || candidato.estado || "No especificado"}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna izquierda - Información básica */}
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 border-4 border-primary/10">
                {candidato.urlFoto ? (
                  <AvatarImage src={candidato.urlFoto} alt={candidato.nombre} />
                ) : null}
                <AvatarFallback className="text-lg bg-primary/5">
                  {obtenerIniciales(candidato.nombre, candidato.apellido)}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center w-full">
                <h3 className="text-xl font-semibold">{`${candidato.nombre} ${candidato.apellido || ''}`}</h3>
                <p className="text-muted-foreground">{candidato.tituloProfesional || 'Sin título profesional'}</p>
              </div>
              
              <Separator />
              
              <div className="w-full space-y-3">
                {candidato.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                    <span className="truncate text-sm">{candidato.email}</span>
                  </div>
                )}
                
                {candidato.telefono && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                    <span className="text-sm">{candidato.telefono}</span>
                  </div>
                )}
                
                {candidato.ubicacion && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                    <span className="text-sm">{candidato.ubicacion}</span>
                  </div>
                )}
                
                {candidato.fechaNacimiento && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                    <span className="text-sm">{formatearFecha(candidato.fechaNacimiento)}</span>
                  </div>
                )}
                
                {candidato.experienciaAnios !== undefined && candidato.experienciaAnios !== null && (
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                    <span className="text-sm">{candidato.experienciaAnios} años de experiencia</span>
                  </div>
                )}
              </div>
              
              {(candidato.urlLinkedin || candidato.urlGithub || candidato.urlPortafolio || candidato.urlCurriculum) && (
                <>
                  <Separator />
                  
                  <div className="w-full space-y-3">
                    {candidato.urlLinkedin && (
                      <Button variant="outline" className="w-full justify-start text-sm h-8" asChild>
                        <a href={candidato.urlLinkedin} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    
                    {candidato.urlGithub && (
                      <Button variant="outline" className="w-full justify-start text-sm h-8" asChild>
                        <a href={candidato.urlGithub} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    
                    {candidato.urlPortafolio && (
                      <Button variant="outline" className="w-full justify-start text-sm h-8" asChild>
                        <a href={candidato.urlPortafolio} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          Portafolio
                        </a>
                      </Button>
                    )}
                    
                    {candidato.urlCurriculum && (
                      <Button variant="default" className="w-full justify-start text-sm h-8" asChild>
                        <a href={candidato.urlCurriculum} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3.5 w-3.5 mr-2" />
                          Descargar CV
                        </a>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Estado del candidato */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Estado del Candidato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Estado actual:</span>
                  <Badge variant={candidato.estado === "ACTIVO" ? "default" : "secondary"}>
                    {candidato.estadoProceso || candidato.estado || "No especificado"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Fecha de registro:</span>
                  <span className="text-xs">{formatearFecha(candidato.fechaCreacion)}</span>
                </div>
                
                {candidato.fechaActualizacion && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Última actualización:</span>
                    <span className="text-xs">{formatearFecha(candidato.fechaActualizacion)}</span>
                  </div>
                )}
                
                {candidato.disponibilidadInmediata !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Disponibilidad inmediata:</span>
                    <Badge variant={candidato.disponibilidadInmediata ? "outline" : "secondary"}>
                      {candidato.disponibilidadInmediata ? "Sí" : "No"}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Acciones rápidas */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              <Button className="w-full justify-start" onClick={() => router.push('/reclutador/candidatos')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver a la lista
              </Button>
              
              {candidato.urlCurriculum && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={candidato.urlCurriculum} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" /> Ver CV completo
                  </a>
                </Button>
              )}
              
              <Button variant="secondary" className="w-full justify-start" onClick={() => toast.info("Funcionalidad en desarrollo")}>
                <Mail className="h-4 w-4 mr-2" /> Enviar mensaje
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Columna derecha - Detalles profesionales */}
        <div className="md:col-span-2 space-y-6">
          {/* Resumen profesional */}
          {candidato.resumenPerfil ? (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle>Resumen Profesional</CardTitle>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm">{candidato.resumenPerfil}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle>Resumen Profesional</CardTitle>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">No hay resumen profesional registrado.</p>
              </CardContent>
            </Card>
          )}
          
          {/* Experiencia laboral */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Experiencia Laboral</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {experiencias.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-md border-muted-foreground/20">
                  <Briefcase className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">No hay experiencia laboral registrada.</p>
                </div>
              ) : (
                experiencias.map((exp: any, index: number) => (
                  <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start flex-wrap">
                      <div className="mb-1">
                        <h4 className="font-semibold text-base">{exp.puesto || exp.position || exp.title || 'Cargo no especificado'}</h4>
                        <p className="text-muted-foreground text-sm">{exp.empresa || exp.company || 'Empresa no especificada'}</p>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {formatearFecha(exp.fechaInicio || exp.startDate)} - {(exp.actual || exp.current) ? 'Presente' : formatearFecha(exp.fechaFin || exp.endDate)}
                      </div>
                    </div>
                    {(exp.descripcion || exp.description) && (
                      <p className="mt-2 text-sm whitespace-pre-line">{exp.descripcion || exp.description}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          
          {/* Educación */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Educación</CardTitle>
              <Award className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {educacion.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-md border-muted-foreground/20">
                  <Award className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">No hay educación registrada.</p>
                </div>
              ) : (
                educacion.map((edu: any, index: number) => (
                  <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start flex-wrap">
                      <div className="mb-1">
                        <h4 className="font-semibold text-base">{edu.titulo || edu.title || edu.degree || 'Título no especificado'}</h4>
                        <p className="text-muted-foreground text-sm">{edu.institucion || edu.institution || edu.school || 'Institución no especificada'}</p>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {formatearFecha(edu.fechaInicio || edu.startDate)} - {formatearFecha(edu.fechaFin || edu.endDate)}
                      </div>
                    </div>
                    {(edu.descripcion || edu.description) && (
                      <p className="mt-2 text-sm whitespace-pre-line">{edu.descripcion || edu.description}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Habilidades */}
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Habilidades</CardTitle>
                <Globe className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {habilidades.length === 0 && !candidato.habilidadesPrincipales ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-md border-muted-foreground/20">
                    <Globe className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground text-sm">No hay habilidades registradas.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {/* Mostrar habilidades de la API */}
                    {habilidades.map((hab: any, index: number) => (
                      <Badge key={`hab-${index}`} variant="secondary">
                        {hab.nombre || hab.name}
                        {(hab.nivel || hab.level) && ` (${hab.nivel || hab.level}%)`}
                      </Badge>
                    ))}
                    
                    {/* Mostrar habilidades del campo habilidadesPrincipales si no hay habilidades específicas */}
                    {habilidades.length === 0 && candidato.habilidadesPrincipales && 
                      candidato.habilidadesPrincipales.split(',').map((hab: string, index: number) => (
                        <Badge key={`habp-${index}`} variant="secondary">
                          {hab.trim()}
                        </Badge>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Certificaciones */}
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Certificaciones</CardTitle>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                {certificaciones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-md border-muted-foreground/20">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground text-sm">No hay certificaciones registradas.</p>
                  </div>
                ) : (
                  certificaciones.map((cert: any, index: number) => (
                    <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start flex-wrap">
                        <div className="mb-1">
                          <h4 className="font-semibold text-sm">{cert.nombre || cert.name || 'Certificación no especificada'}</h4>
                          <p className="text-muted-foreground text-xs">{cert.organizacion || cert.organization || cert.issuer || 'Organización no especificada'}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {cert.fechaExpedicion || cert.issueDate ? formatearFecha(cert.fechaExpedicion || cert.issueDate) : 'Fecha no especificada'}
                        </div>
                      </div>
                      {(cert.credencialId || cert.credentialId) && (
                        <p className="mt-1 text-xs">ID: {cert.credencialId || cert.credentialId}</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Idiomas */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Idiomas</CardTitle>
              <Languages className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {idiomas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-md border-muted-foreground/20">
                  <Languages className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">No hay idiomas registrados.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {idiomas.map((idioma: any, index: number) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                      {traducirNombreIdioma(idioma.nombre || idioma.name || idioma.language)} - {traducirNivelIdioma(idioma.nivel || idioma.level || idioma.proficiency) || 'Nivel no especificado'}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
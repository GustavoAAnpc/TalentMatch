"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BrainCircuit,
  Search,
  Bell,
  Briefcase,
  Edit,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  GraduationCap,
  ChevronRight,
  CircleCheck,
  AlertCircle,
  FileUp,
  MessageSquare,
  Lightbulb,
} from "lucide-react";

import { authService } from "@/services/authService";
import { candidatoService } from "@/services/candidatoService";
import { iaService } from "@/services/iaService";
import { postulacionService } from "@/services/postulacionService";
import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { notificacionService } from "@/services/notificacionService";
import { VacanteResumenResponse } from "@/types/vacante";
import { CandidatoResponse, AnalisisPerfilResponse } from "@/types/candidato";

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [candidato, setCandidato] = useState<CandidatoResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para las vacantes recomendadas
  const [vacantesRecomendadas, setVacantesRecomendadas] = useState<VacanteResumenResponse[]>([]);
  const [cargandoRecomendaciones, setCargandoRecomendaciones] = useState(false);
  
  // Estado para el análisis de perfil
  const [analisisPerfil, setAnalisisPerfil] = useState<AnalisisPerfilResponse | null>(null);
  const [cargandoAnalisis, setCargandoAnalisis] = useState(false);
  
  // Estado para el resumen de actividad
  const [resumenActividad, setResumenActividad] = useState({
    postulaciones: 0,
    pruebasTecnicas: 0,
    notificaciones: 0,
    mensajes: 0
  });
  const [cargandoResumen, setCargandoResumen] = useState(false);
  
  // Estado para controlar carga progresiva
  const [cargaProgresiva, setCargaProgresiva] = useState({
    perfilBasico: false,
    contenidoPrincipal: false
  });
  
  // Comprobar autenticación y cargar datos del usuario
  useEffect(() => {
    const obtenerUsuario = () => {
      const usuarioActual = authService.getUsuario();
      
      if (!usuarioActual || !usuarioActual.id) {
        router.push("/login");
        return;
      }
      
      setUsuario(usuarioActual);
      
      // Si el usuario no es candidato, redirigir según rol
      if (usuarioActual.rol !== "CANDIDATO") {
        if (usuarioActual.rol === "RECLUTADOR") {
          router.push("/reclutador/dashboard");
        } else if (usuarioActual.rol === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
        return;
      }
      
      return usuarioActual;
    };
    
    const usuarioActual = obtenerUsuario();
    if (usuarioActual) {
      cargarDatosCandidato(usuarioActual.id);
    }
  }, [router]);
  
  // Cargar datos del candidato
  const cargarDatosCandidato = async (candidatoId: number) => {
    try {
      setCargando(true);
      
      // Establecer un temporizador para mostrar el dashboard incluso si algunas llamadas no responden
      const tiempoMaximoCarga = setTimeout(() => {
        if (cargando) {
          setCargando(false);
          console.log('Tiempo de carga excedido - mostrando contenido disponible');
        }
      }, 5000); // 5 segundos máximo de espera
      
      try {
      // Obtener perfil del candidato
        const datosCandidato = await Promise.race([
          candidatoService.obtenerPerfilCandidato(candidatoId),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Tiempo de espera agotado')), 3000)
          )
        ]);
        
      setCandidato(datosCandidato);
        setCargaProgresiva(prev => ({...prev, perfilBasico: true}));
        console.log('Datos del candidato cargados correctamente');
        
        // Mostrar el dashboard una vez que tenemos los datos básicos
        setCargando(false);
        clearTimeout(tiempoMaximoCarga);
      } catch (errorPerfil) {
        console.error("Error al cargar perfil del candidato:", errorPerfil);
        setError("No se pudieron cargar los datos de tu perfil");
        setCargando(false);
        clearTimeout(tiempoMaximoCarga);
        return; // Salir si no se puede cargar el perfil básico
      }
      
      // Cargar recomendaciones, análisis del perfil y resumen de actividad en paralelo
      // después de mostrar la interfaz principal
      Promise.allSettled([
        cargarRecomendaciones(candidatoId),
        cargarAnalisisPerfil(candidatoId),
        cargarResumenActividad(candidatoId)
      ]).then(() => {
        setCargaProgresiva(prev => ({...prev, contenidoPrincipal: true}));
        console.log('Carga de contenido adicional completada');
      }).catch(error => {
        console.error("Error en carga paralela:", error);
      });
      
    } catch (error) {
      console.error("Error general al cargar datos del candidato:", error);
      setError("Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde.");
      setCargando(false);
    }
  };
  
  // Cargar vacantes recomendadas
  const cargarRecomendaciones = async (candidatoId: number) => {
    try {
      setCargandoRecomendaciones(true);
      
      console.log(`Intentando cargar recomendaciones para candidato ID: ${candidatoId}`);
      
      // Añadir timeout para evitar esperas indefinidas
      const recomendaciones = await Promise.race([
        iaService.recomendarVacantes(candidatoId, 4),
        new Promise<VacanteResumenResponse[]>((resolve) => 
          // Después de 4 segundos, devolver array vacío en lugar de seguir esperando
          setTimeout(() => resolve([]), 4000)
        )
      ]);
      
      if (Array.isArray(recomendaciones) && recomendaciones.length > 0) {
      setVacantesRecomendadas(recomendaciones);
        console.log(`${recomendaciones.length} vacantes recomendadas cargadas correctamente`);
      } else {
        console.warn('No se encontraron vacantes recomendadas o la respuesta no es un array');
        setVacantesRecomendadas([]);
      }
    } catch (error) {
      console.error("Error al cargar vacantes recomendadas:", error);
      setVacantesRecomendadas([]);
      // No mostrar mensajes de error para componentes no críticos
    } finally {
      setCargandoRecomendaciones(false);
    }
  };
  
  // Cargar análisis del perfil
  const cargarAnalisisPerfil = async (candidatoId: number) => {
    try {
      setCargandoAnalisis(true);
      console.log(`Intentando cargar análisis para candidato ID: ${candidatoId}`);
      
      // Añadir timeout para evitar esperas indefinidas
      const promesaAnalisis = Promise.race([
        candidatoService.solicitarAnalisisPerfil(candidatoId),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Tiempo de espera agotado')), 4000)
        )
      ]);
      
      try {
        const analisis = await promesaAnalisis;
        setAnalisisPerfil(analisis);
        console.log('Análisis de perfil cargado correctamente');
      } catch (errorAnalisis: any) {
        console.error("Error específico al cargar análisis:", errorAnalisis.message);
        
        // No establecemos error general para no bloquear toda la página
        // Simplemente creamos un análisis básico simulado
        if (errorAnalisis.message.includes('Endpoint no encontrado') || 
            errorAnalisis.message.includes('Error al solicitar análisis de perfil') ||
            errorAnalisis.message.includes('Tiempo de espera agotado')) {
          console.warn('Creando análisis básico simulado basado en datos del candidato');
          
          // Esperar que los datos del candidato estén disponibles
          if (candidato) {
            // Crear un análisis básico basado en los datos disponibles del candidato
            const analisisSimulado = {
              id: 0,
              candidatoId: candidatoId,
              perfilCompleto: false,
              puntuacion: calcularPuntuacionPerfil(candidato),
              seccionesCompletas: obtenerSeccionesCompletas(candidato),
              seccionesFaltantes: obtenerSeccionesFaltantes(candidato),
              sugerencias: ['Completa tu perfil para obtener más recomendaciones personalizadas'],
              fechaAnalisis: new Date().toISOString()
            };
            
            setAnalisisPerfil(analisisSimulado);
            console.log('Análisis simulado creado correctamente', analisisSimulado);
          }
        }
      }
    } catch (error) {
      console.error("Error general al cargar análisis del perfil:", error);
      // No mostramos toast para evitar sobrecarga de mensajes
    } finally {
      setCargandoAnalisis(false);
    }
  };
  
  // Cargar resumen de actividad
  const cargarResumenActividad = async (candidatoId: number) => {
    try {
      setCargandoResumen(true);
      console.log(`Cargando resumen de actividad para candidato ID: ${candidatoId}`);
      
      // Cargar datos en paralelo
      const [postulaciones, pruebasTecnicas, notificaciones] = await Promise.allSettled([
        postulacionService.obtenerPostulaciones(candidatoId),
        pruebaTecnicaService.obtenerPruebasPorCandidato(candidatoId),
        notificacionService.obtenerNotificacionesNoLeidas(candidatoId)
      ]);
      
      // Procesar resultados
      const resumen = {
        postulaciones: postulaciones.status === 'fulfilled' ? postulaciones.value.length : 0,
        pruebasTecnicas: pruebasTecnicas.status === 'fulfilled' ? pruebasTecnicas.value.length : 0,
        notificaciones: notificaciones.status === 'fulfilled' ? notificaciones.value.length : 0,
        mensajes: 0 // Por ahora no hay sistema de mensajes implementado
      };
      
      setResumenActividad(resumen);
      console.log('Resumen de actividad cargado:', resumen);
      
    } catch (error) {
      console.error("Error al cargar resumen de actividad:", error);
      // No mostrar error para no bloquear la interfaz
    } finally {
      setCargandoResumen(false);
    }
  };
  
  // Función auxiliar para calcular puntuación del perfil basado en datos disponibles
  const calcularPuntuacionPerfil = (candidato: any): number => {
    let puntuacion = 0;
    
    // Puntuación base
    puntuacion += 10;
    
    // Puntuación por campos completados
    if (candidato.nombre) puntuacion += 5;
    if (candidato.apellido) puntuacion += 5;
    if (candidato.telefono) puntuacion += 5;
    if (candidato.email) puntuacion += 5;
    if (candidato.tituloProfesional) puntuacion += 15;
    if (candidato.resumenPerfil) puntuacion += 15;
    if (candidato.habilidadesPrincipales) puntuacion += 15;
    if (candidato.urlCurriculum) puntuacion += 25;
    
    return Math.min(100, puntuacion);
  };
  
  // Función auxiliar para determinar secciones completadas
  const obtenerSeccionesCompletas = (candidato: any): string[] => {
    const secciones: string[] = [];
    
    if (candidato.nombre && candidato.apellido) 
      secciones.push('Datos personales');
    
    if (candidato.tituloProfesional) 
      secciones.push('Título profesional');
    
    if (candidato.resumenPerfil) 
      secciones.push('Resumen de perfil');
    
    if (candidato.habilidadesPrincipales) 
      secciones.push('Habilidades principales');
    
    if (candidato.urlCurriculum) 
      secciones.push('Currículum');
    
    return secciones;
  };
  
  // Función auxiliar para determinar secciones faltantes
  const obtenerSeccionesFaltantes = (candidato: any): string[] => {
    const secciones: string[] = [];
    
    if (!candidato.tituloProfesional) 
      secciones.push('Añade tu título profesional');
    
    if (!candidato.resumenPerfil) 
      secciones.push('Añade un resumen de tu perfil');
    
    if (!candidato.habilidadesPrincipales) 
      secciones.push('Añade tus habilidades principales');
    
    if (!candidato.urlCurriculum) 
      secciones.push('Sube tu currículum');
    
    return secciones;
  };
  
  // Subir CV
  const handleSubirCV = () => {
    router.push("/candidato/perfil");
  };
  
  // Formatear fecha
  const formatearFecha = (fechaString: string) => {
    const opciones: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return new Date(fechaString).toLocaleDateString("es-ES", opciones);
  };

  if (cargando) {
  return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full mx-auto mb-2"></div>
            <div className="h-4 bg-blue-100 rounded w-48 mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Cargando tu dashboard...</h2>
          <p className="text-muted-foreground">Estamos preparando todo para ti</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="space-y-6 px-2 py-4 md:px-4 lg:px-5 max-w-[100%] w-full mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-[#0a192f] to-[#112240] p-5 rounded-xl shadow-md">
            <div className="text-white">
              <h2 className="text-3xl font-bold tracking-tight">Bienvenido, {candidato?.nombre} 👋</h2>
              <p className="text-gray-300 mt-1">
                Descubre oportunidades laborales seleccionadas especialmente para ti
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/vacantes')} className="bg-white text-[#0a192f] hover:bg-gray-100">
                <Search className="mr-2 h-4 w-4" />
                Explorar vacantes
              </Button>
            </div>
          </div>

          {/* Dashboard Principal Mejorado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Estado del perfil */}
            <Card className="md:col-span-2 border-none shadow-md">
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-[#0a192f]">Estado de tu perfil</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/perfil")}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar perfil
                </Button>
              </div>
              <CardDescription>
                Completa tu perfil para mejorar tus posibilidades de encontrar el trabajo ideal
              </CardDescription>
            </CardHeader>
              <CardContent className="pt-4 px-5">
              <div className="space-y-4">
                  {cargandoAnalisis ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ) : analisisPerfil ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Perfil completo al {analisisPerfil.puntuacion}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {analisisPerfil.perfilCompleto ? "Completo" : "Incompleto"}
                        </div>
                      </div>
                      <Progress value={analisisPerfil.puntuacion} className="h-2" />
                        
                        {/* Secciones completadas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Secciones completadas:</h4>
                            <ul className="space-y-1">
                              {analisisPerfil.seccionesCompletas && analisisPerfil.seccionesCompletas.map((seccion, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <CircleCheck className="h-4 w-4 text-green-500" />
                                  <span>{seccion}</span>
                                </li>
                              ))}
                              {analisisPerfil.seccionesCompletas?.length === 0 && (
                                <li className="text-sm text-muted-foreground">No hay secciones completadas</li>
                              )}
                            </ul>
                          </div>
                      
                      {/* Secciones faltantes */}
                          <div>
                            <h4 className="text-sm font-medium mb-2">Por completar:</h4>
                          <ul className="space-y-1">
                              {analisisPerfil.seccionesFaltantes && analisisPerfil.seccionesFaltantes.map((seccion, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <span>{seccion}</span>
                              </li>
                            ))}
                              {analisisPerfil.seccionesFaltantes?.length === 0 && (
                                <li className="text-sm text-green-600 flex items-center gap-2">
                                  <CircleCheck className="h-4 w-4" />
                                  <span>¡Perfil completo!</span>
                                </li>
                              )}
                          </ul>
                          </div>
                        </div>
                        
                        {/* Botón para subir CV si no lo tiene */}
                        {!candidato?.urlCurriculum && (
                          <Button 
                            onClick={handleSubirCV} 
                            variant="outline" 
                            className="mt-2 gap-2"
                          >
                            <FileUp className="h-4 w-4" />
                            Subir CV
                          </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Completa tu perfil para aumentar tus posibilidades
                    </div>
                    </div>
                      <Progress value={candidato?.urlCurriculum ? 30 : 10} className="h-2" />
                      
                      {/* Mensaje genérico si no hay análisis */}
                      <div className="flex items-start text-sm text-muted-foreground mt-4 pt-3 border-t">
                        <AlertCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
                        <div>
                          <span className="font-medium">No podemos analizar tu perfil completamente.</span> Por favor, completa más información en tu perfil y sube tu CV para recibir recomendaciones más precisas.
                    </div>
                  </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Resumen de actividad - Nueva tarjeta */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                <CardTitle className="text-lg font-semibold text-[#0a192f]">Resumen de actividad</CardTitle>
                <CardDescription>
                  Tu actividad reciente en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-5">
                <div className="space-y-4">
                  {cargandoResumen ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                            <div>
                              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse mt-1"></div>
                            </div>
                          </div>
                          <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-[#38bdf8]" />
                          <div>
                            <p className="text-sm font-medium">Postulaciones</p>
                            <p className="text-xs text-muted-foreground">Procesos activos</p>
                          </div>
                        </div>
                        <Badge className="bg-[#38bdf8]">{resumenActividad.postulaciones}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-[#38bdf8]" />
                          <div>
                            <p className="text-sm font-medium">Pruebas técnicas</p>
                            <p className="text-xs text-muted-foreground">Pendientes de resolver</p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-500">{resumenActividad.pruebasTecnicas}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Bell className="h-5 w-5 text-[#38bdf8]" />
                          <div>
                            <p className="text-sm font-medium">Notificaciones</p>
                            <p className="text-xs text-muted-foreground">Sin leer</p>
                          </div>
                        </div>
                        <Badge className="bg-[#38bdf8]">{resumenActividad.notificaciones}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-[#38bdf8]" />
                          <div>
                            <p className="text-sm font-medium">Mensajes</p>
                            <p className="text-xs text-muted-foreground">No leídos</p>
                          </div>
                        </div>
                        <Badge className="bg-[#38bdf8]">{resumenActividad.mensajes}</Badge>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/dashboard/postulaciones')}>
                      Ver postulaciones
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/dashboard/pruebas')}>
                      Ver pruebas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Próximos eventos - Nueva sección */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="text-lg font-semibold text-[#0a192f] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#38bdf8]" />
                Próximos eventos
              </CardTitle>
              <CardDescription>
                Entrevistas programadas y pruebas técnicas pendientes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-5">
              <div className="space-y-4">
                {/* Entrevista programada */}
                <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="rounded-full p-2 bg-blue-100 text-blue-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <h3 className="font-medium text-[#0a192f]">Entrevista - UX/UI Designer</h3>
                      <div className="text-sm font-medium text-blue-600">15 de mayo, 10:00 AM</div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Entrevista virtual con el equipo de diseño.
                    </p>
                  </div>
                </div>
                
                {/* Prueba técnica pendiente */}
                <div className="flex items-start gap-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="rounded-full p-2 bg-yellow-100 text-yellow-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <h3 className="font-medium text-[#0a192f]">Prueba técnica - React y TypeScript</h3>
                      <div className="text-sm font-medium text-yellow-600">Vence: 12 de mayo</div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Prueba de habilidades en React, TypeScript y desarrollo de interfaces.
                    </p>
                    <div className="mt-2">
                      <Button variant="outline" size="sm" className="bg-white" onClick={() => router.push('/dashboard/pruebas/1')}>
                        Iniciar prueba
                  </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            <Tabs defaultValue="recomendaciones" className="space-y-4">
              <TabsList>
                <TabsTrigger value="recomendaciones" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Recomendadas para ti
                </TabsTrigger>
                <TabsTrigger value="postulaciones" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Mis postulaciones
                </TabsTrigger>
                <TabsTrigger value="favoritas" className="gap-2">
                  <CircleCheck className="h-4 w-4" />
                  Guardadas
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="recomendaciones">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#0a192f]">
                      <BrainCircuit className="h-5 w-5 text-[#38bdf8]" />
                      Vacantes recomendadas por IA
                    </CardTitle>
                    <CardDescription>
                      Basado en tu perfil y experiencia, estas son las mejores oportunidades para ti
                    </CardDescription>
          </CardHeader>
                <CardContent className="pt-4 px-5">
                    {cargandoRecomendaciones ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="animate-pulse space-y-3 rounded-lg border p-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/3 mt-2"></div>
                          </div>
                        ))}
                      </div>
                    ) : vacantesRecomendadas.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {vacantesRecomendadas.map((vacante) => (
                        <Card key={vacante.id} className="overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-[#0a192f]">{vacante.titulo}</h3>
                              {vacante.destacada && (
                                <CircleCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                {vacante.ubicacion && (
                                  <div className="flex items-center">
                                    <MapPin className="mr-1 h-3 w-3" />
                                    <span>{vacante.ubicacion}</span>
                    </div>
                                  )}
                                {vacante.modalidad && (
                                  <div className="flex items-center">
                                    <Clock className="mr-1 h-3 w-3" />
                                    <span>{vacante.modalidad}</span>
                    </div>
                                  )}
                    </div>
                              <p className="mt-2 text-xs line-clamp-2 text-muted-foreground">
                                {vacante.empresa || 'Empresa no especificada'}
                              </p>
                            <div className="mt-3 flex justify-between items-center">
                              <div className="flex items-center">
                                <BrainCircuit className="h-4 w-4 text-[#38bdf8] mr-1" />
                                <span className="text-xs font-medium text-[#38bdf8]">
                                  {/* El porcentaje podría venir de la API o establecerse un valor fijo */}
                                  85% compatible
                                </span>
                              </div>
                                <Link href={`/vacantes/${vacante.id}`}>
                                <Button variant="outline" size="sm" className="text-[#0a192f] border-[#0a192f] hover:bg-[#0a192f] hover:text-white">
                                    Ver detalle
                                  </Button>
                                </Link>
                  </div>
                </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aún no tenemos recomendaciones para ti</h3>
                      <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
                        Completa tu perfil y sube tu CV para que podamos recomendarte vacantes que se ajusten a tu perfil profesional
                      </p>
                      <Button 
                        onClick={() => router.push('/dashboard/perfil')} 
                        className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
                      >
                        Completar perfil
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t px-5 py-4">
                  <Button 
                    variant="link" 
                    className="ml-auto gap-1 text-[#38bdf8]"
                    onClick={() => router.push('/vacantes')}
                  >
                    Ver todas las vacantes
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
              </TabsContent>

              <TabsContent value="postulaciones">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                  <CardTitle className="text-lg font-semibold text-[#0a192f]">Mis postulaciones</CardTitle>
                      <CardDescription>Revisa el estado de tus postulaciones y pruebas técnicas</CardDescription>
              </CardHeader>
                <CardContent className="pt-4 px-5">
                      <div className="text-center py-16">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No tienes postulaciones activas</h3>
                        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                          Explora las vacantes disponibles y postula a las que mejor se ajusten a tu perfil profesional
                        </p>
                        <Button className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white" onClick={() => router.push('/vacantes')}>
                          Explorar vacantes
                          </Button>
                </div>
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="favoritas">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
                  <CardTitle className="text-lg font-semibold text-[#0a192f]">Vacantes guardadas</CardTitle>
                      <CardDescription>Las vacantes que has marcado como favoritas</CardDescription>
              </CardHeader>
                <CardContent className="pt-4 px-5">
                      <div className="text-center py-16">
                        <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No tienes vacantes guardadas</h3>
                        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                          Guarda las vacantes que te interesen para revisarlas más tarde
                        </p>
                        <Button className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white" onClick={() => router.push('/vacantes')}>
                          Explorar vacantes
                    </Button>
                </div>
              </CardContent>
            </Card>
              </TabsContent>
            </Tabs>

          {/* Consejos y recursos - Nueva sección */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="text-lg font-semibold text-[#0a192f] flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-[#38bdf8]" />
                Consejos y recursos
              </CardTitle>
              <CardDescription>
                Recursos útiles para mejorar tu perfil profesional
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-3 items-start mb-3">
                    <div className="rounded-full p-2 bg-indigo-100 text-indigo-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium text-[#0a192f]">Mejora tu CV</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Descubre cómo optimizar tu currículum para destacar tus habilidades y experiencia.
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-[#38bdf8]">Leer más</Button>
                </div>

                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-3 items-start mb-3">
                    <div className="rounded-full p-2 bg-green-100 text-green-600">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium text-[#0a192f]">Cursos recomendados</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cursos gratuitos y de pago para mejorar tus habilidades técnicas y blandas.
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-[#38bdf8]">Ver cursos</Button>
                </div>

                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-3 items-start mb-3">
                    <div className="rounded-full p-2 bg-rose-100 text-rose-600">
                      <BrainCircuit className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium text-[#0a192f]">Prepárate para entrevistas</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Consejos y técnicas para afrontar con éxito tus entrevistas de trabajo.
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-[#38bdf8]">Ver consejos</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

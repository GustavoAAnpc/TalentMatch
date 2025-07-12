"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MainNav } from "@/components/main-nav";
import { Footer } from "@/components/footer";
import { toast } from "sonner";
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  Code,
  Languages,
  Heart,
  Share2,
  ArrowLeft,
  BrainCircuit,
  ThumbsUp,
  AlertCircle,
  Sparkles,
  Lightbulb,
} from "lucide-react";

import { authService } from "@/services/authService";
import { vacanteService } from "@/services/vacanteService";
import { candidatoService } from "@/services/candidatoService";
import { iaService } from "@/services/iaService";
import { VacanteDetalleResponse } from "@/types/vacante";
import { EmparejamientoResponse } from "@/types/candidato";

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vacanteId = Number.parseInt(params.id as string);
  
  const [vacante, setVacante] = useState<VacanteDetalleResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [esFavorita, setEsFavorita] = useState(false);
  
  // Estado para matching con IA
  const [emparejamiento, setEmparejamiento] = useState<EmparejamientoResponse | null>(null);
  const [cargandoEmparejamiento, setCargandoEmparejamiento] = useState(false);
  const [errorEmparejamiento, setErrorEmparejamiento] = useState<string | null>(null);
  
  // Comprobar si el usuario está autenticado
  const [usuario, setUsuario] = useState<any>(null);
  
  // Cargar usuario al inicio
  useEffect(() => {
    const usuarioActual = authService.getUsuario();
    setUsuario(usuarioActual);
  }, []);
  
  // Cargar datos de la vacante
  useEffect(() => {
    const cargarVacante = async () => {
      try {
        setCargando(true);
        const datos = await vacanteService.obtenerVacantePorId(vacanteId);
        setVacante(datos);
        
        // Comprobar si es favorita para el usuario actual
        if (usuario?.id && usuario?.rol === "CANDIDATO") {
          try {
            console.log(`Verificando si la vacante ${vacanteId} es favorita para el candidato ${usuario.id}`);
            const favoritas = await candidatoService.obtenerVacantasFavoritas(usuario.id);
            
            if (Array.isArray(favoritas)) {
              setEsFavorita(favoritas.some((v: any) => v && v.id === vacanteId));
              console.log(`La vacante ${esFavorita ? 'es' : 'no es'} favorita`);
            } else {
              console.warn('La respuesta de vacantes favoritas no es un array:', favoritas);
              setEsFavorita(false);
            }
          } catch (errorFavoritas) {
            console.error("Error al comprobar si la vacante es favorita:", errorFavoritas);
            // No propagamos el error para que no afecte la carga de la vacante
            setEsFavorita(false);
          }
        }
      } catch (error) {
        console.error("Error al cargar la vacante:", error);
        setError("No se pudo cargar la información de la vacante");
      } finally {
        setCargando(false);
      }
    };
    
    if (vacanteId) {
      cargarVacante();
    }
  }, [vacanteId, usuario]);
  
  // Calcular emparejamiento si el usuario es un candidato
  useEffect(() => {
    const calcularEmparejamiento = async () => {
      if (!usuario?.id || usuario?.rol !== "CANDIDATO") return;
      
      try {
        setCargandoEmparejamiento(true);
        const datos = await iaService.calcularEmparejamiento(usuario.id, vacanteId);
        setEmparejamiento(datos);
      } catch (error) {
        console.error("Error al calcular emparejamiento:", error);
        setErrorEmparejamiento("No se pudo calcular la compatibilidad con esta vacante");
      } finally {
        setCargandoEmparejamiento(false);
      }
    };
    
    if (vacanteId && usuario?.id && usuario?.rol === "CANDIDATO") {
      calcularEmparejamiento();
    }
  }, [vacanteId, usuario]);
  
  // Función para manejar favoritos
  const toggleFavorito = async () => {
    if (!usuario?.id) {
      toast.error("Debes iniciar sesión para agregar vacantes a favoritos");
      router.push("/login");
      return;
    }
    
    if (usuario?.rol !== "CANDIDATO") {
      toast.error("Solo los candidatos pueden agregar vacantes a favoritos");
      return;
    }
    
    try {
      if (esFavorita) {
        await candidatoService.eliminarVacanteFavorita(usuario.id, vacanteId);
        toast.success("Vacante eliminada de favoritos");
      } else {
        await candidatoService.agregarVacanteFavorita(usuario.id, vacanteId);
        toast.success("Vacante agregada a favoritos");
      }
      setEsFavorita(!esFavorita);
    } catch (error) {
      toast.error("Error al gestionar favoritos");
      console.error("Error toggle favorito:", error);
    }
  };
  
  // Función para manejar postulación
  const handlePostulacion = () => {
    if (!usuario?.id) {
      toast.error("Debes iniciar sesión para postularte a esta vacante");
      router.push("/login");
      return;
    }
    
    if (usuario?.rol !== "CANDIDATO") {
      toast.error("Solo los candidatos pueden postularse a vacantes");
      return;
    }
    
    // Aquí iría la lógica para la postulación
    // Por ahora solo simulamos
    toast.success("Funcionalidad de postulación en desarrollo");
  };

  // Formatear la fecha
  const formatearFecha = (fechaString: string) => {
    const opciones: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return new Date(fechaString).toLocaleDateString("es-ES", opciones);
  };
  
  // Formatear los salarios
  const formatearSalario = (min?: number, max?: number, mostrar?: boolean) => {
    if (!mostrar) return "No especificado";
    if (!min && !max) return "No especificado";
    
    const formatearNumero = (num?: number) => {
      return num ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num) : "No especificado";
    };
    
    if (min && max) {
      return `${formatearNumero(min)} - ${formatearNumero(max)}`;
    } else if (min) {
      return `Desde ${formatearNumero(min)}`;
    } else if (max) {
      return `Hasta ${formatearNumero(max)}`;
    }
    
    return "No especificado";
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-2">Cargando vacante...</h2>
          <p className="text-muted-foreground">Estamos obteniendo la información detallada</p>
        </div>
      </div>
    );
  }

  if (error || !vacante) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || "No se pudo cargar la vacante"}</p>
          <Button asChild>
            <Link href="/vacantes">Volver a vacantes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="mb-6">
            <Link href="/vacantes" className="inline-flex items-center text-sm text-[#38bdf8] hover:underline">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver a vacantes
            </Link>
          </div>

          {/* Encabezado de la vacante */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0a192f]">{vacante.titulo}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground">
                <div className="flex items-center">
                  <Briefcase className="mr-1 h-4 w-4" />
                  <span>{vacante.area || "Área no especificada"}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>{vacante.ubicacion || "Ubicación no especificada"}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>Publicado: {vacante.fechaPublicacion ? formatearFecha(vacante.fechaPublicacion) : "Fecha no especificada"}</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-[#38bdf8]/10 text-[#38bdf8] hover:bg-[#38bdf8]/20 border-[#38bdf8]/20"
                >
                  {vacante.tipoContrato || "Tipo no especificado"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className={`rounded-full ${esFavorita ? 'bg-pink-100 text-pink-600' : ''}`}
                onClick={toggleFavorito}
              >
                <Heart className={`h-4 w-4 ${esFavorita ? 'fill-current' : ''}`} />
                <span className="sr-only">{esFavorita ? "Quitar de favoritos" : "Guardar vacante"}</span>
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Compartir vacante</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Contenido principal */}
            <div className="space-y-8">
              {/* Detalles básicos */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[#38bdf8]" />
                      <div>
                        <p className="text-sm font-medium">Salario</p>
                        <p className="text-sm text-muted-foreground">
                          {formatearSalario(vacante.salarioMinimo, vacante.salarioMaximo, vacante.mostrarSalario)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#38bdf8]" />
                      <div>
                        <p className="text-sm font-medium">Modalidad</p>
                        <p className="text-sm text-muted-foreground">{vacante.modalidad || "No especificada"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Descripción */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#0a192f]">Descripción</h2>
                <p className="text-muted-foreground">{vacante.descripcion}</p>
              </div>

              {/* Requisitos */}
              {vacante.requisitosAdicionales && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#0a192f]">Requisitos</h2>
                  <div className="text-muted-foreground">
                    {vacante.requisitosAdicionales.split('\n').map((item, index) => (
                      <p key={index} className="mb-2">{item}</p>
                  ))}
              </div>
              </div>
              )}

              {/* Beneficios */}
              {vacante.beneficios && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#0a192f]">Beneficios</h2>
                  <div className="text-muted-foreground">
                    {vacante.beneficios.split('\n').map((item, index) => (
                      <p key={index} className="mb-2">{item}</p>
                  ))}
                  </div>
              </div>
              )}

              {/* CTA */}
              <div className="flex justify-center pt-4">
                <Button 
                  size="lg" 
                  className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
                  onClick={handlePostulacion}
                >
                  Postularme a esta vacante
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Compatibilidad con IA - Solo visible para candidatos */}
              {usuario?.rol === "CANDIDATO" && (
              <Card className="overflow-hidden">
                <div className="bg-[#0a192f] p-4 text-white">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5" />
                    <h3 className="font-medium">Compatibilidad con tu perfil</h3>
                  </div>
                </div>
                <CardContent className="p-4">
                    {cargandoEmparejamiento ? (
                      <div className="py-4 text-center">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-8 w-full bg-gray-200 rounded-full"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">Calculando compatibilidad...</p>
                      </div>
                    ) : errorEmparejamiento ? (
                      <div className="py-2 text-center">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                        <p className="text-sm text-muted-foreground">{errorEmparejamiento}</p>
                      </div>
                    ) : emparejamiento ? (
                      <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Coincidencia</span>
                          <span className="text-sm font-bold text-[#38bdf8]">{emparejamiento.porcentaje}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div 
                            className="h-full rounded-full bg-[#38bdf8]" 
                            style={{ width: `${emparejamiento.porcentaje}%` }}
                          ></div>
                  </div>
                        
                        {emparejamiento.mensajeCandidato && (
                  <p className="mt-4 text-sm text-muted-foreground">
                            {emparejamiento.mensajeCandidato}
                          </p>
                        )}
                        
                        {/* Fortalezas */}
                        {emparejamiento.fortalezas && emparejamiento.fortalezas.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                              <ThumbsUp className="h-4 w-4 text-green-500 mr-1" />
                              Tus fortalezas para este puesto
                            </h4>
                            <ul className="space-y-1">
                              {emparejamiento.fortalezas.slice(0, 3).map((fortaleza, index) => (
                                <li key={index} className="text-xs text-muted-foreground flex items-start">
                                  <span className="text-green-500 mr-1">•</span> {fortaleza}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Recomendaciones */}
                        {emparejamiento.recomendaciones && emparejamiento.recomendaciones.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                              <Lightbulb className="h-4 w-4 text-[#38bdf8] mr-1" />
                              Recomendaciones
                            </h4>
                            <ul className="space-y-1">
                              {emparejamiento.recomendaciones.slice(0, 2).map((recomendacion, index) => (
                                <li key={index} className="text-xs text-muted-foreground flex items-start">
                                  <span className="text-[#38bdf8] mr-1">•</span> {recomendacion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="py-2 text-sm text-muted-foreground">
                        No hay información de compatibilidad disponible. Asegúrate de completar tu perfil para obtener mejores resultados.
                      </p>
                    )}
                    
                    <div className="mt-4 pt-4 border-t flex items-center justify-center">
                      <Badge className="bg-[#38bdf8]/10 text-[#38bdf8] gap-1 flex items-center">
                        <Sparkles className="h-3 w-3" />
                        <span>Potenciado por IA</span>
                      </Badge>
                    </div>
                </CardContent>
              </Card>
              )}

              {/* Habilidades requeridas */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 font-medium text-[#0a192f]">Habilidades clave</h3>
                  {vacante.habilidadesRequeridas ? (
                    <div className="flex flex-wrap gap-2">
                      {vacante.habilidadesRequeridas.split(',').map((habilidad, index) => (
                        <Badge key={index} variant="outline" className="py-1">
                          {habilidad.trim()}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No se han especificado habilidades para esta vacante.</p>
                  )}
                </CardContent>
              </Card>

              {/* Información de la empresa/reclutador */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 font-medium text-[#0a192f]">Publicado por</h3>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-[#38bdf8] rounded-full flex items-center justify-center text-white font-medium">
                      {vacante.reclutador?.nombre.charAt(0)}
                      {vacante.reclutador?.apellido.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{vacante.reclutador?.nombre} {vacante.reclutador?.apellido}</p>
                      <p className="text-xs text-muted-foreground">{vacante.reclutador?.puesto || 'Reclutador'} en {vacante.reclutador?.empresa || 'Vertex'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compartir */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 font-medium text-[#0a192f]">Compartir esta vacante</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1 h-4 w-4"
                      >
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                      Facebook
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1 h-4 w-4"
                      >
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                      </svg>
                      Twitter
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1 h-4 w-4"
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect x="2" y="9" width="4" height="12"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                      </svg>
                      LinkedIn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

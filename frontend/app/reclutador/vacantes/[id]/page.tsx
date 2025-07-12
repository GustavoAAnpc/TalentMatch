"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  ArrowLeft,
  Edit,
  FileCode,
  MapPin,
  Users,
  Building,
  CalendarRange,
  BrainCircuit,
  Sparkles,
  Lightbulb,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  CheckCircle,
  XCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { vacanteService } from "@/services/vacanteService";
import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { authService } from "@/services/authService";
import { iaService } from "@/services/iaService";
import { formatearFecha } from "@/lib/utils";

export default function VacanteDetalles() {
  const params = useParams();
  const router = useRouter();
  const vacanteId = Number(params.id);

  const [vacante, setVacante] = useState<any>(null);
  const [pruebas, setPruebas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  
  // Estados para el análisis avanzado de IA
  const [analisisIA, setAnalisisIA] = useState<any>(null);
  const [candidatosRecomendados, setCandidatosRecomendados] = useState<any[]>([]);
  const [cargandoAnalisisIA, setCargandoAnalisisIA] = useState(false);
  const [errorAnalisisIA, setErrorAnalisisIA] = useState<string | null>(null);

  useEffect(() => {
    const cargarUsuario = () => {
      const user = authService.getUsuarioActual();
      if (!user || !user.id) {
        toast.error("No se pudo identificar al usuario. Inicie sesión nuevamente.");
        return null;
      }
      return user;
    };

    const cargarVacante = async () => {
      try {
        setCargando(true);
        const user = cargarUsuario();
        if (!user) return;
        
        setUsuario(user);
        const data = await vacanteService.obtenerVacantePorId(vacanteId);
        setVacante(data);

        // Cargar pruebas técnicas asociadas
        try {
          console.log("Cargando pruebas técnicas para la vacante ID:", vacanteId);
          const pruebasData = await pruebaTecnicaService.obtenerPruebasPorVacante(vacanteId);
          console.log("Pruebas técnicas recibidas:", pruebasData);
          
          if (Array.isArray(pruebasData)) {
            setPruebas(pruebasData);
            console.log(`Se encontraron ${pruebasData.length} pruebas técnicas`);
          } else {
            console.error("La respuesta de pruebas técnicas no es un array:", pruebasData);
            setPruebas([]);
          }
        } catch (err) {
          console.error("Error al cargar pruebas técnicas:", err);
          // Mostrar un toast para informar al usuario
          toast.error("No se pudieron cargar las pruebas técnicas asociadas");
        }
        
        setCargando(false);
        
        // Una vez cargada la vacante, cargar el análisis de IA
        cargarAnalisisIA(vacanteId);
      } catch (err) {
        console.error("Error al cargar detalles de la vacante:", err);
        setError("No se pudieron cargar los detalles de la vacante");
        setCargando(false);
      }
    };
    
    const cargarAnalisisIA = async (id: number) => {
      try {
        setCargandoAnalisisIA(true);
        setErrorAnalisisIA(null);
        
        // Cargar análisis de candidatos postulados
        const datosAnalisis = await iaService.analizarCandidatosPostulados(id);
        setAnalisisIA(datosAnalisis);
        
        // Cargar candidatos recomendados
        const recomendaciones = await iaService.recomendarCandidatos(id, 5);
        setCandidatosRecomendados(recomendaciones);
      } catch (err: any) {
        console.error("Error al cargar análisis avanzado:", err);
        setErrorAnalisisIA(err.message || "Error al cargar el análisis avanzado");
      } finally {
        setCargandoAnalisisIA(false);
      }
    };

    if (vacanteId) {
      cargarVacante();
    }
  }, [vacanteId]);

  if (cargando) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !vacante) {
    return (
      <div className="space-y-6 p-6">
        <Button asChild variant="outline">
          <Link href="/reclutador/vacantes">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a vacantes
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              {error || "No se pudo cargar la información de la vacante"}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Formato de estado para botones y badges
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "ACTIVA":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "PAUSADA":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "CERRADA":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "BORRADOR":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Componente para mostrar el análisis avanzado de IA
  const AnalisisAvanzadoVacante = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Análisis IA Avanzado</h2>
          <Badge className="bg-purple-500 text-white flex items-center gap-1">
            <BrainCircuit className="h-3 w-3" />
            <span>IA Predictiva</span>
          </Badge>
        </div>

        <Tabs defaultValue="candidatos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="candidatos">Candidatos Recomendados</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="habilidades">Análisis de Habilidades</TabsTrigger>
          </TabsList>

          <TabsContent value="candidatos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Candidatos Recomendados por IA</CardTitle>
                <CardDescription>
                  Perfiles con mayor compatibilidad para esta vacante
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cargandoAnalisisIA ? (
                  // Skeleton de carga para candidatos
                  <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                      <div key={`candidato-skeleton-${i}`} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <Skeleton className="h-3 w-full mb-2" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                    ))}
                  </div>
                ) : errorAnalisisIA ? (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      No se pudieron cargar los candidatos recomendados
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {candidatosRecomendados && candidatosRecomendados.length > 0 ? (
                      candidatosRecomendados.map((candidato) => (
                        <div key={candidato.id} className="rounded-lg border p-3 relative overflow-hidden">
                          <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-500/20 to-transparent w-1/2 h-1"></div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-10 w-10">
                                {candidato.urlFoto ? (
                                  <AvatarImage src={candidato.urlFoto} alt={`${candidato.nombre} ${candidato.apellido}`} />
                                ) : (
                                  <AvatarFallback>
                                    {candidato.nombre?.charAt(0)}{candidato.apellido?.charAt(0)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="space-y-1">
                                <p className="font-medium leading-none">
                                  {candidato.nombre} {candidato.apellido}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {candidato.tituloProfesional || "Profesional"} 
                                  {candidato.experienciaAnios ? ` - ${candidato.experienciaAnios} años exp.` : ""}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-purple-500 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              <span>{candidato.puntuacion || candidato.porcentajeEmparejamiento || 0}%</span>
                            </Badge>
                          </div>
                          
                          {candidato.justificacion && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <div className="flex items-start gap-1">
                                <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <p>{candidato.justificacion}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-3 flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/reclutador/candidatos/${candidato.id}`}>
                                Ver perfil
                                <ArrowUpRight className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-6 text-muted-foreground">
                        No hay candidatos recomendados disponibles para esta vacante.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Insights de IA</CardTitle>
                <CardDescription>
                  Análisis y recomendaciones para mejorar la efectividad de esta vacante
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cargandoAnalisisIA ? (
                  // Skeleton de carga para insights
                  <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                      <div key={`insight-skeleton-${i}`} className="rounded-lg border p-3">
                        <div className="flex items-start gap-2">
                          <Skeleton className="h-4 w-4 mt-0.5 rounded-full" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : errorAnalisisIA ? (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      No se pudieron cargar los insights
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {analisisIA && analisisIA.recomendaciones && analisisIA.recomendaciones.length > 0 ? (
                      analisisIA.recomendaciones.map((insight: string, index: number) => (
                        <div key={index} className="rounded-lg border p-3 relative overflow-hidden">
                          <div className="absolute top-0 left-0 bg-gradient-to-r from-[#38bdf8]/20 to-transparent w-1/2 h-1"></div>
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-[#38bdf8] mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{insight}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-6 text-muted-foreground">
                        No hay insights disponibles para esta vacante.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="habilidades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Habilidades</CardTitle>
                <CardDescription>
                  Evaluación de las habilidades requeridas y disponibles en el mercado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cargandoAnalisisIA ? (
                  // Skeleton de carga para habilidades
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-40 mb-2" />
                      {[1, 2, 3, 4].map((_, i) => (
                        <div key={`habilidad-skeleton-${i}`} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : errorAnalisisIA ? (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      No se pudo cargar el análisis de habilidades
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    {analisisIA && analisisIA.habilidadesRelevantes && analisisIA.habilidadesRelevantes.length > 0 ? (
                      <>
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Habilidades más relevantes</h3>
                          {analisisIA.habilidadesRelevantes.map((habilidad: string, index: number) => (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">{habilidad}</span>
                                <Badge variant="outline" className="text-[10px]">Alta demanda</Badge>
                              </div>
                              <Progress value={90 - (index * 10)} className="h-2" />
                            </div>
                          ))}
                        </div>
                        
                        {analisisIA.habilidadesEscasas && analisisIA.habilidadesEscasas.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-medium">Habilidades escasas en el mercado</h3>
                            <div className="flex flex-wrap gap-2">
                              {analisisIA.habilidadesEscasas.map((habilidad: string, index: number) => (
                                <Badge key={index} variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                                  {habilidad}
                                </Badge>
                              ))}
                            </div>
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Recomendación</AlertTitle>
                              <AlertDescription>
                                Estas habilidades son difíciles de encontrar. Considere flexibilizar estos requisitos o ofrecer capacitación.
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                        
                        {analisisIA.habilidadesComplementarias && analisisIA.habilidadesComplementarias.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-sm font-medium">Habilidades complementarias recomendadas</h3>
                            <div className="flex flex-wrap gap-2">
                              {analisisIA.habilidadesComplementarias.map((habilidad: string, index: number) => (
                                <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {habilidad}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-6 text-muted-foreground">
                        No hay análisis de habilidades disponible para esta vacante.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline">
            <Link href="/reclutador/vacantes">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Link>
          </Button>
          <Badge className={getEstadoColor(vacante.estado)}>
            {vacante.estado}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="default">
            <Link href={`/reclutador/vacantes/${vacanteId}/editar`}>
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href={`/reclutador/vacantes/${vacanteId}/candidatos`}>
              <Users className="h-4 w-4 mr-2" /> Candidatos ({vacante.totalPostulaciones || 0})
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{vacante.titulo}</CardTitle>
              <CardDescription>
                <div className="flex items-center mt-1 gap-2 text-sm">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    {vacante.area || "No especificado"}
                  </div>
                  <span>•</span>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {vacante.ubicacion || "No especificado"}
                  </div>
                  <span>•</span>
                  <div className="flex items-center">
                    <CalendarRange className="h-4 w-4 mr-1" />
                    {vacante.fechaPublicacion ? `Publicado: ${formatearFecha(vacante.fechaPublicacion)}` : "Fecha no disponible"}
                  </div>
                </div>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Sección descripción */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Descripción</h3>
            <div className="prose prose-gray max-w-none">
              {vacante.descripcion.split("\n").map((parrafo: string, i: number) => {
                // Detectar si es un encabezado (# o ##)
                if (parrafo.trim().startsWith("# ")) {
                  return (
                    <h2 key={i} className="text-xl font-bold mt-4 mb-2">
                      {parrafo.trim().substring(2)}
                    </h2>
                  );
                }
                if (parrafo.trim().startsWith("## ")) {
                  return (
                    <h3 key={i} className="text-lg font-bold mt-3 mb-2">
                      {parrafo.trim().substring(3)}
                    </h3>
                  );
                }
                // Detectar si es una lista de viñetas
                if (parrafo.trim().startsWith("- ")) {
                  return (
                    <ul key={i} className="list-disc list-inside">
                      <li>{parrafo.trim().substring(2)}</li>
                    </ul>
                  );
                }
                // Párrafo normal
                if (parrafo.trim() !== "") {
                  return <p key={i} className="mb-2">{parrafo}</p>;
                }
                // Línea vacía
                return <br key={i} />;
              })}
            </div>
          </div>

          <Separator />

          {/* Sección detalles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detalles de la vacante</h3>
            <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-8">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ubicación</p>
                <p className="font-medium">{vacante.ubicacion || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Modalidad</p>
                <p className="font-medium">{vacante.modalidad || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tipo de contrato</p>
                <p className="font-medium">{vacante.tipoContrato || "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Experiencia mínima</p>
                <p className="font-medium">{vacante.experienciaMinima !== undefined ? `${vacante.experienciaMinima} años` : "No especificado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Salario</p>
                <p className="font-medium">
                  {vacante.mostrarSalario 
                    ? `S/. ${vacante.salarioMinimo || 0} - S/. ${vacante.salarioMaximo || 0}` 
                    : "No mostrado"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sección habilidades */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Habilidades requeridas</h3>
            <div className="flex flex-wrap gap-2">
              {vacante.habilidadesRequeridas?.split(",").map((habilidad: string, i: number) => (
                <Badge key={i} variant="outline" className="text-sm py-1">
                  {habilidad.trim()}
                </Badge>
              )) || <p>No se han especificado habilidades</p>}
            </div>
          </div>

          {/* Sección de pruebas técnicas */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Pruebas técnicas</h3>
              <Button asChild variant="outline" size="sm">
                <Link href={`/reclutador/vacantes/${vacanteId}/pruebas/crear`}>
                  <FileCode className="h-4 w-4 mr-2" /> Crear prueba técnica
                </Link>
              </Button>
            </div>

            {pruebas.length > 0 ? (
              <div className="grid gap-4">
                {pruebas.map((prueba) => (
                  <div key={prueba.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{prueba.titulo || "Prueba sin título"}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {prueba.descripcion ? 
                            (prueba.descripcion.length > 100 ? 
                              `${prueba.descripcion.substring(0, 100)}...` : 
                              prueba.descripcion) : 
                            "Sin descripción"}
                        </p>
                        </div>
                      <Button asChild variant="ghost" size="sm">
                          <Link href={`/reclutador/pruebas/${prueba.id}`}>
                          Ver detalles
                          </Link>
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center border rounded-lg p-6 bg-muted/20">
                <p className="text-muted-foreground">
                  No hay pruebas técnicas asociadas a esta vacante.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cree una prueba técnica para evaluar a los candidatos.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Análisis avanzado de IA */}
      <AnalisisAvanzadoVacante />
    </div>
  );
} 
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowUpRight, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  Users, 
  BrainCircuit, 
  Sparkles, 
  Zap, 
  Lightbulb, 
  BarChart, 
  ArrowRight,
  AlertCircle,
  FileSearch,
  Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { reclutadorService } from "@/services/reclutadorService";
import { authService } from "@/services/authService";
import { DashboardReclutadorResponse, CandidatoTopResponse } from "@/types/reclutador";

// Cache TTL en ms (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;

export default function RecruiterDashboard() {
  const [basicData, setBasicData] = useState<Partial<DashboardReclutadorResponse> | null>(null);
  const [advancedData, setAdvancedData] = useState<Partial<DashboardReclutadorResponse> | null>(null);
  const [loading, setLoading] = useState({
    basic: true,
    advanced: true
  });
  const [error, setError] = useState<string | null>(null);

  // Combinar datos básicos y avanzados
  const dashboardData = useMemo(() => {
    if (!basicData) return null;
    
    return {
      ...basicData,
      ...advancedData,
      // Usar datos vacíos si los datos avanzados no están cargados
      candidatosDestacados: advancedData?.candidatosDestacados || [],
      insightsIA: advancedData?.insightsIA || [],
      habilidadesDestacadas: advancedData?.habilidadesDestacadas || []
    };
  }, [basicData, advancedData]);

  useEffect(() => {
    const cargarDatosDashboard = async () => {
      try {
        const usuario = authService.getUsuario();
        if (!usuario || !usuario.id) {
          setError("No se pudo obtener la información del usuario actual");
          setLoading({ basic: false, advanced: false });
          return;
        }

        // Verificar datos en caché primero
        const cachedData = checkCache(usuario.id);
        if (cachedData) {
          setBasicData(cachedData.basic);
          setAdvancedData(cachedData.advanced);
          setLoading({ 
            basic: false, 
            advanced: cachedData.advanced ? false : true 
          });
          
          // Si los datos avanzados están en caché, no necesitamos cargarlos de nuevo
          if (cachedData.advanced) {
            return;
          }
        }

        // Cargar datos básicos primero (rápidos)
        const basicDataResponse = await reclutadorService.obtenerEstadisticas(usuario.id);
        setBasicData(basicDataResponse);
        setLoading(prev => ({ ...prev, basic: false }));
        
        // Guardar en caché los datos básicos
        saveToCache(usuario.id, { 
          basic: basicDataResponse, 
          advanced: null,
          timestamp: Date.now()
        });

        // Carga asíncrona de datos avanzados basados en IA (más lentos)
        const advancedDataResponse = await reclutadorService.obtenerEstadisticasDashboard(usuario.id);
        
        // Depurar candidatos antes de establecer los datos
        if (advancedDataResponse && advancedDataResponse.candidatosDestacados) {
          console.log("Candidatos destacados recibidos:", JSON.stringify(advancedDataResponse.candidatosDestacados, null, 2));
          
          // Filtrar candidatos con porcentaje 0 directamente del backend
          advancedDataResponse.candidatosDestacados = advancedDataResponse.candidatosDestacados
            .filter((candidato: CandidatoTopResponse) => candidato.matchPorcentaje > 0)
            // Ordenar por porcentaje descendente para mostrar los mejores primero
            .sort((a: CandidatoTopResponse, b: CandidatoTopResponse) => b.matchPorcentaje - a.matchPorcentaje)
            // Eliminar duplicados basados en ID
            .filter((candidato: CandidatoTopResponse, index: number, self: CandidatoTopResponse[]) => 
              index === self.findIndex((c: CandidatoTopResponse) => c.id === candidato.id)
            );
          
          console.log("Candidatos filtrados y ordenados:", JSON.stringify(advancedDataResponse.candidatosDestacados, null, 2));
        }
        
        setAdvancedData(advancedDataResponse);
        setLoading(prev => ({ ...prev, advanced: false }));
        
        // Actualizar caché con datos avanzados
        saveToCache(usuario.id, {
          basic: basicDataResponse,
          advanced: advancedDataResponse,
          timestamp: Date.now()
        });
        
      } catch (err: any) {
        setError(err.message || "Error al cargar los datos del dashboard");
        console.error("Error cargando dashboard:", err);
        setLoading({ basic: false, advanced: false });
      }
    };

    cargarDatosDashboard();
  }, []);

  // Verificar si hay datos en caché válidos
  const checkCache = (userId: number) => {
    try {
      const cacheKey = `dashboard_${userId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) return null;
      
      const parsedData = JSON.parse(cachedData);
      const now = Date.now();
      
      // Verificar si los datos no han expirado
      if (now - parsedData.timestamp < CACHE_TTL) {
        return parsedData;
      }
      
      // Datos expirados, eliminarlos
      localStorage.removeItem(cacheKey);
      return null;
    } catch (e) {
      // Error al leer caché, ignorar
      return null;
    }
  };

  // Guardar datos en caché
  const saveToCache = (userId: number, data: any) => {
    try {
      const cacheKey = `dashboard_${userId}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
      // Error al guardar en caché, ignorar
      console.warn("Error al guardar datos en caché", e);
    }
  };

  const formatoNumero = (num: number) => {
    return Intl.NumberFormat('es-PE').format(num);
  };

  if (loading.basic) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col p-8 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button className="mt-4 w-fit" asChild>
          <Link href="/login">Volver a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col p-8 pt-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sin datos disponibles</AlertTitle>
          <AlertDescription>
            No se pudieron cargar los datos del dashboard. Intente de nuevo más tarde.
          </AlertDescription>
        </Alert>
        <Button className="mt-4 w-fit" onClick={() => window.location.reload()}>
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              Bienvenido, {dashboardData.reclutador?.nombre} {dashboardData.reclutador?.apellido}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/reclutador/vacantes/crear">
              <Button className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>Crear Vacante</span>
                <BrainCircuit className="h-4 w-4 text-blue-200" />
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vacantes Activas</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.vacantesActivas || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {(dashboardData.vacantesActivas || 0) > 0 
                      ? `${((dashboardData.vacantesActivas || 0) / (dashboardData.vacantesTotal || 1) * 100).toFixed(0)}% del total de vacantes` 
                      : "Sin vacantes activas"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Candidatos Analizados</CardTitle>
                  <BrainCircuit className="h-4 w-4 text-[#38bdf8]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatoNumero(dashboardData.candidatosAnalizados || 0)}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Sparkles className="h-3 w-3 mr-1 text-[#38bdf8]" />
                    <span>Perfiles evaluados por IA</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contrataciones</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.contratacionesTotal}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Zap className="h-3 w-3 mr-1 text-green-500" />
                    <span>{dashboardData.tasaConversion?.toFixed(0)}% de tasa de conversión</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo de Contratación</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.diasPromedioContratacion} días</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <ArrowRight className="h-3 w-3 mr-1 text-green-500" />
                    <span>Promedio para vacantes cerradas</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Vacantes Activas</CardTitle>
                    <CardDescription>Procesos de reclutamiento en curso</CardDescription>
                  </div>
                  <Badge className="bg-[#38bdf8] text-white flex items-center gap-1">
                    <BrainCircuit className="h-3 w-3" />
                    <span>IA Asistida</span>
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.vacantesRecientes && dashboardData.vacantesRecientes.length > 0 ? (
                      dashboardData.vacantesRecientes.map((vacante) => {
                        // Calcular días transcurridos desde la publicación
                        const fechaPublicacion = new Date(vacante.fechaPublicacion);
                        const hoy = new Date();
                        const diasTranscurridos = Math.floor((hoy.getTime() - fechaPublicacion.getTime()) / (1000 * 60 * 60 * 24));
                        
                        // Calcular progreso aproximado basado en días y estado de la vacante
                        const progreso = Math.min(Math.max(diasTranscurridos * 10, 10), 90);
                        
                        return (
                          <div key={vacante.id} className="rounded-lg border p-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-[#38bdf8]/20 to-transparent w-1/2 h-1"></div>
                        <div className="flex items-center justify-between">
                              <p className="text-sm font-medium leading-none">{vacante.titulo}</p>
                              <p className="text-sm text-muted-foreground">
                                {vacante.postulacionesCount || 0} candidatos
                              </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                              <Progress value={progreso} className="h-2 flex-1" />
                              <p className="text-xs text-muted-foreground whitespace-nowrap">{diasTranscurridos} días</p>
                        </div>
                        <div className="mt-2 flex justify-between items-center text-xs">
                              <Link href={`/reclutador/vacantes/${vacante.id}`} className="text-[#38bdf8] hover:underline">Ver detalles</Link>
                              <Link href={`/reclutador/candidatos?vacanteId=${vacante.id}`} className="text-[#38bdf8] hover:underline">Ver candidatos</Link>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <Alert>
                        <FileSearch className="h-4 w-4" />
                        <AlertTitle>Sin vacantes activas</AlertTitle>
                        <AlertDescription>
                          No tienes vacantes activas actualmente. Crea una nueva vacante para comenzar.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/reclutador/vacantes">
                      Ver todas las vacantes
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Candidatos Destacados</CardTitle>
                    <CardDescription>Perfiles con mayor compatibilidad</CardDescription>
                  </div>
                  <Badge className="bg-[#38bdf8] text-white flex items-center gap-1">
                    <BrainCircuit className="h-3 w-3" />
                    <span>IA Avanzada</span>
                  </Badge>
                </CardHeader>
                <CardContent>
                  {loading.advanced ? (
                    // Skeleton para candidatos mientras cargan
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={`candidato-skeleton-${i}`} className="rounded-lg border p-3">
                          <div className="flex justify-between mb-2">
                            <div className="flex gap-2 items-center">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32 mt-1" />
                              </div>
                            </div>
                            <Skeleton className="h-5 w-16" />
                          </div>
                          <Skeleton className="h-3 w-full mt-2" />
                          <div className="flex gap-1 mt-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                  <div className="space-y-4">
                      {dashboardData.candidatosDestacados
                        // Limitar a solo 2 candidatos destacados
                        .slice(0, 2)
                        .map((candidato, index) => (
                        <div key={`candidato-${candidato.id}-${index}`} className="rounded-lg border p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bg-gradient-to-r from-[#38bdf8]/20 to-transparent w-1/2 h-1"></div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                {candidato.urlFoto ? (
                                  <AvatarImage src={candidato.urlFoto} alt={`${candidato.nombre} ${candidato.apellido}`} />
                                ) : (
                                  <AvatarFallback>
                                    {candidato.nombre.charAt(0)}{candidato.apellido.charAt(0)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                          <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                  {candidato.nombre} {candidato.apellido}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {candidato.profesion || "Profesional"} {candidato.aniosExperiencia ? `- ${candidato.aniosExperiencia} años exp.` : ""}
                                </p>
                              </div>
                          </div>
                          <Badge className="bg-[#38bdf8] flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                              <span>{candidato.matchPorcentaje.toFixed(0)}%</span>
                          </Badge>
                        </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            <div className="flex items-start gap-1">
                              <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <p>{candidato.insight}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {candidato.habilidadesPrincipales.map((habilidad, i) => (
                              <Badge key={`candidato-${candidato.id}-${index}-habilidad-${i}`} variant="outline" className="text-[10px] bg-slate-50">
                                {habilidad}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* Botón Ver más candidatos - siempre visible */}
                      <Button variant="outline" className="w-full mt-2" asChild>
                        <Link href="/reclutador/candidatos">
                          Ver más candidatos
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Insights de IA</CardTitle>
                    <CardDescription>Análisis avanzado de tus procesos de reclutamiento</CardDescription>
                  </div>
                  <Badge className="bg-purple-500 text-white flex items-center gap-1">
                    <BrainCircuit className="h-3 w-3" />
                    <span>IA Predictiva</span>
                  </Badge>
                </CardHeader>
                <CardContent>
                  {loading.advanced ? (
                    // Skeleton para insights mientras cargan
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={`insight-skeleton-${i}`} className="rounded-lg border p-3">
                          <div className="flex items-start gap-2">
                            <Skeleton className="h-4 w-4 mt-0.5 rounded-full" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.insightsIA
                        ?.slice(0, 4) // Limitar a 4 insights
                        .map((insight, index) => (
                        <div key={`insight-${index}`} className="rounded-lg border p-3 relative overflow-hidden">
                          <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-500/20 to-transparent w-1/2 h-1"></div>
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{insight}</p>
                        </div>
                      </div>
                    ))}
                      {!dashboardData.insightsIA?.length && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Sin insights disponibles</AlertTitle>
                          <AlertDescription>
                            Crea más vacantes o actualiza tu perfil para obtener insights basados en IA.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Habilidades Más Solicitadas</CardTitle>
                    <CardDescription>Basado en tus vacantes activas</CardDescription>
                  </div>
                  <Badge className="bg-[#38bdf8] text-white flex items-center gap-1">
                    <BrainCircuit className="h-3 w-3" />
                    <span>Análisis IA</span>
                  </Badge>
                </CardHeader>
                <CardContent>
                  {loading.advanced ? (
                    // Skeleton para habilidades mientras cargan
                    <div className="space-y-4">
                      {Array(4).fill(0).map((_, i) => (
                        <div key={`habilidad-skeleton-${i}`} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.habilidadesDestacadas?.map((habilidad, index) => (
                        <div key={`habilidad-destacada-${index}`} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{habilidad.nombre}</span>
                            <span className="text-xs text-muted-foreground">{habilidad.cantidad} vacantes</span>
                          </div>
                          <Progress 
                            value={Math.min(habilidad.cantidad / Math.max(...(dashboardData.habilidadesDestacadas || []).map(h => h.cantidad)) * 100, 100)}
                            className="h-2" 
                          />
                        </div>
                      ))}
                      {!dashboardData.habilidadesDestacadas?.length && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Sin datos disponibles</AlertTitle>
                          <AlertDescription>
                            Crea vacantes con habilidades específicas para ver este análisis.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Estadísticas Detalladas</CardTitle>
                <CardDescription>Análisis profundo de tus procesos de reclutamiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <p className="text-muted-foreground">El panel de analíticas detalladas está en desarrollo.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Próximamente podrás acceder a estadísticas avanzadas, tendencias y más información sobre tus procesos de reclutamiento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <Card key={`stats-card-${i}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={`skeleton-vacancy-${i}`} className="rounded-lg border p-3">
                    <div className="flex justify-between mb-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex gap-2 items-center">
                      <Skeleton className="h-2 flex-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <div className="mt-2 flex justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>

            <Card className="col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={`skeleton-candidate-${i}`} className="rounded-lg border p-3">
                    <div className="flex justify-between mb-2">
                      <div className="flex gap-2 items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32 mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-3 w-full mt-2" />
                    <div className="flex gap-1 mt-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

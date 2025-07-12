"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  FileSpreadsheet,
  Download,
  Loader2,
  User,
  CheckCircle,
  XCircle,
  BarChart3,
  Clock,
  Calendar,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { authService } from "@/services/authService";

export default function ResultadosPruebaTecnicaPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [prueba, setPrueba] = useState<any>(null);
  const [resultados, setResultados] = useState<any[]>([]);
  
  // Datos simulados para mostrar interfaz
  const resultadosSimulados = [
    { 
      candidatoId: 1, 
      nombre: "Ana García", 
      email: "ana.garcia@ejemplo.com", 
      fechaRealizacion: "2023-11-15T14:30:00", 
      tiempoEmpleado: 45, 
      puntuacion: 85, 
      respuestasCorrectas: 17, 
      totalPreguntas: 20,
      estado: "APROBADO"
    },
    { 
      candidatoId: 2, 
      nombre: "Luis Rodríguez", 
      email: "luis.rodriguez@ejemplo.com", 
      fechaRealizacion: "2023-11-14T10:15:00", 
      tiempoEmpleado: 52, 
      puntuacion: 75, 
      respuestasCorrectas: 15, 
      totalPreguntas: 20,
      estado: "APROBADO"
    },
    { 
      candidatoId: 3, 
      nombre: "María Pérez", 
      email: "maria.perez@ejemplo.com", 
      fechaRealizacion: "2023-11-16T09:20:00", 
      tiempoEmpleado: 58, 
      puntuacion: 60, 
      respuestasCorrectas: 12, 
      totalPreguntas: 20,
      estado: "REPROBADO"
    }
  ];

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        
        // Obtener el usuario actual
        const user = authService.getUsuario();
        if (!user || !user.id) {
          toast.error("No se pudo identificar al usuario. Inicie sesión nuevamente.");
          router.push("/login");
          return;
        }
        
        setUsuario(user);
        
        // Verificar permisos
        if (user.rol !== "RECLUTADOR" && user.rol !== "ADMINISTRADOR") {
          toast.error("No tienes permisos para acceder a esta sección");
          router.push("/dashboard");
          return;
        }
        
        // Cargar datos de la prueba técnica
        const pruebaData = await pruebaTecnicaService.obtenerPruebaPorId(id);
        setPrueba(pruebaData);
        
        // Cargar resultados (simulados por ahora)
        setResultados(resultadosSimulados);
        
        setCargando(false);
      } catch (error) {
        console.error("Error al cargar resultados:", error);
        setError("Error al cargar los resultados de la prueba técnica.");
        setCargando(false);
      }
    };
    
    if (id) {
      cargarDatos();
    }
  }, [id, router]);

  // Formatear fecha
  const formatearFecha = (fechaString: string) => {
    if (!fechaString) return "Fecha no disponible";
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString("es-ES", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    if (!resultados || resultados.length === 0) {
      return {
        puntuacionPromedio: 0,
        tiempoPromedio: 0,
        porcentajeAprobados: 0,
        totalCandidatos: 0
      };
    }
    
    const puntuaciones = resultados.map(r => r.puntuacion);
    const tiempos = resultados.map(r => r.tiempoEmpleado);
    const aprobados = resultados.filter(r => r.estado === "APROBADO").length;
    
    return {
      puntuacionPromedio: Math.round(puntuaciones.reduce((a, b) => a + b, 0) / puntuaciones.length),
      tiempoPromedio: Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length),
      porcentajeAprobados: Math.round((aprobados / resultados.length) * 100),
      totalCandidatos: resultados.length
    };
  };
  
  const estadisticas = calcularEstadisticas();

  // Descargar resultados
  const descargarResultados = () => {
    toast.info("Descargando resultados...");
    setTimeout(() => {
      toast.success("Resultados descargados correctamente");
    }, 1500);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/reclutador/pruebas">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Resultados de la Prueba</h2>
        </div>
        
        <Button onClick={descargarResultados} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>Exportar Resultados</span>
          <FileSpreadsheet className="h-4 w-4 text-green-200" />
        </Button>
      </div>

      {cargando ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      ) : (
        <>
          {prueba && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{prueba.titulo}</CardTitle>
                    <CardDescription className="mt-1">{prueba.descripcion}</CardDescription>
                  </div>
                  
                  <Badge className={prueba.completada ? "bg-green-500" : "bg-blue-500"}>
                    {prueba.completada ? "Completada" : "Activa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <BarChart3 className="h-8 w-8 text-blue-500 mb-2" />
                        <h3 className="text-xl font-semibold">{estadisticas.puntuacionPromedio}%</h3>
                        <p className="text-sm text-muted-foreground">Puntuación Promedio</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <User className="h-8 w-8 text-indigo-500 mb-2" />
                        <h3 className="text-xl font-semibold">{estadisticas.totalCandidatos}</h3>
                        <p className="text-sm text-muted-foreground">Candidatos Evaluados</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                        <h3 className="text-xl font-semibold">{estadisticas.porcentajeAprobados}%</h3>
                        <p className="text-sm text-muted-foreground">Tasa de Aprobación</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <Clock className="h-8 w-8 text-orange-500 mb-2" />
                        <h3 className="text-xl font-semibold">{estadisticas.tiempoPromedio} min</h3>
                        <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Resultados</CardTitle>
              <CardDescription>
                Resultados detallados de cada candidato que realizó la prueba
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tabla" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="tabla">Vista de Tabla</TabsTrigger>
                  <TabsTrigger value="detalle">Vista Detallada</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tabla" className="space-y-4">
                  {resultados.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Candidato</TableHead>
                          <TableHead>Fecha Realización</TableHead>
                          <TableHead>Tiempo</TableHead>
                          <TableHead>Puntuación</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultados.map((resultado) => (
                          <TableRow key={resultado.candidatoId}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{resultado.nombre}</span>
                                <span className="text-xs text-muted-foreground">{resultado.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-sm">
                                <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                                {formatearFecha(resultado.fechaRealizacion)}
                              </div>
                            </TableCell>
                            <TableCell>{resultado.tiempoEmpleado} min</TableCell>
                            <TableCell>
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{resultado.puntuacion}%</span>
                                  <span className="text-xs text-muted-foreground">
                                    {resultado.respuestasCorrectas}/{resultado.totalPreguntas}
                                  </span>
                                </div>
                                <Progress value={resultado.puntuacion} className="h-2" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={resultado.estado === "APROBADO" ? "bg-green-500" : "bg-red-500"}>
                                {resultado.estado === "APROBADO" ? (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Aprobado</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3" />
                                    <span>Reprobado</span>
                                  </div>
                                )}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center border rounded-lg">
                      <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium">No hay resultados disponibles</h3>
                      <p className="text-muted-foreground mt-1">
                        Aún no hay candidatos que hayan completado esta prueba técnica.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="detalle" className="space-y-6">
                  {resultados.length > 0 ? (
                    resultados.map((resultado) => (
                      <Card key={resultado.candidatoId}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle>{resultado.nombre}</CardTitle>
                              <CardDescription>{resultado.email}</CardDescription>
                            </div>
                            <Badge className={resultado.estado === "APROBADO" ? "bg-green-500" : "bg-red-500"}>
                              {resultado.estado === "APROBADO" ? "Aprobado" : "Reprobado"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm text-muted-foreground">Fecha de Realización</span>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                                <span>{formatearFecha(resultado.fechaRealizacion)}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm text-muted-foreground">Tiempo Empleado</span>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                                <span>{resultado.tiempoEmpleado} minutos</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm text-muted-foreground">Puntuación</span>
                              <div className="flex items-center">
                                <BarChart3 className="h-4 w-4 text-muted-foreground mr-2" />
                                <span>{resultado.puntuacion}% ({resultado.respuestasCorrectas}/{resultado.totalPreguntas})</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Desempeño</span>
                              <span className="text-sm text-muted-foreground">{resultado.puntuacion}%</span>
                            </div>
                            <Progress value={resultado.puntuacion} className="h-2" />
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" size="sm" className="w-full">
                            Ver Respuestas Detalladas
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="py-8 text-center border rounded-lg">
                      <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium">No hay resultados disponibles</h3>
                      <p className="text-muted-foreground mt-1">
                        Aún no hay candidatos que hayan completado esta prueba técnica.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  BrainCircuit,
  Calendar,
  Clock,
  Download,
  Edit,
  FileText,
  Loader2,
  MoreHorizontal,
  Send,
  User,
  Building,
  BarChart3,
  CheckCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { authService } from "@/services/authService";

export default function DetallePruebaTecnicaPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [prueba, setPrueba] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);

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
        
        // Cargar prueba técnica
        const pruebaData = await pruebaTecnicaService.obtenerPruebaPorId(id);
        setPrueba(pruebaData);
        
        setCargando(false);
      } catch (error) {
        console.error("Error al cargar la prueba técnica:", error);
        setError("Error al cargar los datos de la prueba técnica");
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

  if (cargando) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-[250px]" />
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <Skeleton className="h-8 w-[300px]" />
                <Skeleton className="h-4 w-[250px] mt-2" />
              </div>
              <Skeleton className="h-6 w-[80px]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-6 w-[150px]" />
                </div>
              ))}
            </div>
            <Skeleton className="h-px w-full" />
            <div>
              <Skeleton className="h-6 w-[150px] mb-3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
          </CardContent>
        </Card>
        
        <div>
          <Skeleton className="h-10 w-[250px] mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[120px] w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/reclutador/pruebas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">Error</h2>
        </div>
        
        <Card className="border-red-200">
          <CardContent className="pt-6 flex flex-col items-center text-center p-12">
            <div className="bg-red-50 p-3 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-red-500">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Error al cargar la prueba técnica</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button variant="outline" asChild>
              <Link href="/reclutador/pruebas" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a Pruebas Técnicas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/reclutador/pruebas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">Prueba Técnica</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/reclutador/pruebas/${id}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/reclutador/pruebas/${id}/resultados`}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Resultados
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/reclutador/pruebas/${id}/asignar`}>
              <Send className="h-4 w-4 mr-2" />
              Asignar
            </Link>
          </Button>
        </div>
      </div>

      {prueba && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{prueba.titulo}</CardTitle>
                  <CardDescription className="mt-1">
                    {prueba.descripcion}
                  </CardDescription>
                </div>
                
                <Badge className={prueba.completada ? "bg-green-500" : "bg-blue-500"}>
                  {prueba.completada ? "Completada" : "Activa"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Nivel de Dificultad</span>
                  <div className="flex items-center">
                    <Badge variant="outline" className="font-medium">
                      {prueba.nivelDificultad === "BASICO" ? "Básico" :
                       prueba.nivelDificultad === "INTERMEDIO" ? "Intermedio" :
                       prueba.nivelDificultad === "AVANZADO" ? "Avanzado" :
                       prueba.nivelDificultad}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Duración</span>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                    <span>{prueba.tiempoLimiteMinutos} minutos</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Fecha de Creación</span>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                    <span>{formatearFecha(prueba.fechaCreacion)}</span>
                  </div>
                </div>
                
                {prueba.vacante && (
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Vacante Asociada</span>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-muted-foreground mr-2" />
                      <Link href={`/reclutador/vacantes/${prueba.vacante.id}`} className="text-blue-600 hover:underline">
                        {prueba.vacante.titulo}
                      </Link>
                    </div>
                  </div>
                )}
                
                {prueba.postulacion && (
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Candidato Asignado</span>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-muted-foreground mr-2" />
                      <span>{prueba.postulacion.candidato.nombre} {prueba.postulacion.candidato.apellido}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Tecnologías</span>
                  <div className="flex flex-wrap gap-2">
                    {prueba.tecnologias?.split(',').map((tecnologia: string, index: number) => (
                      <Badge key={index} variant="secondary" className="font-medium">
                        {tecnologia.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="text-lg font-medium mb-3">Instrucciones</h3>
                <p className="text-muted-foreground whitespace-pre-line">{prueba.instrucciones}</p>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="preguntas" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="preguntas">Preguntas</TabsTrigger>
              <TabsTrigger value="resultados">Resultados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preguntas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Preguntas de la Prueba</CardTitle>
                </CardHeader>
                <CardContent>
                  {prueba.preguntas && prueba.preguntas.length > 0 ? (
                    <div className="space-y-6">
                      {prueba.preguntas.map((pregunta: any, index: number) => (
                        <div key={pregunta.id} className="p-4 border rounded-lg mb-4 last:mb-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="rounded-full h-6 w-6 flex items-center justify-center p-0">
                                  {index + 1}
                                </Badge>
                                <h4 className="font-medium">
                                  {pregunta.tipoPregunta === "OPCION_MULTIPLE" ? "Opción Múltiple" :
                                   pregunta.tipoPregunta === "VERDADERO_FALSO" ? "Verdadero/Falso" :
                                   pregunta.tipoPregunta === "ABIERTA" ? "Abierta" :
                                   pregunta.tipoPregunta === "CODIGO" ? "Código" :
                                   pregunta.tipoPregunta === "TEORICA" ? "Teórica" :
                                   pregunta.tipoPregunta}
                                </h4>
                              </div>
                              <p className="mt-3">{pregunta.enunciado}</p>
                            </div>
                            <Badge className="whitespace-nowrap min-w-[80px] text-center">{pregunta.puntuacion || 0} puntos</Badge>
                          </div>
                          
                          {pregunta.opciones && (
                            <div className="mt-4 ml-8 p-3 bg-gray-50 rounded-md">
                              <h5 className="text-sm font-medium mb-2">Opciones:</h5>
                              <ul className="space-y-2">
                                {Array.isArray(pregunta.opciones) ? 
                                  pregunta.opciones.map((opcion: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2">
                                      <span className="inline-block w-5 h-5 rounded-full bg-gray-200 text-center text-xs leading-5">{i+1}</span>
                                      <span>{opcion}</span>
                                    </li>
                                  )) :
                                  typeof pregunta.opciones === 'string' ? 
                                    pregunta.opciones.split('|').map((opcion: string, i: number) => (
                                      <li key={i} className="flex items-center gap-2">
                                        <span className="inline-block w-5 h-5 rounded-full bg-gray-200 text-center text-xs leading-5">{i+1}</span>
                                        <span>{opcion.trim()}</span>
                                      </li>
                                    )) : null
                                }
                              </ul>
                            </div>
                          )}
                          
                          {pregunta.respuestaCorrecta && (
                            <div className="mt-3 ml-8 p-3 bg-green-50 border border-green-100 rounded-md">
                              <h5 className="text-sm font-medium text-green-700 mb-1">Respuesta Correcta:</h5>
                              <p className="text-sm text-green-600">{pregunta.respuestaCorrecta}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : prueba.preguntasTexto && prueba.preguntasTexto.length > 0 ? (
                    <div className="space-y-4">
                      {prueba.preguntasTexto.split('|||').map((pregunta: string, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="rounded-full h-6 w-6 flex items-center justify-center p-0">
                              {index + 1}
                            </Badge>
                            <h4 className="font-medium">Pregunta</h4>
                          </div>
                          <p className="ml-8">{pregunta}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No hay preguntas disponibles</h3>
                      <p className="text-muted-foreground mt-2 mb-6">
                        Esta prueba aún no tiene preguntas asociadas.
                      </p>
                      <Button className="mt-4" variant="outline" asChild>
                        <Link href={`/reclutador/pruebas/${id}/editar`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Prueba
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="resultados" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Resultados</CardTitle>
                    <CardDescription>Resumen de resultados de la prueba técnica</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/reclutador/pruebas/${id}/resultados`} className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      <span>Ver Detalle</span>
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="bg-blue-50 p-3 rounded-full mb-3">
                            <User className="h-8 w-8 text-blue-500" />
                          </div>
                          <h3 className="text-2xl font-semibold">{prueba.candidatosAsignados || 0}</h3>
                          <p className="text-sm text-muted-foreground mt-1">Candidatos Asignados</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="bg-green-50 p-3 rounded-full mb-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                          <h3 className="text-2xl font-semibold">{prueba.completadas || 0}</h3>
                          <p className="text-sm text-muted-foreground mt-1">Pruebas Completadas</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="bg-amber-50 p-3 rounded-full mb-3">
                            <BarChart3 className="h-8 w-8 text-amber-500" />
                          </div>
                          <h3 className="text-2xl font-semibold">{prueba.puntuacionPromedio || '-'}</h3>
                          <p className="text-sm text-muted-foreground mt-1">Puntuación Promedio</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {(!prueba.candidatosAsignados || prueba.candidatosAsignados === 0) && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="max-w-md mx-auto">
                        <h3 className="text-lg font-medium mb-2">Aún no hay resultados disponibles</h3>
                        <p className="text-muted-foreground mb-6">
                          Esta prueba no ha sido asignada a ningún candidato todavía.
                        </p>
                        <Button asChild>
                          <Link href={`/reclutador/pruebas/${id}/asignar`} className="flex items-center gap-1">
                            <Send className="h-4 w-4 mr-1" />
                            Asignar Prueba
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
} 
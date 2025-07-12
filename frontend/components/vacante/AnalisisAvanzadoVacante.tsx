"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BrainCircuit, 
  Sparkles, 
  Lightbulb, 
  Users, 
  AlertCircle, 
  ArrowUpRight,
  TrendingUp,
  CheckCircle,
  XCircle
} from "lucide-react";

import { iaService } from "@/services/iaService";
import { VacanteDetalleResponse } from "@/types/vacante";
import Link from "next/link";

interface AnalisisAvanzadoVacanteProps {
  vacante: VacanteDetalleResponse;
}

export function AnalisisAvanzadoVacante({ vacante }: AnalisisAvanzadoVacanteProps) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analisis, setAnalisis] = useState<any>(null);
  const [candidatosRecomendados, setCandidatosRecomendados] = useState<any[]>([]);

  useEffect(() => {
    const cargarAnalisis = async () => {
      try {
        setCargando(true);
        setError(null);
        
        // Cargar análisis de candidatos postulados
        const datosAnalisis = await iaService.analizarCandidatosPostulados(vacante.id);
        setAnalisis(datosAnalisis);
        
        // Cargar candidatos recomendados
        const recomendaciones = await iaService.recomendarCandidatos(vacante.id, 5);
        setCandidatosRecomendados(recomendaciones);
      } catch (err: any) {
        console.error("Error al cargar análisis avanzado:", err);
        setError(err.message || "Error al cargar el análisis avanzado");
      } finally {
        setCargando(false);
      }
    };
    
    if (vacante && vacante.id) {
      cargarAnalisis();
    }
  }, [vacante]);

  if (cargando) {
    return <AnalisisAvanzadoSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

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
              <div className="space-y-4">
                {candidatosRecomendados.length > 0 ? (
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
              <div className="space-y-4">
                {analisis && analisis.recomendaciones && analisis.recomendaciones.length > 0 ? (
                  analisis.recomendaciones.map((insight: string, index: number) => (
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
              <div className="space-y-6">
                {analisis && analisis.habilidadesRelevantes && analisis.habilidadesRelevantes.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Habilidades más relevantes</h3>
                      {analisis.habilidadesRelevantes.map((habilidad: string, index: number) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{habilidad}</span>
                            <Badge variant="outline" className="text-[10px]">Alta demanda</Badge>
                          </div>
                          <Progress value={90 - (index * 10)} className="h-2" />
                        </div>
                      ))}
                    </div>
                    
                    {analisis.habilidadesEscasas && analisis.habilidadesEscasas.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Habilidades escasas en el mercado</h3>
                        <div className="flex flex-wrap gap-2">
                          {analisis.habilidadesEscasas.map((habilidad: string, index: number) => (
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
                    
                    {analisis.habilidadesComplementarias && analisis.habilidadesComplementarias.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Habilidades complementarias recomendadas</h3>
                        <div className="flex flex-wrap gap-2">
                          {analisis.habilidadesComplementarias.map((habilidad: string, index: number) => (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalisisAvanzadoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-32" />
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={`skeleton-item-${i}`} className="rounded-lg border p-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
 
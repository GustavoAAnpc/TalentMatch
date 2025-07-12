"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MainNav } from "@/components/main-nav";
import { Footer } from "@/components/footer";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, Award, BadgeCheck, Brain, BrainCircuit, Check, CheckCircle2, File, FileText, HelpCircle, ListChecks, Lightbulb, SquareCode } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { authService } from "@/services/authService";
import { postulacionService } from "@/services/postulacionService";
import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { respuestaPruebaService } from "@/services/respuestaPruebaService";
import { PostulacionDetalleResponse } from "@/types/postulacion";
import { ResultadoPruebaTecnicaResponse, EvaluacionPreguntaResponse } from "@/types/pruebaTecnica";

export default function ResultadosPruebaPage() {
  const router = useRouter();
  const params = useParams();
  const postulacionId = Number.parseInt(params.id as string);
  
  // Estados para usuario y carga
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para datos
  const [postulacion, setPostulacion] = useState<PostulacionDetalleResponse | null>(null);
  const [resultado, setResultado] = useState<ResultadoPruebaTecnicaResponse | null>(null);
  const [pruebaId, setPruebaId] = useState<number | null>(null);
  
  // Cargar usuario al inicio
  useEffect(() => {
    const usuarioActual = authService.getUsuario();
    setUsuario(usuarioActual);
    
    if (!usuarioActual) {
      toast.error("Debes iniciar sesión para continuar");
      router.push("/login");
      return;
    }
    
    if (usuarioActual.rol !== "CANDIDATO") {
      toast.error("Solo los candidatos pueden ver estos resultados");
      router.push("/");
      return;
    }
  }, [router]);
  
  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario) return;
      
      try {
        setCargando(true);
        setError(null);
        
        // Cargar datos de la postulación
        const datosPostulacion = await postulacionService.obtenerPostulacion(postulacionId);
        setPostulacion(datosPostulacion);
        
        // Validar que la postulación pertenece al usuario actual
        if (datosPostulacion.candidato.id !== usuario.id) {
          toast.error("No tienes permiso para ver estos resultados");
          router.push("/dashboard/postulaciones");
          return;
        }
        
        // Buscar pruebas técnicas asociadas a esta postulación
        const pruebas = await pruebaTecnicaService.obtenerPruebasPorCandidato(usuario.id);
        const pruebaAsociada = pruebas.find(p => p.vacanteId === datosPostulacion.vacante.id);
        
        if (!pruebaAsociada) {
          toast.error("No hay prueba técnica asociada a esta postulación");
          router.push(`/postulacion/${postulacionId}/completar`);
          return;
        }
        
        // Si la prueba no está completada, redirigir
        if (!pruebaAsociada.completada) {
          toast.info("Aún no has completado la prueba técnica");
          router.push(`/postulacion/${postulacionId}/prueba-tecnica`);
          return;
        }
        
        // Guardar ID de la prueba
        setPruebaId(pruebaAsociada.id);
        
        // Cargar resultados
        const resultados = await respuestaPruebaService.obtenerResultado(pruebaAsociada.id, usuario.id);
        setResultado(resultados);
        
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("No se pudieron cargar los resultados de la prueba técnica. Inténtalo de nuevo.");
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [postulacionId, usuario, router]);
  
  // Formatear fecha
  const formatearFecha = (fechaString: string) => {
    const opciones: Intl.DateTimeFormatOptions = { 
      year: "numeric", 
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    };
    return new Date(fechaString).toLocaleDateString("es-ES", opciones);
  };
  
  if (cargando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-2">Cargando resultados...</h2>
          <p className="text-muted-foreground">Estamos obteniendo tus resultados y retroalimentación</p>
        </div>
      </div>
    );
  }
  
  if (error || !postulacion || !resultado) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || "No se pudieron cargar los resultados"}</p>
          <Button asChild>
            <Link href="/dashboard/postulaciones">Ver mis postulaciones</Link>
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
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="mb-6">
            <Link href="/dashboard/postulaciones" className="inline-flex items-center text-sm text-[#38bdf8] hover:underline">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver a mis postulaciones
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-[#0a192f]">Resultados de tu prueba técnica</h1>
            <p className="text-muted-foreground">
              Postulación para: <span className="font-medium text-foreground">{postulacion.vacante.titulo}</span>
            </p>
          </div>
          
          {/* Resumen de resultados */}
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <Card className="overflow-hidden">
              <div className={`p-6 text-white ${resultado.aprobada ? 'bg-green-600' : 'bg-amber-600'}`}>
                <div className="flex items-center gap-3">
                  {resultado.aprobada ? (
                    <Award className="h-8 w-8" />
                  ) : (
                    <HelpCircle className="h-8 w-8" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold mb-1">
                      {resultado.aprobada 
                        ? "¡Felicidades! Has aprobado la prueba técnica" 
                        : "Has completado la prueba técnica"}
                    </h2>
                    <p className="opacity-90">
                      {resultado.aprobada 
                        ? "Tu conocimiento técnico ha sido evaluado positivamente" 
                        : "Revisa la retroalimentación para mejorar tus habilidades"}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid gap-8 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#0a192f]">{Math.round(resultado.porcentajeAprobacion)}%</div>
                    <p className="text-sm text-muted-foreground">Puntuación total</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#0a192f]">{resultado.puntuacionTotal}</div>
                    <p className="text-sm text-muted-foreground">Puntos obtenidos</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#0a192f]">
                      {resultado.evaluacionesPregunta.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Preguntas respondidas</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Resultado</span>
                    <span className="text-sm font-bold">{Math.round(resultado.porcentajeAprobacion)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div 
                      className={`h-full rounded-full ${resultado.aprobada ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${resultado.porcentajeAprobacion}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <p className="text-sm">
                    Evaluación completada el {formatearFecha(resultado.fechaEvaluacion)}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-[#38bdf8]" />
                  Retroalimentación de IA
                </CardTitle>
                <CardDescription>
                  Análisis personalizado de tu desempeño
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-[#f8f9fc] p-4 border border-[#e4e7ec]">
                  <div className="flex gap-3 mb-3">
                    <Avatar className="h-8 w-8 bg-[#38bdf8]/20">
                      <AvatarImage src="/ai-assistant.png" alt="AI" />
                      <AvatarFallback>
                        <Brain className="h-5 w-5 text-[#38bdf8]" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Asistente de IA</p>
                      <p className="text-xs text-muted-foreground">Análisis técnico</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    {resultado.feedbackIA ? (
                      resultado.feedbackIA.split('\n').map((parrafo, index) => (
                        <p key={index}>{parrafo}</p>
                      ))
                    ) : (
                      <div className="text-muted-foreground italic">
                        No hay retroalimentación disponible de la IA para esta prueba.
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <p className="text-xs text-muted-foreground">
                      Esta retroalimentación está basada en tus respuestas y ha sido generada por IA.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Detalle de preguntas */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-[#0a192f] mb-4 flex items-center">
              <ListChecks className="h-5 w-5 mr-2 text-[#38bdf8]" />
              Detalle de preguntas y respuestas
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              {resultado.evaluacionesPregunta.map((evaluacion, index) => (
                <AccordionItem key={evaluacion.preguntaId} value={`pregunta-${evaluacion.preguntaId}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant="outline" 
                        className={`w-8 h-8 rounded-full flex items-center justify-center p-0 ${
                          evaluacion.puntuacionObtenida === evaluacion.puntuacionMaxima
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : evaluacion.puntuacionObtenida > 0
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                        }`}
                      >
                        {index + 1}
                      </Badge>
                      <div className="text-left">
                        <div className="font-medium truncate max-w-[500px]">
                          {evaluacion.enunciado}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {evaluacion.puntuacionObtenida} de {evaluacion.puntuacionMaxima} puntos
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pl-12">
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <SquareCode className="h-4 w-4 text-[#38bdf8]" />
                          Tu respuesta:
                        </h4>
                        <div className="rounded-md bg-gray-50 p-3 text-sm font-mono whitespace-pre-wrap">
                          {evaluacion.respuesta || "(Sin respuesta)"}
                        </div>
                      </div>
                      
                      {evaluacion.comentario && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            Retroalimentación:
                          </h4>
                          <div className="rounded-md bg-amber-50 p-3 text-sm">
                            {evaluacion.comentario}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm">Puntuación:</span>
                        <Badge 
                          className={
                            evaluacion.puntuacionObtenida === evaluacion.puntuacionMaxima
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : evaluacion.puntuacionObtenida > 0
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                                : 'bg-red-100 text-red-800 hover:bg-red-100'
                          }
                        >
                          {evaluacion.puntuacionObtenida}/{evaluacion.puntuacionMaxima}
                        </Badge>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          {/* Próximos pasos */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-[#0a192f] mb-4">Próximos pasos</h2>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#38bdf8] text-white font-medium">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium">Revisa la retroalimentación de la IA</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        La IA ha analizado tus respuestas y te ha proporcionado comentarios específicos para ayudarte a mejorar.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#38bdf8] text-white font-medium">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium">Espera la revisión del reclutador</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        El reclutador revisará tu prueba y tus resultados para tomar una decisión sobre tu candidatura.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#38bdf8] text-white font-medium">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium">Continúa mejorando tus habilidades</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Utiliza la retroalimentación para seguir mejorando en las áreas señaladas, independientemente del resultado.
                      </p>
                    </div>
                  </div>
                  
                  <Alert className={resultado.aprobada ? "bg-green-50 text-green-800 border-green-200" : "bg-amber-50 text-amber-800 border-amber-200"}>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>
                      {resultado.aprobada ? "¡Felicidades!" : "Gracias por completar la prueba"}
                    </AlertTitle>
                    <AlertDescription>
                      {resultado.aprobada 
                        ? "Has demostrado tus habilidades técnicas. El reclutador revisará tu prueba y te contactará para los siguientes pasos." 
                        : "Tus resultados han sido registrados. Te animamos a revisar la retroalimentación para mejorar tus habilidades."}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 flex justify-center">
              <Button asChild className="bg-[#38bdf8] hover:bg-[#0ea5e9]">
                <Link href="/dashboard/postulaciones">
                  Volver a mis postulaciones
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MainNav } from "@/components/main-nav";
import { Footer } from "@/components/footer";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, ArrowRight, Brain, BrainCircuit, Check, Clock, FileClock, FileCheck, FileWarning, HelpCircle, Timer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { authService } from "@/services/authService";
import { postulacionService } from "@/services/postulacionService";
import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { respuestaPruebaService } from "@/services/respuestaPruebaService";
import { PostulacionDetalleResponse } from "@/types/postulacion";
import { PruebaTecnicaDetalleResponse, PreguntaResponse, RespuestaPreguntaRequest } from "@/types/pruebaTecnica";

export default function PruebaTecnicaPage() {
  const router = useRouter();
  const params = useParams();
  const postulacionId = Number.parseInt(params.id as string);
  
  // Estados para usuario y carga
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para datos de la prueba
  const [postulacion, setPostulacion] = useState<PostulacionDetalleResponse | null>(null);
  const [prueba, setPrueba] = useState<PruebaTecnicaDetalleResponse | null>(null);
  const [respuestas, setRespuestas] = useState<Map<number, string>>(new Map());
  const [preguntaActual, setPreguntaActual] = useState<number>(0);
  
  // Estados para el temporizador
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);
  const [tiempoInicio, setTiempoInicio] = useState<Date | null>(null);
  const [advertenciaTiempo, setAdvertenciaTiempo] = useState<boolean>(false);
  
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
      toast.error("Solo los candidatos pueden realizar pruebas técnicas");
      router.push("/");
      return;
    }
  }, [router]);
  
  // Cargar datos de la postulación y prueba técnica
  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario) return;
      
      try {
        setCargando(true);
        setError(null);
        
        // Cargar datos de la postulación
        const datosPostulacion = await postulacionService.obtenerPostulacion(postulacionId);
        setPostulacion(datosPostulacion);
        console.log("Datos de postulación cargados:", datosPostulacion);
        
        // Validar que la postulación pertenece al usuario actual
        if (datosPostulacion.candidato.id !== usuario.id) {
          toast.error("No tienes permiso para acceder a esta prueba");
          router.push("/dashboard/postulaciones");
          return;
        }
        
        // Intentar obtener la prueba técnica directamente por postulación
        let pruebaAsociada = null;
        try {
          console.log("Intentando obtener prueba técnica por postulación ID:", postulacionId);
          pruebaAsociada = await pruebaTecnicaService.obtenerPruebaPorPostulacion(postulacionId);
          console.log("Prueba obtenida por postulación:", pruebaAsociada);
        } catch (error) {
          console.warn("Error al obtener prueba por postulación:", error);
          // Continuar con el flujo alternativo
        }
        
        // Si no se encuentra por postulación, buscar por candidato y vacante
        if (!pruebaAsociada) {
          console.log("Buscando prueba por candidato y vacante...");
          try {
            const pruebas = await pruebaTecnicaService.obtenerPruebasPorCandidato(usuario.id);
            console.log("Pruebas técnicas del candidato:", pruebas);
            console.log("ID de la vacante a buscar:", datosPostulacion.vacante.id);
            
            if (pruebas && pruebas.length > 0) {
              // Buscar prueba por vacanteId
              pruebaAsociada = pruebas.find(p => p.vacanteId === datosPostulacion.vacante.id);
              
              // Si no se encuentra, intentar buscar por ID numérico
              if (!pruebaAsociada) {
                console.log("Intentando buscar por ID numérico...");
                pruebaAsociada = pruebas.find(p => Number(p.vacanteId) === Number(datosPostulacion.vacante.id));
              }
              
              // Si aún no se encuentra, buscar por nombre de vacante
              if (!pruebaAsociada && datosPostulacion.vacante.titulo) {
                console.log("Intentando buscar por título de vacante...");
                pruebaAsociada = pruebas.find(p => 
                  p.vacanteNombre && 
                  p.vacanteNombre.toLowerCase() === datosPostulacion.vacante.titulo.toLowerCase()
                );
              }
              
              console.log("Prueba asociada encontrada:", pruebaAsociada);
            } else {
              console.warn("No se encontraron pruebas técnicas para el candidato");
            }
          } catch (error) {
            console.error("Error al buscar pruebas por candidato:", error);
          }
        }
        
        // Si no se encontró ninguna prueba, intentar buscar pruebas para la vacante
        if (!pruebaAsociada) {
          try {
            console.log("Buscando pruebas técnicas para la vacante:", datosPostulacion.vacante.id);
            const pruebasVacante = await pruebaTecnicaService.obtenerPruebasPorVacante(datosPostulacion.vacante.id);
            
            if (pruebasVacante && pruebasVacante.length > 0) {
              console.log("Pruebas encontradas para la vacante:", pruebasVacante);
              // Asignar la primera prueba al candidato
              const pruebaParaAsignar = pruebasVacante[0];
              
              try {
                // Mostrar mensaje de carga
                toast.loading("Asignando prueba técnica...");
                
                // Verificar si tenemos el ID del reclutador
                let reclutadorId = datosPostulacion.vacante.reclutador?.id;
                
                // Si no tenemos el ID del reclutador, usar el ID del usuario actual como fallback
                if (!reclutadorId) {
                  console.log("No se encontró ID del reclutador en la vacante, usando ID del usuario como fallback");
                  reclutadorId = usuario.id;
                }
                
                // Asignar la prueba a la postulación
                await pruebaTecnicaService.asignarPruebaACandidato(
                  pruebaParaAsignar.id, 
                  usuario.id, 
                  reclutadorId
                );
                
                toast.success("Prueba técnica asignada correctamente");
                
                // Recargar la página para obtener la prueba recién asignada
                window.location.reload();
                return;
              } catch (error) {
                console.error("Error al asignar la prueba al candidato:", error);
              }
            } else {
              console.warn("No se encontraron pruebas técnicas para la vacante");
            }
          } catch (error) {
            console.error("Error al buscar pruebas por vacante:", error);
          }
        }
        
        // Si aún no hay prueba, mostrar mensaje de error
        if (!pruebaAsociada) {
          let mensaje = "No hay prueba técnica disponible para esta postulación.";
          
          // Verificar si la vacante requiere prueba técnica
          if (datosPostulacion.vacante && datosPostulacion.vacante.requierePrueba === false) {
            mensaje = "Esta vacante no requiere prueba técnica. Puedes continuar con el proceso de postulación.";
          } else {
            mensaje = "No hay prueba técnica disponible en este momento. Por favor, contacta al reclutador o intenta más tarde.";
          }
          
          console.error(mensaje);
          setError(mensaje);
          toast.error(mensaje);
          // No redirigir automáticamente para permitir ver el mensaje de error
          return;
        }
        
        // Si la prueba ya fue completada, redirigir a los resultados
        if (pruebaAsociada.completada) {
          console.log("La prueba ya fue completada, redirigiendo a resultados");
          toast.info("Esta prueba ya ha sido completada. Redirigiendo a los resultados...");
          router.push(`/postulacion/${postulacionId}/resultados`);
          return;
        }
        
        // Cargar detalles de la prueba técnica
        try {
          const datosPrueba = await pruebaTecnicaService.obtenerPruebaPorId(pruebaAsociada.id);
          setPrueba(datosPrueba);
          console.log("Detalles de la prueba cargados:", datosPrueba);
          
          // Iniciar el temporizador si hay límite de tiempo
          if (datosPrueba.tiempoLimiteMinutos) {
            setTiempoRestante(datosPrueba.tiempoLimiteMinutos * 60); // Convertir minutos a segundos
            setTiempoInicio(new Date());
          }
        } catch (error) {
          console.error("Error al cargar detalles de la prueba:", error);
          setError("No se pudieron cargar los detalles de la prueba técnica.");
          toast.error("Error al cargar los detalles de la prueba técnica.");
        }
        
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("No se pudieron cargar los datos de la prueba técnica. Inténtalo de nuevo.");
        toast.error("Error al cargar los datos. Por favor, inténtalo de nuevo.");
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [postulacionId, usuario, router]);
  
  // Manejar temporizador
  useEffect(() => {
    if (!tiempoRestante || !prueba || cargando) return;
    
    const intervalo = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(intervalo);
          
          // Si el tiempo se agota, enviar las respuestas automáticamente
          if (prev === 0) {
            toast.warning("El tiempo ha terminado. Se enviarán tus respuestas actuales.");
            enviarRespuestas();
          }
          
          return 0;
        }
        
        // Mostrar advertencia cuando queden 5 minutos
        if (prev === 300) {
          setAdvertenciaTiempo(true);
          toast.warning("¡Te quedan 5 minutos para completar la prueba!", {
            duration: 10000
          });
        }
        
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(intervalo);
  }, [tiempoRestante, prueba, cargando]);
  
  // Función para preparar las opciones de una pregunta
  const prepararOpciones = (pregunta: any): string[] => {
    if (!pregunta || !pregunta.opciones) return [];
    
    if (Array.isArray(pregunta.opciones)) {
      return pregunta.opciones;
    }
    
    if (typeof pregunta.opciones === 'string' && pregunta.opciones.trim() !== '') {
      return pregunta.opciones.split('|').map((o: string) => o.trim());
    }
    
    return [];
  };
  
  // Formatear tiempo
  const formatearTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs < 10 ? '0' + segs : segs}`;
  };
  
  // Manejar cambio de respuesta
  const manejarRespuesta = (preguntaId: number, respuesta: string) => {
    const nuevasRespuestas = new Map(respuestas);
    nuevasRespuestas.set(preguntaId, respuesta);
    setRespuestas(nuevasRespuestas);
  };
  
  // Navegar a la siguiente pregunta
  const siguientePregunta = () => {
    if (!prueba) return;
    if (preguntaActual < prueba.preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Navegar a la pregunta anterior
  const preguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Enviar todas las respuestas
  const enviarRespuestas = async () => {
    if (!prueba || !usuario) return;
    
    try {
      setEnviando(true);
      
      // Verificar si se han respondido todas las preguntas
      const preguntasSinResponder = prueba.preguntas.filter(p => !respuestas.has(p.id));
      
      if (preguntasSinResponder.length > 0 && !window.confirm(
        `Tienes ${preguntasSinResponder.length} pregunta(s) sin responder. ¿Estás seguro de que deseas enviar la prueba?`
      )) {
        setEnviando(false);
        return;
      }
      
      // Preparar datos para envío
      const respuestasArray: RespuestaPreguntaRequest[] = Array.from(respuestas.entries()).map(([preguntaId, respuesta]) => ({
        preguntaId,
        respuesta
      }));
      
      // Enviar las respuestas
      await respuestaPruebaService.enviarRespuestas({
        candidatoId: usuario.id,
        pruebaTecnicaId: prueba.id,
        respuestas: respuestasArray
      });
      
      // Marcar la prueba como completada
      await respuestaPruebaService.completarPrueba(prueba.id, usuario.id);
      
      toast.success("¡Prueba técnica completada con éxito!");
      
      // Redirigir a la página de resultados
      router.push(`/postulacion/${postulacionId}/resultados`);
      
    } catch (error) {
      console.error("Error al enviar respuestas:", error);
      toast.error("Hubo un error al enviar tus respuestas. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };
  
  // Verificar si la pregunta actual tiene respuesta
  const tieneRespuesta = (preguntaId: number) => respuestas.has(preguntaId);
  
  // Calcular porcentaje de progreso
  const calcularProgreso = () => {
    if (!prueba) return 0;
    return (respuestas.size / prueba.preguntas.length) * 100;
  };
  
  if (cargando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-2">Cargando prueba técnica...</h2>
          <p className="text-muted-foreground">Estamos preparando tus preguntas</p>
        </div>
      </div>
    );
  }
  
  if (error || !postulacion || !prueba) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">No se pudo cargar la prueba técnica</h2>
          <p className="text-muted-foreground mb-6">{error || "No hay prueba técnica disponible para esta postulación en este momento."}</p>
          
          {postulacion && postulacion.vacante && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Información de la vacante</h3>
              <p className="text-sm text-blue-700 mb-1">
                <strong>Título:</strong> {postulacion.vacante.titulo}
              </p>
              <p className="text-sm text-blue-700 mb-1">
                <strong>Empresa:</strong> {postulacion.vacante.empresa || "No especificada"}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Área:</strong> {postulacion.vacante.area || "No especificada"}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-4">
            <Button asChild>
              <Link href="/dashboard/postulaciones">Ver mis postulaciones</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/postulacion/${postulacionId}/completar`}>
                Volver a la postulación
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Obtener la pregunta actual
  const pregunta = prueba.preguntas[preguntaActual];
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center">
          <MainNav />
          {tiempoRestante !== null && (
            <div className={`ml-auto flex items-center gap-2 ${tiempoRestante < 300 ? 'text-red-500' : ''}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatearTiempo(tiempoRestante)}</span>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link href="/dashboard/postulaciones" className="inline-flex items-center text-sm text-[#38bdf8] hover:underline">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Volver a mis postulaciones
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-[#0a192f]">{prueba.titulo}</h1>
            </div>
            
            <Badge 
              variant="outline" 
              className="bg-[#38bdf8]/10 text-[#38bdf8] flex items-center gap-1"
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              {prueba.nivelDificultad || "Intermedio"}
            </Badge>
          </div>
          
          {/* Instrucciones y progreso */}
          <div className="mb-6 grid gap-6 md:grid-cols-[2fr_1fr]">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Instrucciones</Badge>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {prueba.instrucciones ||
                      "Lee atentamente cada pregunta y proporciona tu mejor respuesta. Puedes navegar entre preguntas libremente."}
                  </div>
                </div>
                
                {tiempoRestante !== null && (
                  <div className="mb-4">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Tiempo</Badge>
                    <div className="mt-2 text-sm flex items-center gap-2">
                      <Timer className="h-4 w-4 text-[#38bdf8]" />
                      <span>
                        Tienes {prueba.tiempoLimiteMinutos} minutos para completar esta prueba. 
                        Tiempo restante: <span className={tiempoRestante < 300 ? "font-bold text-red-500" : "font-bold"}>
                          {formatearTiempo(tiempoRestante)}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
                
                {advertenciaTiempo && tiempoRestante && tiempoRestante < 300 && (
                  <Alert variant="destructive" className="mb-4">
                    <FileWarning className="h-4 w-4" />
                    <AlertTitle>¡Tiempo limitado!</AlertTitle>
                    <AlertDescription>
                      Te quedan menos de 5 minutos para completar la prueba. Tus respuestas se enviarán automáticamente cuando el tiempo termine.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Tecnologías</Badge>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {prueba.tecnologias?.split(',').map((tec, index) => (
                      <Badge key={index} variant="outline" className="bg-[#38bdf8]/5">
                        {tec.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-[#38bdf8]" />
                  Tu progreso
                </CardTitle>
                <CardDescription>
                  Has respondido {respuestas.size} de {prueba.preguntas.length} preguntas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Progress value={calcularProgreso()} className="h-2" />
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {prueba.preguntas.map((p, index) => (
                    <Button
                      key={p.id}
                      variant={tieneRespuesta(p.id) ? "default" : "outline"}
                      className={`w-9 h-9 p-0 ${preguntaActual === index ? 'border-2 border-[#38bdf8]' : ''}`}
                      onClick={() => setPreguntaActual(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Pregunta actual */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>Pregunta {preguntaActual + 1}/{prueba.preguntas.length}</span>
                  {tieneRespuesta(pregunta.id) && <Check className="h-5 w-5 text-green-500" />}
                </CardTitle>
                <Badge variant="outline">{pregunta.tipoPregunta || "Abierta"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 prose max-w-none">
                <h3 className="text-lg font-medium mb-4 p-4 bg-[#f8fafc] border-l-4 border-[#38bdf8] rounded-md">{pregunta.enunciado}</h3>
                {pregunta.tipoPregunta === "OPCION_MULTIPLE" && pregunta.opciones && (
                  <RadioGroup 
                    value={respuestas.get(pregunta.id) || ""}
                    onValueChange={(value) => manejarRespuesta(pregunta.id, value)}
                    className="mt-4 space-y-2 p-4 bg-white border border-gray-200 rounded-md"
                  >
                    <div className="space-y-3">
                      {prepararOpciones(pregunta).map((opcion: string, index: number) => (
                        <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
                          <RadioGroupItem value={opcion} id={`opcion-${index}`} />
                          <Label htmlFor={`opcion-${index}`} className="cursor-pointer">{opcion}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
                
                {(!pregunta.tipoPregunta || pregunta.tipoPregunta === "ABIERTA" || pregunta.tipoPregunta === "TEORICA") && (
                  <div className="mt-6">
                    <Label htmlFor={`respuesta-${pregunta.id}`} className="block mb-2 font-medium">
                      Tu respuesta:
                    </Label>
                    <Textarea 
                      id={`respuesta-${pregunta.id}`}
                      placeholder="Escribe tu respuesta aquí..."
                      value={respuestas.get(pregunta.id) || ""}
                      onChange={(e) => manejarRespuesta(pregunta.id, e.target.value)}
                      rows={10}
                      className="resize-y w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#38bdf8] focus:border-[#38bdf8]"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Escribe una respuesta detallada. Puedes usar múltiples párrafos.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="ghost"
                onClick={preguntaAnterior}
                disabled={preguntaActual === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
              </Button>
              
              {preguntaActual < prueba.preguntas.length - 1 ? (
                <Button
                  onClick={siguientePregunta}
                >
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={enviarRespuestas}
                  disabled={enviando}
                  className="bg-[#38bdf8] hover:bg-[#0ea5e9] min-w-[250px] py-6 text-lg font-medium shadow-lg transition-all hover:shadow-xl"
                >
                  {enviando ? (
                    <div className="flex items-center gap-2">
                      <span className="animate-spin">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5" />
                      <span>Finalizar y enviar ({respuestas.size}/{prueba.preguntas.length})</span>
                    </div>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Botón finalizar */}
          <div className="flex justify-center mb-8">
            <Button
              onClick={enviarRespuestas}
              disabled={enviando || respuestas.size === 0}
              className="bg-[#38bdf8] hover:bg-[#0ea5e9] min-w-[250px] py-6 text-lg font-medium shadow-lg transition-all hover:shadow-xl"
            >
              {enviando ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  <span>Enviando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  <span>Finalizar y enviar ({respuestas.size}/{prueba.preguntas.length})</span>
                </div>
              )}
            </Button>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">
              No te preocupes si no puedes terminar ahora. Tus respuestas se guardarán automáticamente y podrás continuar más tarde.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 
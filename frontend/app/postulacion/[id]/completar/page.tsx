"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MainNav } from "@/components/main-nav";
import { Footer } from "@/components/footer";
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, FileText, FilePlus, PenLine, Send } from "lucide-react";

import { authService } from "@/services/authService";
import { postulacionService } from "@/services/postulacionService";
import { vacanteService } from "@/services/vacanteService";
import { PostulacionDetalleResponse } from "@/types/postulacion";
import { VacanteDetalleResponse } from "@/types/vacante";
import { Separator } from "@/components/ui/separator";

export default function CompletarPostulacionPage() {
  const router = useRouter();
  const params = useParams();
  const postulacionId = typeof params.id === 'string' ? parseInt(params.id) : 0;
  
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postulacion, setPostulacion] = useState<PostulacionDetalleResponse | null>(null);
  const [vacante, setVacante] = useState<VacanteDetalleResponse | null>(null);
  const [cartaPresentacion, setCartaPresentacion] = useState("");
  
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
      toast.error("Solo los candidatos pueden completar postulaciones");
      router.push("/");
      return;
    }
  }, [router]);
  
  // Cargar datos de la postulación
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
          toast.error("No tienes permiso para ver esta postulación");
          router.push("/dashboard/postulaciones");
          return;
        }
        
        // Cargar datos de la vacante
        const datosVacante = await vacanteService.obtenerVacantePorId(datosPostulacion.vacante.id);
        setVacante(datosVacante);
        
        // Depuración - Verificar si requierePrueba está presente
        console.log("Datos de la vacante:", datosVacante);
        console.log("¿Requiere prueba?:", datosVacante.requierePrueba);
        
        // Si ya tiene carta de presentación, mostrarla
        if (datosPostulacion.cartaPresentacion) {
          setCartaPresentacion(datosPostulacion.cartaPresentacion);
        }
        
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("No se pudieron cargar los datos de la postulación. Inténtalo de nuevo.");
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [postulacionId, usuario, router]);
  
  // Función para enviar la carta de presentación
  const enviarCartaPresentacion = async () => {
    if (!postulacion || !usuario) return;
    
    try {
      setEnviando(true);
      
      // Actualizar postulación con la carta de presentación
      await postulacionService.actualizarCartaPresentacion(postulacionId, cartaPresentacion);
      
      toast.success("Carta de presentación guardada con éxito");
      
      // Depuración - Verificar el valor de requierePrueba antes de la redirección
      console.log("Antes de redireccionar - Vacante:", vacante);
      console.log("Antes de redireccionar - ¿Requiere prueba?:", vacante?.requierePrueba);
      
      // MODIFICACIÓN TEMPORAL: Forzar redirección a la prueba técnica para pruebas
      // Comentar esta sección y descomentar la siguiente para volver al comportamiento normal
      console.log("Redirigiendo a prueba técnica (forzado para pruebas)");
      router.push(`/postulacion/${postulacionId}/prueba-tecnica`);
      
      /* COMPORTAMIENTO NORMAL - Descomentar para restaurar
      // Redirigir a la prueba técnica o a la página de postulaciones
      // Verificar explícitamente si requierePrueba es true, considerando null como false
      if (vacante && vacante.requierePrueba === true) {
        console.log("Redirigiendo a prueba técnica");
        router.push(`/postulacion/${postulacionId}/prueba-tecnica`);
      } else {
        console.log("Redirigiendo a dashboard de postulaciones");
        toast.success("¡Postulación completada con éxito!");
        router.push("/dashboard/postulaciones");
      }
      */
      
    } catch (error) {
      console.error("Error al enviar carta de presentación:", error);
      toast.error("Hubo un error al guardar tu carta de presentación. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };
  
  // Formatear fecha
  const formatearFecha = (fechaString: string) => {
    const opciones: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return new Date(fechaString).toLocaleDateString("es-ES", opciones);
  };
  
  if (cargando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-2">Cargando datos...</h2>
          <p className="text-muted-foreground">Estamos preparando tu postulación</p>
        </div>
      </div>
    );
  }
  
  if (error || !postulacion || !vacante) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || "No se pudo cargar la postulación"}</p>
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
      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="mb-6">
            <Link href="/dashboard/postulaciones" className="inline-flex items-center text-sm text-[#38bdf8] hover:underline">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver a mis postulaciones
            </Link>
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0a192f]">Completar postulación</h1>
            <p className="mt-2 text-muted-foreground">Complete los detalles necesarios para enviar tu postulación a {vacante.titulo}</p>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Contenido principal */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenLine className="h-5 w-5 text-[#38bdf8]" />
                    Carta de presentación
                  </CardTitle>
                  <CardDescription>
                    Escribe una carta de presentación para destacar por qué eres el candidato ideal para esta vacante.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Escribe aquí tu carta de presentación..."
                    value={cartaPresentacion}
                    onChange={(e) => setCartaPresentacion(e.target.value)}
                    rows={10}
                    className="resize-y"
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    Una buena carta de presentación puede aumentar significativamente tus posibilidades de ser seleccionado.
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={enviarCartaPresentacion}
                    disabled={enviando || !cartaPresentacion.trim()}
                    className="bg-[#38bdf8] hover:bg-[#0ea5e9]"
                  >
                    {enviando ? "Enviando..." : "Guardar y continuar"} 
                    {!enviando && <ChevronRight className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
              
              <div className="rounded-lg border p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#38bdf8]" /> 
                  Información importante
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tu postulación a <strong>{vacante.titulo}</strong> pasará por un proceso de selección que incluye:
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#38bdf8]/10 text-[#38bdf8] font-medium">1</div>
                    <div>
                      <p className="font-medium">Revisión de tu perfil</p>
                      <p className="text-sm text-muted-foreground">El reclutador revisará tu perfil y carta de presentación</p>
                    </div>
                  </div>
                  
                  {vacante.requierePrueba === true && (
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#38bdf8]/10 text-[#38bdf8] font-medium">2</div>
                      <div>
                        <p className="font-medium">Prueba técnica</p>
                        <p className="text-sm text-muted-foreground">Deberás completar una prueba técnica para evaluar tus habilidades</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#38bdf8]/10 text-[#38bdf8] font-medium">{vacante.requierePrueba === true ? 3 : 2}</div>
                    <div>
                      <p className="font-medium">Entrevista</p>
                      <p className="text-sm text-muted-foreground">Si eres preseleccionado, se te contactará para una entrevista</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detalles de la vacante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">{vacante.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{vacante.area || "Sin área especificada"}</p>
                    <div className="mt-2 flex items-center text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                      Publicada el {formatearFecha(vacante.fechaPublicacion)}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Ubicación:</span> {vacante.ubicacion || "No especificada"}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Modalidad:</span> {vacante.modalidad || "No especificada"}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Tipo de contrato:</span> {vacante.tipoContrato || "No especificado"}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FilePlus className="h-4 w-4" />
                    Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Puedes adjuntar documentos adicionales a tu postulación:
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" disabled={enviando}>
                      <FileText className="h-4 w-4 mr-2" />
                      Adjuntar CV actualizado
                    </Button>
                    <Button variant="outline" className="w-full justify-start" disabled={enviando}>
                      <FileText className="h-4 w-4 mr-2" />
                      Adjuntar otro documento
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Podrás adjuntar documentos después de completar tu carta de presentación.
                  </p>
                </CardContent>
              </Card>
              
              <div className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Send className="h-5 w-5 text-[#38bdf8] mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">¿No puedes completar ahora?</p>
                    <p className="text-muted-foreground mt-1">
                      No te preocupes, puedes volver a completar tu postulación más tarde desde la sección "Mis postulaciones" en tu panel de control.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 
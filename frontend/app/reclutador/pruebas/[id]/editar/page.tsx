"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  Save,
  Loader2,
  FileEdit,
  RefreshCw,
  Plus,
  BrainCircuit,
  CheckCircle,
  AlertTriangle,
  Pencil,
  X,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { vacanteService } from "@/services/vacanteService";
import { authService } from "@/services/authService";
import { EditarPreguntaModal } from "@/components/pruebas/EditarPreguntaModal";

export default function EditarPruebaTecnicaPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  
  // Estados para controlar la carga y errores
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [regenerando, setRegenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vacantes, setVacantes] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [prueba, setPrueba] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("general");
  
  // Estados para el modal de editar pregunta
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState<any>(null);
  
  // Nuevo estado para almacenar las preguntas editadas en memoria
  const [preguntasEditadas, setPreguntasEditadas] = useState<any[]>([]);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);
  
  // Configuración de la prueba técnica
  const [formData, setFormData] = useState({
    vacanteId: "",
    titulo: "",
    descripcion: "",
    instrucciones: "",
    tiempoLimiteMinutos: 60,
    nivelDificultad: "INTERMEDIO",
    tecnologias: "",
    numPreguntas: "5"
  });

  // Estados para el diálogo de confirmación
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [dialogoConfig, setDialogoConfig] = useState<{
    titulo: string;
    descripcion: string;
    accion: () => void;
  }>({
    titulo: "",
    descripcion: "",
    accion: () => {}
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null);
        
        // Obtener el usuario actual
        const userData = authService.getUsuario();
        setUsuario(userData);
        
        // Verificar que es un reclutador
        if (userData.rol !== "RECLUTADOR" && userData.rol !== "ADMINISTRADOR") {
          throw new Error("No tienes permisos para editar pruebas técnicas.");
        }
        
        // Obtener las vacantes del reclutador
        const vacantesData = await vacanteService.obtenerVacantesReclutador(userData.id);
        setVacantes(vacantesData);
        
        // Obtener la prueba técnica
        const pruebaData = await pruebaTecnicaService.obtenerPruebaPorId(id);
        
        // Normalizar tipos de preguntas y formato de opciones
        if (pruebaData.preguntas && pruebaData.preguntas.length > 0) {
          pruebaData.preguntas.forEach((pregunta: any) => {
            // Asegurar que tipoPregunta sea uno de los valores permitidos
            if (pregunta.tipoPregunta === "DESARROLLO") {
              pregunta.tipoPregunta = "ABIERTA";
            } else if (pregunta.tipoPregunta === "THEORY" || pregunta.tipoPregunta === "PROJECT" || !["ABIERTA", "OPCION_MULTIPLE", "VERDADERO_FALSO", "CODIGO", "TEORICA"].includes(pregunta.tipoPregunta)) {
              pregunta.tipoPregunta = "TEORICA";
            }
            
            // Asegurar que opciones sea string
            if (pregunta.opciones && Array.isArray(pregunta.opciones)) {
              pregunta.opciones = pregunta.opciones.join('|');
            }
          });
        }
        
        setPrueba(pruebaData);
        
        // Actualizar el formulario con los datos de la prueba
        setFormData({
          vacanteId: pruebaData.vacanteId ? pruebaData.vacanteId.toString() : "0",
          titulo: pruebaData.titulo || "",
          descripcion: pruebaData.descripcion || "",
          instrucciones: pruebaData.instrucciones || "",
          tiempoLimiteMinutos: pruebaData.tiempoLimiteMinutos || 60,
          nivelDificultad: pruebaData.nivelDificultad || "INTERMEDIO",
          tecnologias: pruebaData.tecnologias || "",
          numPreguntas: "5"
        });
        
        // Actualizar las preguntas editadas
        if (pruebaData.preguntas && pruebaData.preguntas.length > 0) {
          setPreguntasEditadas(pruebaData.preguntas);
        }
        
      } catch (error: any) {
        console.error("Error al cargar los datos:", error);
        setError(error.message || "Error al cargar los datos. Intente nuevamente.");
      } finally {
        setCargando(false);
      }
    };
    
    if (id) {
      cargarDatos();
    }
  }, [id, router]);

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambios en selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Manejar cambio en número
  const handleNumberChange = (name: string, value: string) => {
    // Permitir que el campo esté vacío temporalmente durante la edición
    if (value === '') {
      setFormData({
        ...formData,
        [name]: ''
      });
      return;
    }
    
    // Convertir a número entero si es posible
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setFormData({
        ...formData,
        [name]: numValue
      });
    }
  };

  // Actualizar prueba técnica
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setEnviando(true);
      
      if (!usuario || !usuario.id) {
        toast.error("No se pudo identificar al usuario");
        return;
      }
      
      // Validar tiempo límite
      let tiempoLimite = parseInt(formData.tiempoLimiteMinutos.toString());
      if (isNaN(tiempoLimite) || tiempoLimite < 15) {
        tiempoLimite = 15; // Valor mínimo predeterminado
      } else if (tiempoLimite > 180) {
        tiempoLimite = 180; // Valor máximo predeterminado
      }
      
      const pruebaData = {
        postulacionId: null,
        vacanteId: formData.vacanteId && formData.vacanteId !== "0" ? parseInt(formData.vacanteId) : null,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        instrucciones: formData.instrucciones,
        tiempoLimiteMinutos: tiempoLimite,
        nivelDificultad: formData.nivelDificultad,
        tecnologias: formData.tecnologias
      };
      
      // Actualizar prueba técnica
      await pruebaTecnicaService.actualizarPruebaTecnica(id, usuario.id, pruebaData);
      
      // Recargar los datos para asegurar que la prueba tenga la vacante correctamente asociada
      const pruebaActualizada = await pruebaTecnicaService.obtenerPruebaPorId(id);
      setPrueba(pruebaActualizada);
      
      toast.success("Prueba técnica actualizada con éxito");
      
      // Quedarse en la página actual en lugar de redireccionar para permitir regenerar preguntas
      // router.push("/reclutador/pruebas");
      
    } catch (error) {
      console.error("Error al actualizar la prueba técnica:", error);
      toast.error("Error al actualizar la prueba técnica");
    } finally {
      setEnviando(false);
    }
  };

  // Mostrar diálogo de confirmación
  const mostrarDialogoConfirmacion = (titulo: string, descripcion: string, accion: () => void) => {
    setDialogoConfig({
      titulo,
      descripcion,
      accion
    });
    setDialogoAbierto(true);
  };

  // Función para validar y ajustar puntuaciones
  const validarYAjustarPuntuaciones = async (preguntas: any[]) => {
    // Calcular la suma total de puntos
    const totalPuntos = preguntas.reduce((sum: number, pregunta: any) => sum + (pregunta.puntuacion || 0), 0);
    
    // Mostrar un mensaje informativo sobre el total actual
    toast.info(`Puntuación total actual: ${totalPuntos}/100 puntos`);
    
    // Si el total no es 100, preguntar al usuario si desea ajustar
    if (totalPuntos !== 100 && preguntas.length > 0) {
      // Usar el diálogo de confirmación en lugar de window.confirm
      mostrarDialogoConfirmacion(
        "Ajustar puntuaciones",
        `La puntuación total es de ${totalPuntos} puntos, pero debería ser 100. ¿Deseas ajustar automáticamente las puntuaciones para que sean múltiplos de 5 y sumen 100 puntos?`,
        async () => {
          // Distribuir 100 puntos en múltiplos de 5 entre las preguntas
          const preguntasAjustadas = distribuirPuntuacionesMultiplosDe5(preguntas);
          
          // Actualizar cada pregunta en el servidor
          try {
            for (const pregunta of preguntasAjustadas) {
              if (pregunta.puntuacion !== preguntas.find(p => p.id === pregunta.id)?.puntuacion) {
                await pruebaTecnicaService.actualizarPregunta(
                  pregunta.id,
                  usuario.id,
                  {
                    enunciado: pregunta.enunciado,
                    tipoPregunta: pregunta.tipoPregunta,
                    opciones: pregunta.opciones,
                    respuestaCorrecta: pregunta.respuestaCorrecta,
                    puntuacion: pregunta.puntuacion,
                    pruebaTecnicaId: pregunta.pruebaTecnicaId || id
                  }
                );
              }
            }
            
            // Recargar la prueba para mostrar las puntuaciones actualizadas
            const pruebaActualizada = await pruebaTecnicaService.obtenerPruebaPorId(id);
            setPrueba(pruebaActualizada);
            toast.success("Puntuaciones ajustadas para sumar 100 puntos en múltiplos de 5");
          } catch (error) {
            console.error("Error al ajustar puntuaciones:", error);
            toast.error("Error al ajustar puntuaciones de las preguntas");
          }
        }
      );
    }
  };

  // Función para distribuir puntuaciones en múltiplos de 5 sumando 100
  const distribuirPuntuacionesMultiplosDe5 = (preguntas: any[]): any[] => {
    const numPreguntas = preguntas.length;
    
    // Si no hay preguntas, devolver array vacío
    if (numPreguntas === 0) return [];
    
    // Si solo hay una pregunta, asignar 100 puntos
    if (numPreguntas === 1) {
      return [{ ...preguntas[0], puntuacion: 100 }];
    }
    
    // Copia de las preguntas para trabajar
    let preguntasAjustadas = [...preguntas];
    
    // Calcular el peso relativo de cada pregunta basado en su puntuación actual
    const totalActual = preguntas.reduce((sum, p) => sum + (p.puntuacion || 0), 0);
    const pesos = preguntas.map(p => (totalActual > 0 ? (p.puntuacion || 0) / totalActual : 1 / numPreguntas));
    
    // Asignar puntuaciones iniciales basadas en los pesos (sin redondear aún)
    let puntuacionesExactas = pesos.map(peso => peso * 100);
    
    // Redondear a múltiplos de 5 más cercanos
    let puntuacionesRedondeadas = puntuacionesExactas.map(p => Math.round(p / 5) * 5);
    
    // Calcular la suma actual después del redondeo
    let sumaActual = puntuacionesRedondeadas.reduce((sum, p) => sum + p, 0);
    
    // Ajustar para que sumen exactamente 100
    if (sumaActual !== 100) {
      // Calcular la diferencia
      const diferencia = 100 - sumaActual;
      
      if (diferencia > 0) {
        // Si falta puntuación, añadir de 5 en 5 a las preguntas con mayor peso
        let indicesPorPeso = pesos
          .map((peso, indice) => ({ peso, indice }))
          .sort((a, b) => b.peso - a.peso)
          .map(item => item.indice);
        
        let puntosRestantes = diferencia;
        let i = 0;
        
        while (puntosRestantes > 0 && i < indicesPorPeso.length) {
          puntuacionesRedondeadas[indicesPorPeso[i]] += 5;
          puntosRestantes -= 5;
          i = (i + 1) % indicesPorPeso.length; // Circular para distribuir equitativamente
        }
      } else if (diferencia < 0) {
        // Si sobra puntuación, quitar de 5 en 5 a las preguntas con menor peso
        let indicesPorPeso = pesos
          .map((peso, indice) => ({ peso, indice }))
          .sort((a, b) => a.peso - b.peso)
          .map(item => item.indice);
        
        let puntosASustraer = -diferencia;
        let i = 0;
        
        while (puntosASustraer > 0 && i < indicesPorPeso.length) {
          // Asegurarse de que ninguna pregunta tenga menos de 5 puntos
          if (puntuacionesRedondeadas[indicesPorPeso[i]] > 5) {
            puntuacionesRedondeadas[indicesPorPeso[i]] -= 5;
            puntosASustraer -= 5;
          }
          i = (i + 1) % indicesPorPeso.length; // Circular para distribuir equitativamente
        }
      }
    }
    
    // Verificar que todas las preguntas tengan al menos 5 puntos
    puntuacionesRedondeadas = puntuacionesRedondeadas.map(p => Math.max(5, p));
    
    // Verificar nuevamente la suma y ajustar si es necesario
    sumaActual = puntuacionesRedondeadas.reduce((sum, p) => sum + p, 0);
    if (sumaActual !== 100) {
      // Ajustar la primera pregunta para compensar
      puntuacionesRedondeadas[0] += (100 - sumaActual);
    }
    
    // Asignar las puntuaciones redondeadas a las preguntas
    preguntasAjustadas = preguntasAjustadas.map((pregunta, index) => ({
      ...pregunta,
      puntuacion: puntuacionesRedondeadas[index]
    }));
    
    return preguntasAjustadas;
  };

  // Verificar si hay preguntas en la prueba
  const tienePreguntas = prueba && (
    (prueba.preguntas && prueba.preguntas.length > 0) || 
    (prueba.preguntasTexto && prueba.preguntasTexto.length > 0)
  );

  // Función para eliminar una pregunta
  const handleEliminarPregunta = async (preguntaId: number) => {
    try {
      // Usar el diálogo de confirmación en lugar de window.confirm
      mostrarDialogoConfirmacion(
        "Eliminar pregunta",
        "¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer.",
        async () => {
          // Eliminar la pregunta
          await pruebaTecnicaService.eliminarPregunta(preguntaId, usuario.id);
          
          // Recargar la prueba técnica
          const pruebaActualizada = await pruebaTecnicaService.obtenerPruebaPorId(id);
          setPrueba(pruebaActualizada);
          
          // Ya no ajustamos automáticamente las puntuaciones
          toast.success("Pregunta eliminada correctamente");
          
          // Informar al usuario sobre la necesidad de validar puntuaciones
          if (pruebaActualizada.preguntas && pruebaActualizada.preguntas.length > 0) {
            const totalPuntos = pruebaActualizada.preguntas.reduce((sum: number, pregunta: any) => sum + (pregunta.puntuacion || 0), 0);
            if (totalPuntos !== 100) {
              toast.info(`La puntuación total ahora es de ${totalPuntos}/100. Utiliza el botón "Validar Puntuaciones" para ajustar.`);
            }
          }
        }
      );
    } catch (error) {
      console.error("Error al eliminar la pregunta:", error);
      toast.error("Error al eliminar la pregunta");
    }
  };

  // Regenerar preguntas con IA
  const handleRegenerarPreguntas = async () => {
    mostrarDialogoConfirmacion(
      "Regenerar preguntas",
      "¿Estás seguro de que deseas regenerar las preguntas? Esta acción reemplazará todas las preguntas existentes.",
      async () => {
    try {
      setRegenerando(true);
      
          if (!usuario || !usuario.id) {
            toast.error("No se pudo identificar al usuario");
        return;
      }
      
          
          // Obtener el número de preguntas a generar
      const numPreguntas = parseInt(formData.numPreguntas) || 5;
      
          // Llamar al servicio para regenerar preguntas
      await pruebaTecnicaService.regenerarPreguntasParaPrueba(
        id, 
        usuario.id, 
        numPreguntas
      );
      
          // La respuesta del servicio no incluye las preguntas generadas,
          // necesitamos recargar la prueba para obtener las preguntas actualizadas
          toast.info("Preguntas regeneradas. Cargando datos actualizados...");
          
          // Recargar la prueba técnica para obtener las preguntas actualizadas
      const pruebaActualizada = await pruebaTecnicaService.obtenerPruebaPorId(id);
          
          // Verificar si la prueba actualizada tiene preguntas
          if (pruebaActualizada && pruebaActualizada.preguntas && pruebaActualizada.preguntas.length > 0) {
            // Actualizar el estado de la prueba
      setPrueba(pruebaActualizada);
      
            // Actualizar el estado de preguntas editadas
            setPreguntasEditadas([...pruebaActualizada.preguntas]);
      
            // Marcar que hay cambios pendientes (opcional, ya que las preguntas ya están guardadas en el servidor)
            setCambiosPendientes(false);
      
            toast.success(`Se han regenerado ${pruebaActualizada.preguntas.length} preguntas correctamente.`);
          } else {
            toast.error("No se encontraron preguntas después de la regeneración. Intente nuevamente.");
          }
    } catch (error) {
      console.error("Error al regenerar preguntas:", error);
      toast.error("Error al regenerar las preguntas");
    } finally {
      setRegenerando(false);
    }
      }
    );
  };

  // Abrir modal para editar pregunta
  const handleEditarPregunta = (pregunta: any) => {
    setPreguntaSeleccionada(pregunta);
    setModalEditarAbierto(true);
  };

  // Abrir modal para crear una nueva pregunta
  const handleAgregarPregunta = () => {
    // Crear una nueva pregunta vacía
    const nuevaPregunta = {
      enunciado: "",
      tipoPregunta: "ABIERTA", // Tipo permitido por el backend
      puntuacion: 0,
      opciones: "", // Inicializar como string vacío, no array
      respuestaCorrecta: "",
      pruebaTecnicaId: id,
      orden: (preguntasEditadas.length > 0 ? Math.max(...preguntasEditadas.map((p: any) => p.orden || 0)) + 1 : 1)
    };
    
    setPreguntaSeleccionada(nuevaPregunta);
    setModalEditarAbierto(true);
  };

  // Recargar preguntas después de editar
  const handlePreguntaGuardada = async (preguntaEditada: any) => {
    try {
      // Asegurar que las opciones siempre sean string, no array
      if (preguntaEditada.opciones && Array.isArray(preguntaEditada.opciones)) {
        preguntaEditada.opciones = preguntaEditada.opciones.join('|');
      }
      
      // Normalizar tipos de preguntas no permitidos
      if (preguntaEditada.tipoPregunta === "DESARROLLO") {
        preguntaEditada.tipoPregunta = "ABIERTA";
      } else if (preguntaEditada.tipoPregunta === "THEORY" || preguntaEditada.tipoPregunta === "PROJECT" || !["ABIERTA", "OPCION_MULTIPLE", "VERDADERO_FALSO", "CODIGO", "TEORICA"].includes(preguntaEditada.tipoPregunta)) {
        preguntaEditada.tipoPregunta = "TEORICA";
      }
      
      // Validar que tipoPregunta sea uno de los valores permitidos
      const tiposPermitidos = ["ABIERTA", "OPCION_MULTIPLE", "VERDADERO_FALSO", "CODIGO", "TEORICA"];
      if (!tiposPermitidos.includes(preguntaEditada.tipoPregunta)) {
        console.warn(`Tipo de pregunta no válido: ${preguntaEditada.tipoPregunta}. Cambiando a ABIERTA.`);
        preguntaEditada.tipoPregunta = "ABIERTA";
      }
      
      // Si la pregunta ya existe en preguntasEditadas, actualizarla
      if (preguntaEditada.id) {
        setPreguntasEditadas(prev => 
          prev.map(p => p.id === preguntaEditada.id ? preguntaEditada : p)
        );
      } else {
        // Si es una pregunta nueva, añadirla al array
        // Generamos un ID temporal negativo para identificarla localmente
        const idTemporal = -Date.now();
        setPreguntasEditadas(prev => [
          ...prev, 
          { ...preguntaEditada, id: idTemporal }
        ]);
      }
      
      // Marcar que hay cambios pendientes
      setCambiosPendientes(true);
      
      // Cerrar el modal de edición
      setModalEditarAbierto(false);
      
      // Mostrar mensaje de éxito
      toast.success("Cambios guardados localmente. Haz clic en 'Confirmar Cambios' para guardarlos en la base de datos.");
    } catch (error) {
      console.error("Error al actualizar pregunta:", error);
      toast.error("Error al actualizar la pregunta");
    }
  };

  // Función para eliminar una pregunta localmente
  const handleEliminarPreguntaLocal = (preguntaId: number) => {
    try {
      // Usar el diálogo de confirmación
      mostrarDialogoConfirmacion(
        "Eliminar pregunta",
        "¿Estás seguro de que deseas eliminar esta pregunta? Este cambio no será permanente hasta que confirmes los cambios.",
        () => {
          // Eliminar la pregunta del estado local
          setPreguntasEditadas(prev => prev.filter(p => p.id !== preguntaId));
          
          // Marcar que hay cambios pendientes
          setCambiosPendientes(true);
          
          toast.success("Pregunta eliminada localmente. Haz clic en 'Confirmar Cambios' para guardar los cambios.");
        }
      );
    } catch (error) {
      console.error("Error al eliminar la pregunta:", error);
      toast.error("Error al eliminar la pregunta");
    }
  };

  // Función para confirmar y guardar todos los cambios en el servidor
  const handleConfirmarCambios = async () => {
    try {
      // Verificar que la suma de puntuaciones sea 100
      const totalPuntos = preguntasEditadas.reduce((sum: number, pregunta: any) => sum + (pregunta.puntuacion || 0), 0);
      
      if (totalPuntos !== 100) {
        // Mostrar mensaje de advertencia y ofrecer validar puntuaciones
        mostrarDialogoConfirmacion(
          "Puntuación incorrecta",
          `La puntuación total es de ${totalPuntos} puntos, pero debería ser 100. ¿Deseas ajustar automáticamente las puntuaciones para que sean múltiplos de 5 y sumen 100 puntos?`,
          async () => {
            // Ajustar puntuaciones
            const preguntasAjustadas = distribuirPuntuacionesMultiplosDe5(preguntasEditadas);
            setPreguntasEditadas(preguntasAjustadas);
            
            // Mostrar mensaje de éxito
            toast.success("Puntuaciones ajustadas. Confirma los cambios nuevamente para guardarlos.");
          }
        );
        return;
      }
      
      // Si la puntuación es correcta, proceder a guardar los cambios
      setEnviando(true);
      
      // Procesar las preguntas: nuevas, actualizadas y eliminadas
      const preguntasOriginales = prueba.preguntas || [];
      
      // 1. Identificar preguntas nuevas (ID negativo o null)
      const preguntasNuevas = preguntasEditadas.filter(p => !p.id || p.id < 0);
      
      // 2. Identificar preguntas actualizadas (ID positivo y existente en preguntasEditadas)
      const preguntasActualizadas = preguntasEditadas.filter(p => p.id && p.id > 0);
      
      // 3. Identificar preguntas eliminadas (en originales pero no en editadas)
      const preguntasEliminadas = preguntasOriginales.filter(
        (original: any) => !preguntasEditadas.some(editada => editada.id === original.id)
      );
      
      // Guardar preguntas nuevas
      for (const pregunta of preguntasNuevas) {
        // Asegurar que las opciones sean un string y no un array
        if (pregunta.opciones && Array.isArray(pregunta.opciones)) {
          pregunta.opciones = pregunta.opciones.join('|');
        }
        
        // Normalizar tipo de pregunta
        if (pregunta.tipoPregunta === "DESARROLLO") {
          pregunta.tipoPregunta = "ABIERTA";
        } else if (pregunta.tipoPregunta === "THEORY" || pregunta.tipoPregunta === "PROJECT" || !["ABIERTA", "OPCION_MULTIPLE", "VERDADERO_FALSO", "CODIGO", "TEORICA"].includes(pregunta.tipoPregunta)) {
          pregunta.tipoPregunta = "TEORICA";
        }
        
        // Validar que tipoPregunta sea uno de los valores permitidos
        const tiposPermitidos = ["ABIERTA", "OPCION_MULTIPLE", "VERDADERO_FALSO", "CODIGO", "TEORICA"];
        if (!tiposPermitidos.includes(pregunta.tipoPregunta)) {
          console.warn(`Tipo de pregunta no válido: ${pregunta.tipoPregunta}. Cambiando a ABIERTA.`);
          pregunta.tipoPregunta = "ABIERTA";
        }
        
        const nuevaPreguntaData = {
          ...pregunta,
          id: undefined, // Eliminar ID temporal
          pruebaTecnicaId: id
        };
        
        await pruebaTecnicaService.crearPregunta(
          usuario.id,
          nuevaPreguntaData
        );
      }
      
      // Actualizar preguntas existentes
      for (const pregunta of preguntasActualizadas) {
        // Asegurar que las opciones sean un string y no un array
        if (pregunta.opciones && Array.isArray(pregunta.opciones)) {
          pregunta.opciones = pregunta.opciones.join('|');
        }
        
        // Normalizar tipo de pregunta
        if (pregunta.tipoPregunta === "DESARROLLO") {
          pregunta.tipoPregunta = "ABIERTA";
        } else if (pregunta.tipoPregunta === "THEORY" || pregunta.tipoPregunta === "PROJECT" || !["ABIERTA", "OPCION_MULTIPLE", "VERDADERO_FALSO", "CODIGO", "TEORICA"].includes(pregunta.tipoPregunta)) {
          pregunta.tipoPregunta = "TEORICA";
        }
        
        // Validar que tipoPregunta sea uno de los valores permitidos
        const tiposPermitidos = ["ABIERTA", "OPCION_MULTIPLE", "VERDADERO_FALSO", "CODIGO", "TEORICA"];
        if (!tiposPermitidos.includes(pregunta.tipoPregunta)) {
          console.warn(`Tipo de pregunta no válido: ${pregunta.tipoPregunta}. Cambiando a ABIERTA.`);
          pregunta.tipoPregunta = "ABIERTA";
        }
        
        await pruebaTecnicaService.actualizarPregunta(
          pregunta.id,
          usuario.id,
          pregunta
        );
      }
      
      // Eliminar preguntas
      for (const pregunta of preguntasEliminadas) {
        await pruebaTecnicaService.eliminarPregunta(pregunta.id, usuario.id);
      }
      
      // Recargar la prueba técnica para obtener los datos actualizados
      const pruebaActualizada = await pruebaTecnicaService.obtenerPruebaPorId(id);
      setPrueba(pruebaActualizada);
      
      // Actualizar preguntasEditadas con los datos del servidor
      if (pruebaActualizada.preguntas && pruebaActualizada.preguntas.length > 0) {
        setPreguntasEditadas([...pruebaActualizada.preguntas]);
      } else {
        setPreguntasEditadas([]);
      }
      
      // Resetear el estado de cambios pendientes
      setCambiosPendientes(false);
      
      toast.success("Todos los cambios han sido guardados correctamente");
      
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      toast.error("Error al guardar los cambios en el servidor");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            asChild
          >
          <Link href="/reclutador/pruebas">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
          <h1 className="text-2xl font-bold">Editar Prueba Técnica</h1>
        </div>
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
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="preguntas">Preguntas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Editar Prueba Técnica</CardTitle>
                        <CardDescription>Modifica los parámetros de la prueba técnica</CardDescription>
                      </div>
                      <Badge className="bg-orange-500 text-white flex items-center gap-1">
                        <FileEdit className="h-3 w-3" />
                        <span>Modo Edición</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="vacanteId" className="mb-2 block">Vacante Asociada (opcional)</Label>
                        <Select
                          value={formData.vacanteId}
                          onValueChange={(value) => handleSelectChange('vacanteId', value)}
                          disabled={enviando}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una vacante (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Ninguna vacante</SelectItem>
                            {vacantes.map((vacante) => (
                              <SelectItem key={vacante.id} value={vacante.id.toString()}>
                                {vacante.titulo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Asociar una vacante permite generar preguntas más específicas, pero no es obligatorio.
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="titulo">Título de la Prueba</Label>
                        <Input
                          id="titulo"
                          name="titulo"
                          value={formData.titulo}
                          onChange={handleInputChange}
                          placeholder="Ej: Prueba técnica para Desarrollador Frontend"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                          id="descripcion"
                          name="descripcion"
                          value={formData.descripcion}
                          onChange={handleInputChange}
                          placeholder="Describe el propósito y alcance de esta prueba técnica"
                          rows={4}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="instrucciones">Instrucciones para el Candidato</Label>
                        <Textarea
                          id="instrucciones"
                          name="instrucciones"
                          value={formData.instrucciones}
                          onChange={handleInputChange}
                          placeholder="Instrucciones detalladas para el candidato"
                          rows={4}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tiempoLimiteMinutos">Tiempo Límite (minutos)</Label>
                          <Input
                            id="tiempoLimiteMinutos"
                            name="tiempoLimiteMinutos"
                            type="number"
                            min={15}
                            max={180}
                            value={formData.tiempoLimiteMinutos}
                            onChange={(e) => handleNumberChange("tiempoLimiteMinutos", e.target.value)}
                            onBlur={(e) => {
                              // Al perder el foco, si el campo está vacío o el valor es menor a 15, establecer el valor mínimo
                              if (e.target.value === '' || parseInt(e.target.value) < 15) {
                                handleNumberChange("tiempoLimiteMinutos", "15");
                              }
                            }}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="nivelDificultad">Nivel de Dificultad</Label>
                          <Select 
                            value={formData.nivelDificultad} 
                            onValueChange={(value) => handleSelectChange("nivelDificultad", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el nivel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BASICO">Básico</SelectItem>
                              <SelectItem value="INTERMEDIO">Intermedio</SelectItem>
                              <SelectItem value="AVANZADO">Avanzado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="tecnologias">Tecnologías y Habilidades</Label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              id="nuevaTecnologia"
                              placeholder="Escribe una tecnología"
                              className="flex-grow"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                                  e.preventDefault();
                                  const nuevaTecnologia = e.currentTarget.value.trim();
                                  const tecnologias = formData.tecnologias 
                                    ? formData.tecnologias.split(',').filter(t => t.trim() !== '')
                                    : [];
                                  
                                  if (!tecnologias.includes(nuevaTecnologia)) {
                                    tecnologias.push(nuevaTecnologia);
                                    setFormData({
                                      ...formData,
                                      tecnologias: tecnologias.join(',')
                                    });
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={(e) => {
                                const input = document.getElementById('nuevaTecnologia') as HTMLInputElement;
                                if (input && input.value.trim() !== '') {
                                  const nuevaTecnologia = input.value.trim();
                                  const tecnologias = formData.tecnologias 
                                    ? formData.tecnologias.split(',').filter(t => t.trim() !== '')
                                    : [];
                                  
                                  if (!tecnologias.includes(nuevaTecnologia)) {
                                    tecnologias.push(nuevaTecnologia);
                                    setFormData({
                                      ...formData,
                                      tecnologias: tecnologias.join(',')
                                    });
                                    input.value = '';
                                  }
                                }
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground"></p>
                          
                          <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                            {formData.tecnologias.split(',')
                              .filter(tech => tech.trim() !== '')
                              .map((tech, index) => (
                                <Badge key={index} className="flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs">
                                  {tech.trim()}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const techs = formData.tecnologias.split(',').filter(t => t.trim() !== '');
                                      techs.splice(index, 1);
                                      setFormData({
                                        ...formData,
                                        tecnologias: techs.join(',')
                                      });
                                    }}
                                    className="ml-1 rounded-full hover:bg-primary-foreground/20"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                    <span className="sr-only">Eliminar</span>
                                  </button>
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        type="button" 
                        onClick={() => router.push("/reclutador/pruebas")}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={enviando} className="bg-primary text-white">
                        {enviando ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Cambios
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </TabsContent>
            
            <TabsContent value="preguntas" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Preguntas de la Prueba</CardTitle>
                      <CardDescription>Administra las preguntas de la prueba técnica</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={formData.numPreguntas}
                        onValueChange={(value) => handleSelectChange("numPreguntas", value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Número de preguntas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 preguntas</SelectItem>
                          <SelectItem value="5">5 preguntas</SelectItem>
                          <SelectItem value="7">7 preguntas</SelectItem>
                          <SelectItem value="10">10 preguntas</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 relative"
                        onClick={handleRegenerarPreguntas}
                        disabled={regenerando}
                      >
                        <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          IA
                        </span>
                        {regenerando ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Regenerar Preguntas
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAgregarPregunta}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Añadir Pregunta
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Información sobre puntuación */}
                  <div className="bg-muted p-4 rounded-md mb-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Puntuación Total: 
                        <span className={
                          preguntasEditadas.reduce((sum, p) => sum + (p.puntuacion || 0), 0) === 100 
                            ? " text-green-600" 
                            : " text-red-600"
                        }>
                          {" "}{preguntasEditadas.reduce((sum, p) => sum + (p.puntuacion || 0), 0)}/100
                        </span>
                                </h4>
                      <p className="text-sm text-muted-foreground">
                        La puntuación total de las preguntas debe sumar 100 puntos.
                      </p>
                              </div>
                  </div>
                  
                  {/* Lista de preguntas */}
                  {preguntasEditadas.length > 0 ? (
                    <div className="space-y-3">
                      {preguntasEditadas.map((pregunta, index) => (
                        <Card key={pregunta.id || `new-${index}`} className="relative">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/10 text-primary">
                                  {pregunta.tipoPregunta === "OPCION_MULTIPLE" ? "Opción Múltiple" :
                                  pregunta.tipoPregunta === "VERDADERO_FALSO" ? "Verdadero/Falso" :
                                  pregunta.tipoPregunta === "ABIERTA" ? "Abierta" :
                                  pregunta.tipoPregunta === "CODIGO" ? "Código" :
                                  pregunta.tipoPregunta === "TEORICA" ? "Teórica" :
                                  pregunta.tipoPregunta === "DESARROLLO" ? "Abierta" : // Para compatibilidad
                                  pregunta.tipoPregunta}
                                </Badge>
                                <Badge variant="outline">
                                  {pregunta.puntuacion || 0} puntos
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0" 
                                  onClick={() => handleEditarPregunta(pregunta)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700" 
                                  onClick={() => handleEliminarPreguntaLocal(pregunta.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">{pregunta.enunciado}</p>
                            
                            {/* Mostrar opciones para preguntas de opción múltiple o verdadero/falso */}
                            {(pregunta.tipoPregunta === "OPCION_MULTIPLE" || pregunta.tipoPregunta === "VERDADERO_FALSO") && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Opciones:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {Array.isArray(pregunta.opciones) ? (
                                    pregunta.opciones.map((opcion: string, i: number) => (
                                      <div 
                                        key={i} 
                                        className={`text-xs p-1 rounded border ${
                                          opcion === pregunta.respuestaCorrecta 
                                            ? 'bg-green-50 border-green-200 text-green-700' 
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                      >
                                        {opcion === pregunta.respuestaCorrecta && (
                                          <CheckCircle className="h-3 w-3 inline mr-1 text-green-600" />
                                        )}
                                        {opcion}
                              </div>
                                    ))
                                  ) : typeof pregunta.opciones === 'string' && pregunta.opciones.trim() !== '' ? (
                                    pregunta.opciones.split('|').map((opcion: string, i: number) => (
                                      <div 
                                        key={i} 
                                        className={`text-xs p-1 rounded border ${
                                          opcion.trim() === pregunta.respuestaCorrecta 
                                            ? 'bg-green-50 border-green-200 text-green-700' 
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                      >
                                        {opcion.trim() === pregunta.respuestaCorrecta && (
                                          <CheckCircle className="h-3 w-3 inline mr-1 text-green-600" />
                                        )}
                                        {opcion.trim()}
                                      </div>
                                    ))
                                  ) : pregunta.tipoPregunta === "VERDADERO_FALSO" ? (
                                    ["Verdadero", "Falso"].map((opcion, i) => (
                                      <div 
                                        key={i} 
                                        className={`text-xs p-1 rounded border ${
                                          opcion === pregunta.respuestaCorrecta 
                                            ? 'bg-green-50 border-green-200 text-green-700' 
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                      >
                                        {opcion === pregunta.respuestaCorrecta && (
                                          <CheckCircle className="h-3 w-3 inline mr-1 text-green-600" />
                                        )}
                                        {opcion}
                          </div>
                        ))
                                  ) : (
                                    <div className="text-xs text-muted-foreground">
                                      No hay opciones definidas
                              </div>
                                  )}
                              </div>
                            </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="text-muted-foreground mb-4">
                        No hay preguntas en esta prueba técnica
                      </div>
                      <Button onClick={handleAgregarPregunta}>
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir Primera Pregunta
                      </Button>
                    </div>
                  )}
                  
                  {/* Botón de confirmar cambios al final de la lista de preguntas */}
                  {cambiosPendientes && (
                    <div className="mt-6 flex flex-col gap-4 border-t pt-6">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex gap-1 items-center">
                          <AlertCircle className="h-3 w-3" />
                          Cambios pendientes
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Has realizado cambios que aún no se han guardado en la base de datos.
                        </span>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleConfirmarCambios}
                          disabled={enviando}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {enviando ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirmar Cambios
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Modal para editar pregunta */}
          {preguntaSeleccionada && (
            <EditarPreguntaModal 
              pregunta={preguntaSeleccionada}
              isOpen={modalEditarAbierto}
              onClose={() => setModalEditarAbierto(false)}
              onSave={handlePreguntaGuardada}
              reclutadorId={usuario?.id}
              nivelDificultad={formData.nivelDificultad}
            />
          )}
          
          {/* Diálogo de confirmación */}
          <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dialogoConfig.titulo}</DialogTitle>
                <DialogDescription className="pt-3">
                  {dialogoConfig.descripcion}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setDialogoAbierto(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    setDialogoAbierto(false);
                    dialogoConfig.accion();
                  }}
                >
                  Confirmar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
} 
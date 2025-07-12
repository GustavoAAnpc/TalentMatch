"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Clock, PauseCircle, PlayCircle, Trash2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FormularioVacante from "@/components/vacantes/FormularioVacante";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { vacanteService } from "@/services/vacanteService";
import { authService } from "@/services/authService";
import { CreacionVacanteRequest } from "@/types/vacante";

export default function EditarVacante() {
  const params = useParams();
  const router = useRouter();
  const vacanteId = Number(params.id);

  const [initialData, setInitialData] = useState<Partial<CreacionVacanteRequest>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [estadoVacante, setEstadoVacante] = useState<string>("");
  
  // Estados para el diálogo de confirmación de eliminación
  const [mostrarDialogoEliminar, setMostrarDialogoEliminar] = useState(false);
  const [eliminarPruebaTecnica, setEliminarPruebaTecnica] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [tienePruebasTecnicas, setTienePruebasTecnicas] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const cargarVacante = async () => {
      try {
        setCargando(true);
        
        // Obtener el usuario actual
        const user = authService.getUsuarioActual();
        if (!user || !user.id) {
          toast.error("No se pudo identificar al usuario. Inicie sesión nuevamente.");
          return;
        }
        
        setUsuario(user);
        
        const data = await vacanteService.obtenerVacantePorId(vacanteId);
        
        // Guardar el estado de la vacante
        setEstadoVacante(data.estado || "");
        
        // Formatear los datos para el formulario
        const datosFormateados = {
          ...data,
          // Corregir el problema de la fecha que muestra un día más
          fechaPublicacion: data.fechaPublicacion ? corregirFechaInput(data.fechaPublicacion) : undefined,
          fechaCierre: data.fechaCierre ? corregirFechaInput(data.fechaCierre) : undefined,
          // Asegurar que experienciaRequerida sea string si está presente
          experienciaRequerida: data.experienciaRequerida ? String(data.experienciaRequerida) : undefined,
          // Asegurar que experienciaMinima sea un número
          experienciaMinima: data.experienciaMinima !== undefined ? Number(data.experienciaMinima) : 0
        };
        
        console.log("Fecha original:", data.fechaPublicacion);
        console.log("Fecha corregida para input:", datosFormateados.fechaPublicacion);
        
        setInitialData(datosFormateados);
        setCargando(false);
      } catch (err) {
        console.error("Error al cargar la vacante:", err);
        setError("No se pudo cargar la información de la vacante");
        setCargando(false);
      }
    };

    if (vacanteId) {
      cargarVacante();
    }
  }, [vacanteId]);

  // Función para corregir el problema de la fecha que muestra un día más
  const corregirFechaInput = (fecha: any): string => {
    if (!fecha) return "";
    
    try {
      // Si es una cadena con formato ISO
      if (typeof fecha === 'string') {
        // Si tiene formato ISO con T, extraer solo la parte de fecha
        if (fecha.includes('T')) {
          return fecha.split('T')[0];
        }
        
        // Si ya tiene formato YYYY-MM-DD, devolverlo tal cual
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          return fecha;
        }
      }
      
      // Si es un objeto con propiedades year, month, day (formato Java LocalDate)
      if (typeof fecha === 'object' && fecha !== null) {
        if ('year' in fecha && 'month' in fecha && 'day' in fecha) {
          // Crear la fecha manualmente sin usar Date para evitar ajustes de zona horaria
          const year = fecha.year;
          const month = String(fecha.month).padStart(2, '0');
          const day = String(fecha.day).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }
      
      // Último recurso: intentar convertir a fecha y extraer componentes
      const dateObj = new Date(fecha);
      if (!isNaN(dateObj.getTime())) {
        // Obtener componentes de fecha en la zona horaria local
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      console.error("No se pudo formatear la fecha para input:", fecha);
      return "";
    } catch (error) {
      console.error("Error al formatear fecha para input:", error, fecha);
      return "";
    }
  };

  const cambiarEstadoVacante = async (nuevoEstado: string) => {
    try {
      const usuario = authService.getUsuario();
      if (!usuario || !usuario.id) {
        toast.error("No se pudo identificar al usuario");
        return;
      }
      
      setCambiandoEstado(true);
      await vacanteService.cambiarEstadoVacante(vacanteId, usuario.id, nuevoEstado);
      setEstadoVacante(nuevoEstado);
      toast.success(`Vacante ${nuevoEstado.toLowerCase()} exitosamente`);
    } catch (err) {
      console.error("Error al cambiar estado de la vacante:", err);
      toast.error("No se pudo cambiar el estado de la vacante");
    } finally {
      setCambiandoEstado(false);
    }
  };

  // Obtener el color del badge según el estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "ACTIVA":
        return "bg-green-100 text-green-800";
      case "PAUSADA":
        return "bg-yellow-100 text-yellow-800";
      case "CERRADA":
        return "bg-red-100 text-red-800";
      case "BORRADOR":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Renderizar botones según el estado
  const renderBotonesEstado = () => {
    if (cambiandoEstado) {
      return (
        <Button disabled>
          <Clock className="animate-spin h-4 w-4 mr-2" /> Cambiando estado...
        </Button>
      );
    }

    switch (estadoVacante) {
      case "ACTIVA":
        return (
          <>
            <Button variant="outline" onClick={() => cambiarEstadoVacante("PAUSADA")}>
              <PauseCircle className="h-4 w-4 mr-2" /> Pausar
            </Button>
            <Button variant="outline" onClick={() => cambiarEstadoVacante("CERRADA")}>
              <CheckCircle className="h-4 w-4 mr-2" /> Cerrar
            </Button>
          </>
        );
      case "PAUSADA":
        return (
          <>
            <Button variant="outline" onClick={() => cambiarEstadoVacante("ACTIVA")}>
              <PlayCircle className="h-4 w-4 mr-2" /> Activar
            </Button>
            <Button variant="outline" onClick={() => cambiarEstadoVacante("CERRADA")}>
              <CheckCircle className="h-4 w-4 mr-2" /> Cerrar
            </Button>
          </>
        );
      case "BORRADOR":
        return (
          <Button variant="outline" onClick={() => cambiarEstadoVacante("ACTIVA")}>
            <PlayCircle className="h-4 w-4 mr-2" /> Publicar
          </Button>
        );
      case "CERRADA":
        return (
          <Button variant="outline" onClick={() => cambiarEstadoVacante("ACTIVA")}>
            <PlayCircle className="h-4 w-4 mr-2" /> Reactivar
          </Button>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (formData: CreacionVacanteRequest, generarPrueba: boolean, pruebaTecnica: any) => {
    try {
      setGuardando(true);
      
      // Obtener el ID del reclutador del usuario autenticado
      const usuario = authService.getUsuario();
      if (!usuario || !usuario.id) {
        toast.error("No se pudo obtener la información del usuario");
        setGuardando(false);
        return;
      }
      
      // Asegurar que experienciaRequerida siempre tenga un valor
      if (!formData.experienciaRequerida) {
        formData.experienciaRequerida = `${formData.experienciaMinima || 0} años`;
      }
      
      await vacanteService.actualizarVacante(vacanteId, usuario.id, formData);
      toast.success("Vacante actualizada correctamente");
      
      // Redirigir a la vista de detalle
      router.push(`/reclutador/vacantes/${vacanteId}`);
    } catch (error) {
      console.error("Error al actualizar la vacante:", error);
      toast.error("Error al actualizar la vacante: " + (error instanceof Error ? error.message : "Error desconocido"));
      setGuardando(false);
    }
  };

  // Función para manejar la eliminación de la vacante
  const handleEliminarVacante = async () => {
    if (!usuario?.id) {
      toast.error("No se pudo identificar al usuario. Inicie sesión nuevamente.");
      return;
    }
    
    try {
      setEliminando(true);
      
      // Verificar si la vacante tiene pruebas técnicas asociadas
      const tienePruebas = await vacanteService.verificarPruebasTecnicas(vacanteId);
      setTienePruebasTecnicas(tienePruebas);
      
      // Mostrar diálogo de confirmación
      setMostrarDialogoEliminar(true);
    } catch (error) {
      console.error("Error al verificar pruebas técnicas:", error);
      toast.error("No se pudo verificar si hay pruebas técnicas asociadas");
    } finally {
      setEliminando(false);
    }
  };
  
  // Función para confirmar la eliminación
  const confirmarEliminarVacante = async () => {
    if (!usuario?.id) {
      toast.error("No se pudo identificar al usuario. Inicie sesión nuevamente.");
      return;
    }
    
    try {
      setEliminando(true);
      
      // Eliminar la vacante
      await vacanteService.eliminarVacante(vacanteId, usuario.id, eliminarPruebaTecnica);
      
      // Mostrar mensaje de éxito
      toast.success("Vacante eliminada correctamente");
      
      // Redireccionar a la lista de vacantes
      router.push("/reclutador/vacantes");
    } catch (error) {
      console.error("Error al eliminar la vacante:", error);
      toast.error("No se pudo eliminar la vacante: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setEliminando(false);
      setMostrarDialogoEliminar(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/reclutador/vacantes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Editar Vacante</h2>
          {estadoVacante && (
            <Badge className={getEstadoColor(estadoVacante)}>
              {estadoVacante}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {renderBotonesEstado()}
          <Button 
            variant="destructive" 
            onClick={handleEliminarVacante}
            disabled={eliminando}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
          </Button>
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
        <FormularioVacante 
          initialData={initialData}
          onSubmit={handleSubmit}
          buttonText="Actualizar Vacante"
          isSubmitting={guardando}
          onCancel={() => router.push("/reclutador/vacantes")}
          isEditing={true}
        />
      )}

      {/* Diálogo de confirmación para eliminar vacante */}
      <Dialog open={mostrarDialogoEliminar} onOpenChange={setMostrarDialogoEliminar}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Eliminar vacante</DialogTitle>
            </div>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta vacante? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          {tienePruebasTecnicas && (
            <div className="flex items-start space-x-2 py-2">
              <Checkbox 
                id="eliminarPrueba" 
                checked={eliminarPruebaTecnica} 
                onCheckedChange={(checked) => setEliminarPruebaTecnica(checked as boolean)} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="eliminarPrueba"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Eliminar también la prueba técnica asociada
                </Label>
                <p className="text-sm text-muted-foreground">
                  Si no eliminas la prueba técnica, quedará disponible pero sin asociar a ninguna vacante.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setMostrarDialogoEliminar(false)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmarEliminarVacante}
              disabled={eliminando}
            >
              {eliminando ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
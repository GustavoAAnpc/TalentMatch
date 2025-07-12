"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import FormularioVacante from "@/components/vacantes/FormularioVacante";

import { authService } from "@/services/authService";
import { vacanteService } from "@/services/vacanteService";
import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { CreacionVacanteRequest } from "@/types/vacante";

export default function CrearVacantePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enviar el formulario para crear la vacante
  const handleSubmit = async (formData: CreacionVacanteRequest, generarPrueba: boolean, pruebaTecnica: any) => {
    setIsSubmitting(true);
    
    try {
      // Obtener el ID del reclutador del usuario autenticado
      const usuario = authService.getUsuario();
      if (!usuario || !usuario.id) {
        toast.error("No se pudo obtener la información del usuario");
        setIsSubmitting(false);
        return;
      }
      
      console.log("Usuario autenticado:", usuario);
      console.log("Rol del usuario:", usuario.rol);
      
      if (usuario.rol !== "RECLUTADOR" && usuario.rol !== "ADMINISTRADOR") {
        toast.error("No tienes permisos para crear vacantes. Solo los reclutadores pueden realizar esta acción.");
        setIsSubmitting(false);
        return;
      }
      
      // Crear la vacante
      try {
        const vacanteCreada = await vacanteService.crearVacante(usuario.id, formData);
        toast.success(`Vacante "${formData.titulo}" creada exitosamente`);
        
        // Si se seleccionó generar prueba técnica con IA
        if (generarPrueba && vacanteCreada.id) {
          toast.info("Generando prueba técnica con IA...");
          
          try {
            // Determinar el número de preguntas según la selección
            const numPreguntas = parseInt(pruebaTecnica.numPreguntas.toString());
            
            // Generar la prueba técnica
            await pruebaTecnicaService.generarPruebaConIA(
              vacanteCreada.id,
              usuario.id,
              `Prueba técnica para ${formData.titulo}`,
              `Evaluación de habilidades técnicas para la posición de ${formData.titulo}`,
              numPreguntas
            );
            
            toast.success("Prueba técnica generada exitosamente");
          } catch (error) {
            toast.error("Error al generar la prueba técnica: " + (error instanceof Error ? error.message : "Error desconocido"));
            console.error("Error generando prueba técnica:", error);
          }
        }
        
        // Redireccionar a la lista de vacantes
        router.push("/reclutador/vacantes");
      } catch (errorVacante) {
        toast.error("Error al crear la vacante: " + (errorVacante instanceof Error ? errorVacante.message : "Error desconocido"));
        console.error("Error detallado al crear vacante:", errorVacante);
        setIsSubmitting(false);
      }
    } catch (error) {
      toast.error("Error general: " + (error instanceof Error ? error.message : "Error desconocido"));
      console.error("Error global en el formulario:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/reclutador/vacantes">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Crear Vacante</h2>
      </div>

      <FormularioVacante 
        onSubmit={handleSubmit}
        buttonText="Crear Vacante"
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/reclutador/vacantes")}
      />
    </div>
  );
}

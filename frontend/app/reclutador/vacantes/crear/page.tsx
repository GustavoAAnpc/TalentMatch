"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BrainCircuit, Sparkles, Lightbulb, Zap, CheckCircle2, Settings, FileCode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { authService } from "@/services/authService";
import { vacanteService } from "@/services/vacanteService";
import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { CreacionVacanteRequest } from "@/types/vacante";

export default function CreateVacancyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generarPrueba, setGenerarPrueba] = useState(true);
  
  // Estados para los valores del formulario
  const [formData, setFormData] = useState<CreacionVacanteRequest>({
    titulo: "",
    descripcion: "",
    area: "",
    ubicacion: "",
    modalidad: "REMOTO",  // Valor por defecto según backend
    tipoContrato: "TIEMPO_COMPLETO", // Valor por defecto según backend
    salarioMinimo: 0,
    salarioMaximo: 0,
    mostrarSalario: true,
    experienciaRequerida: "", // Cambiado de "0 años" a vacío
    experienciaMinima: 0,
    habilidadesRequeridas: "No se requiere experiencia específica", // Valor por defecto
    requisitosAdicionales: "",
    beneficios: "",
    // Fecha actual en formato YYYY-MM-DD
    fechaPublicacion: new Date().toISOString().split('T')[0],
    fechaCierre: undefined
  });
  
  // Estados para configuración de prueba técnica
  const [pruebaTecnica, setPruebaTecnica] = useState({
    tipoPrueba: "coding",
    nivelDificultad: "intermediate",
    duracion: "60min",
    numPreguntas: 5
  });
  
  // Lista de habilidades para el campo habilidadesRequeridas
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [nuevaHabilidad, setNuevaHabilidad] = useState("");

  // Manejar cambios en campos de texto e input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convertir explícitamente los valores numéricos
    if (name === 'salarioMinimo' || name === 'salarioMaximo' || name === 'experienciaMinima') {
      setFormData({
        ...formData,
        [name]: value !== '' ? Number(value) : undefined
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Manejar cambios en selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambios en checkbox
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  // Manejar cambios en los campos de prueba técnica
  const handlePruebaTecnicaChange = (name: string, value: string) => {
    setPruebaTecnica({
      ...pruebaTecnica,
      [name]: value
    });
  };
  
  // Agregar una habilidad a la lista
  const agregarHabilidad = () => {
    if (nuevaHabilidad.trim() && !habilidades.includes(nuevaHabilidad.trim())) {
      const actualizadas = [...habilidades, nuevaHabilidad.trim()];
      setHabilidades(actualizadas);
      // Actualizar el campo habilidadesRequeridas con la lista separada por comas
      setFormData({
        ...formData,
        habilidadesRequeridas: actualizadas.join(", ")
      });
      setNuevaHabilidad("");
    }
  };
  
  // Remover una habilidad de la lista
  const removerHabilidad = (index: number) => {
    const actualizadas = habilidades.filter((_, i) => i !== index);
    setHabilidades(actualizadas);
    // Actualizar el campo habilidadesRequeridas con la lista actualizada
    setFormData({
      ...formData,
      habilidadesRequeridas: actualizadas.length > 0 ? actualizadas.join(", ") : "No se requieren habilidades específicas"
    });
  };

  // Enviar el formulario para crear la vacante
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      // Validar campos obligatorios
      const camposObligatorios = [
        'titulo', 'descripcion', 'area', 'ubicacion', 
        'modalidad', 'tipoContrato', 'experienciaRequerida', 'habilidadesRequeridas'
      ];
      
      const camposFaltantes = camposObligatorios.filter(campo => !formData[campo as keyof typeof formData]);
      if (camposFaltantes.length > 0) {
        toast.error(`Faltan campos obligatorios: ${camposFaltantes.join(', ')}`);
        setIsSubmitting(false);
        return;
      }
      
      // Imprimir los datos que se enviarán al servidor para depuración
      console.log("Datos a enviar:", formData);
      
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

      <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información de la Vacante</CardTitle>
          <CardDescription>Completa los detalles de la nueva vacante</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="titulo">Título de la Vacante</Label>
                  <Input 
                    id="titulo" 
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    placeholder="Ej. Desarrollador Frontend Senior" 
                    required
                    maxLength={100}
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="area">Departamento/Área</Label>
                  <Select 
                    value={formData.area} 
                    onValueChange={(value) => handleSelectChange("area", value)}
                  >
                    <SelectTrigger id="area">
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Tecnología">Tecnología</SelectItem>
                      <SelectItem value="Diseño">Diseño</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Ventas">Ventas</SelectItem>
                      <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                      <SelectItem value="Finanzas">Finanzas</SelectItem>
                      <SelectItem value="Operaciones">Operaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Select 
                    value={formData.ubicacion} 
                    onValueChange={(value) => handleSelectChange("ubicacion", value)}
                  >
                    <SelectTrigger id="ubicacion">
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Lima">Lima</SelectItem>
                      <SelectItem value="Arequipa">Arequipa</SelectItem>
                      <SelectItem value="Trujillo">Trujillo</SelectItem>
                      <SelectItem value="Cusco">Cusco</SelectItem>
                      <SelectItem value="Chiclayo">Chiclayo</SelectItem>
                      <SelectItem value="Piura">Piura</SelectItem>
                      <SelectItem value="Ica">Ica</SelectItem>
                      <SelectItem value="Huancayo">Huancayo</SelectItem>
                      <SelectItem value="Remoto">Remoto</SelectItem>
                      <SelectItem value="Híbrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                  <Select 
                    value={formData.tipoContrato} 
                    onValueChange={(value) => handleSelectChange("tipoContrato", value)}
                  >
                    <SelectTrigger id="tipoContrato">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="TIEMPO_COMPLETO">Tiempo Completo</SelectItem>
                      <SelectItem value="MEDIO_TIEMPO">Medio Tiempo</SelectItem>
                      <SelectItem value="PRACTICAS">Prácticas</SelectItem>
                      <SelectItem value="FREELANCE">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="experienciaRequerida">Experiencia Requerida (años)</Label>
                  <Input 
                    id="experienciaRequerida" 
                    name="experienciaRequerida"
                    type="number"
                    min="0"
                    value={formData.experienciaRequerida || ""}
                    onChange={handleInputChange}
                    placeholder="Ej. 3" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modalidad">Modalidad</Label>
                  <Select 
                    value={formData.modalidad} 
                    onValueChange={(value) => handleSelectChange("modalidad", value)}
                  >
                    <SelectTrigger id="modalidad">
                      <SelectValue placeholder="Seleccionar modalidad" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                      <SelectItem value="REMOTO">Remoto</SelectItem>
                      <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salarioMinimo">Salario Mínimo</Label>
                  <Input 
                    id="salarioMinimo" 
                    name="salarioMinimo"
                    type="number" 
                    min="0"
                    value={formData.salarioMinimo || ""}
                    onChange={handleInputChange}
                    placeholder="Ej. 30000" 
                  />
                </div>
              <div className="space-y-2">
                  <Label htmlFor="salarioMaximo">Salario Máximo</Label>
                  <Input 
                    id="salarioMaximo" 
                    name="salarioMaximo"
                    type="number" 
                    min="0"
                    value={formData.salarioMaximo || ""}
                    onChange={handleInputChange}
                    placeholder="Ej. 50000" 
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="mostrarSalario" 
                  checked={formData.mostrarSalario}
                  onCheckedChange={(checked) => handleCheckboxChange("mostrarSalario", checked === true)}
                />
                <Label htmlFor="mostrarSalario">Mostrar salario en la vacante</Label>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción de la Vacante</Label>
              <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                placeholder="Describe las responsabilidades y el rol..."
                className="min-h-[120px]"
                  required
                  maxLength={2000}
              />
            </div>

            <div className="space-y-2">
                <Label htmlFor="requisitosAdicionales">Requisitos</Label>
              <Textarea
                  id="requisitosAdicionales"
                  name="requisitosAdicionales"
                  value={formData.requisitosAdicionales || ""}
                  onChange={handleInputChange}
                placeholder="Lista los requisitos y habilidades necesarias..."
                className="min-h-[120px]"
                  maxLength={500}
              />
            </div>

            <div className="space-y-2">
                <Label htmlFor="beneficios">Beneficios</Label>
              <Textarea
                  id="beneficios"
                  name="beneficios"
                  value={formData.beneficios || ""}
                  onChange={handleInputChange}
                placeholder="Describe los beneficios que ofrece la posición..."
                className="min-h-[120px]"
                  maxLength={500}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Habilidades Requeridas</h3>
              <div className="flex items-center space-x-2">
                <Input 
                  value={nuevaHabilidad}
                  onChange={(e) => setNuevaHabilidad(e.target.value)}
                  placeholder="Ej. React" 
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarHabilidad();
                    }
                  }}
                  maxLength={50}
                />
                <Button 
                  type="button" 
                  onClick={agregarHabilidad}
                  disabled={habilidades.join(", ").length >= 450} // Prevenir exceder el límite
                >
                  Agregar
                </Button>
              </div>
              
              {habilidades.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <p className="w-full text-xs text-gray-500">{500 - habilidades.join(", ").length} caracteres restantes</p>
                  {habilidades.map((habilidad, index) => (
                    <Badge key={index} className="px-3 py-1 flex items-center gap-1">
                      {habilidad}
                      <button 
                        type="button" 
                        onClick={() => removerHabilidad(index)}
                        className="ml-1 h-4 w-4 rounded-full bg-primary-foreground text-primary flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
              </div>
              )}
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-[#38bdf8]" />
                  <span>Prueba Técnica Generada por IA</span>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  La IA creará automáticamente una prueba técnica personalizada basada en los requisitos de la vacante
                </p>
              </div>
              <Badge className="bg-[#38bdf8] text-white flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Potenciado por IA</span>
              </Badge>
            </div>
            
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="generarPrueba" 
                  checked={generarPrueba}
                  onCheckedChange={(checked) => setGenerarPrueba(checked === true)}
                />
                <Label htmlFor="generarPrueba">Generar prueba técnica automáticamente</Label>
              </div>
              
              {generarPrueba && (
            <div className="rounded-lg border p-4 space-y-4">
              <div className="space-y-2">
                    <Label htmlFor="tipoPrueba">Tipo de Prueba</Label>
                    <Select
                      value={pruebaTecnica.tipoPrueba}
                      onValueChange={(value) => handlePruebaTecnicaChange("tipoPrueba", value)}
                    >
                      <SelectTrigger id="tipoPrueba">
                    <SelectValue placeholder="Seleccionar tipo de prueba" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coding">Prueba de Codificación</SelectItem>
                    <SelectItem value="design">Prueba de Diseño</SelectItem>
                    <SelectItem value="theory">Prueba Teórica</SelectItem>
                    <SelectItem value="project">Mini Proyecto</SelectItem>
                    <SelectItem value="mixed">Prueba Mixta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                    <Label htmlFor="nivelDificultad">Nivel de Dificultad</Label>
                    <Select
                      value={pruebaTecnica.nivelDificultad}
                      onValueChange={(value) => handlePruebaTecnicaChange("nivelDificultad", value)}
                    >
                      <SelectTrigger id="nivelDificultad">
                    <SelectValue placeholder="Seleccionar dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                    <SelectItem value="expert">Experto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                    <Label htmlFor="duracion">Duración Estimada</Label>
                    <Select
                      value={pruebaTecnica.duracion}
                      onValueChange={(value) => handlePruebaTecnicaChange("duracion", value)}
                    >
                      <SelectTrigger id="duracion">
                    <SelectValue placeholder="Seleccionar duración" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30min">30 minutos</SelectItem>
                        <SelectItem value="60min">1 hora</SelectItem>
                        <SelectItem value="90min">1.5 horas</SelectItem>
                        <SelectItem value="120min">2 horas</SelectItem>
                        <SelectItem value="180min">3 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                    <Label htmlFor="numPreguntas">Número de Preguntas</Label>
                    <Select
                      value={pruebaTecnica.numPreguntas.toString()}
                      onValueChange={(value) => handlePruebaTecnicaChange("numPreguntas", value)}
                    >
                      <SelectTrigger id="numPreguntas">
                        <SelectValue placeholder="Seleccionar cantidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 preguntas</SelectItem>
                        <SelectItem value="5">5 preguntas</SelectItem>
                        <SelectItem value="8">8 preguntas</SelectItem>
                        <SelectItem value="10">10 preguntas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaPublicacion">Fecha de Publicación</Label>
                  <Input 
                    id="fechaPublicacion" 
                    name="fechaPublicacion"
                    type="date" 
                    value={formData.fechaPublicacion || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaCierre">Fecha de Cierre</Label>
                  <Input 
                    id="fechaCierre" 
                    name="fechaCierre"
                    type="date" 
                    value={formData.fechaCierre || ""}
                    onChange={handleInputChange}
                  />
              </div>
            </div>
          </div>
        </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/reclutador/vacantes")}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
            >
              {isSubmitting ? "Creando..." : "Crear Vacante"}
          </Button>
        </CardFooter>
      </Card>
      </form>
    </div>
  );
}

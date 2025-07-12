import { useState, useEffect } from "react";
import { BrainCircuit, Settings, Sparkles } from "lucide-react";
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

import { iaService } from "@/services/iaService";
import { authService } from "@/services/authService";
import { CreacionVacanteRequest } from "@/types/vacante";

interface FormularioVacanteProps {
  initialData?: Partial<CreacionVacanteRequest>;
  onSubmit: (formData: CreacionVacanteRequest, generarPrueba: boolean, pruebaTecnica: any) => Promise<void>;
  buttonText: string;
  isSubmitting: boolean;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function FormularioVacante({ 
  initialData, 
  onSubmit, 
  buttonText, 
  isSubmitting, 
  onCancel,
  isEditing = false
}: FormularioVacanteProps) {
  const [generandoDescripcion, setGenerandoDescripcion] = useState(false);
  const [generarPrueba, setGenerarPrueba] = useState(true);
  
  // Estados para los valores del formulario
  const [formData, setFormData] = useState<CreacionVacanteRequest>({
    titulo: "",
    descripcion: "",
    area: "",
    ubicacion: "",
    modalidad: "REMOTO",
    tipoContrato: "TIEMPO_COMPLETO",
    salarioMinimo: 0,
    salarioMaximo: 0,
    mostrarSalario: true,
    experienciaRequerida: "",
    experienciaMinima: undefined,
    habilidadesRequeridas: "No se requiere experiencia específica",
    requisitosAdicionales: "",
    beneficios: "",
    fechaPublicacion: new Date().toISOString().split('T')[0],
    fechaCierre: undefined
  });
  
  // Estados para configuración de prueba técnica
  const [pruebaTecnica, setPruebaTecnica] = useState({
    tipoPrueba: "ABIERTA",
    nivelDificultad: "intermediate",
    duracion: "60min",
    numPreguntas: 5
  });
  
  // Lista de habilidades para el campo habilidadesRequeridas
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [nuevaHabilidad, setNuevaHabilidad] = useState("");

  // Inicializar el formulario con datos si se proporcionan
  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
      
      // Inicializar lista de habilidades si hay datos
      if (initialData.habilidadesRequeridas) {
        const listaHabilidades = initialData.habilidadesRequeridas
          .split(",")
          .map(h => h.trim())
          .filter(h => h !== "");
        setHabilidades(listaHabilidades);
      }
    }
  }, [initialData]);

  // Manejar cambios en campos de texto e input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convertir explícitamente los valores numéricos
    if (name === 'salarioMinimo' || name === 'salarioMaximo' || name === 'experienciaMinima') {
      // Para el caso de campos vacíos, permitir que estén vacíos temporalmente
      // para facilitar la edición, pero consideramos 0 como valor válido para experienciaMinima
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

  // Generar descripción de vacante con IA
  const generarDescripcionConIA = async () => {
    // Verificar que al menos hay un título para la vacante
    if (!formData.titulo) {
      toast.error("Necesitas indicar al menos el título de la vacante para generar una descripción");
      return;
    }

    try {
      setGenerandoDescripcion(true);
      toast.info("Generando contenido con IA... Esto puede tardar unos segundos.");
      
      // Recopilar los parámetros necesarios para la generación
      const parametros = {
        titulo: formData.titulo,
        habilidadesExistentes: formData.habilidadesRequeridas,
        requisitosExistentes: formData.requisitosAdicionales,
        beneficiosExistentes: formData.beneficios,
        experiencia: formData.experienciaMinima,
        ubicacion: formData.ubicacion,
        tipoContrato: formData.tipoContrato,
        area: formData.area,
        modalidad: formData.modalidad
      };
      
      // Llamar al servicio de IA para generar el contenido completo
      const contenidoGenerado = await iaService.generarContenidoVacanteCompleto(parametros);
      
      // Depuración: mostrar lo que se recibió
      console.log("Contenido generado:", contenidoGenerado);
      
      // Procesar las habilidades para asegurar que se muestran correctamente
      let habilidadesActualizadas = contenidoGenerado.habilidades || [];
      
      // Depuración: mostrar las habilidades encontradas
      console.log("Habilidades encontradas:", habilidadesActualizadas);
      
      // Si no se generaron habilidades, mantener las actuales
      if (habilidadesActualizadas.length === 0 && habilidades.length > 0) {
        habilidadesActualizadas = habilidades;
        console.log("Usando habilidades existentes:", habilidadesActualizadas);
      }
      
      // Si hay demasiadas habilidades, limitarlas a un número razonable (8)
      if (habilidadesActualizadas.length > 8) {
        habilidadesActualizadas = habilidadesActualizadas.slice(0, 8);
        toast.info("Se han limitado las habilidades a 8 para mejorar la presentación.");
      }
      
      // Actualizar el estado de habilidades
      setHabilidades(habilidadesActualizadas);
      
      // Formatear el texto para mostrarlo correctamente
      const formatearTexto = (texto: string, esLista: boolean = false): string => {
        if (!texto) return "";
        
        if (esLista) {
          // Para requisitos y beneficios, convertir en lista con viñetas
          // Primero dividir por puntos o párrafos
          const items = texto
            .split(/\.\s+|\n+/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
          
          // Si no hay items separados claramente, intentar dividir por frases
          if (items.length <= 1 && texto.length > 50) {
            // Dividir por comas si hay varias
            const porComas = texto.split(/,\s+/);
            if (porComas.length > 1) {
              return porComas
                .map(item => item.trim())
                .filter(item => item.length > 0)
                .map(item => `• ${item}`)
                .join('\n');
            }
            
            // Si el texto es largo, intentar dividirlo en frases de tamaño razonable
            return texto
              .replace(/([.!?])\s+/g, '$1\n')
              .split('\n')
              .map(item => item.trim())
              .filter(item => item.length > 0)
              .map(item => `• ${item}`)
              .join('\n');
          }
          
          // Convertir cada item en un punto de lista
          return items
            .map(item => {
              // Eliminar viñetas existentes si las hay
              let limpio = item.replace(/^[•\-*]\s*/, '');
              // Asegurar que termina con punto
              if (limpio && !limpio.endsWith('.') && !limpio.endsWith('!') && !limpio.endsWith('?')) {
                limpio += '.';
              }
              return `• ${limpio}`;
            })
            .join('\n');
        } else {
          // Para descripción, solo asegurar que las líneas con guiones se muestren correctamente
          return texto.replace(/\n- /g, "\n• ")
                     .replace(/^- /gm, "• ");
        }
      };
      
      // Verificar que tenemos contenido para cada sección
      const descripcion = contenidoGenerado.descripcion || "";
      const requisitos = contenidoGenerado.requisitos || "";
      const beneficios = contenidoGenerado.beneficios || "";
      
      // Depuración: mostrar cada sección
      console.log("Descripción:", descripcion);
      console.log("Requisitos:", requisitos);
      console.log("Beneficios:", beneficios);
      
      // Asegurarnos de que no estamos llenando el formulario con datos vacíos
      if (!descripcion && !requisitos && !beneficios && habilidadesActualizadas.length === 0) {
        toast.error("No se pudo generar contenido. La respuesta del servidor está vacía o en formato incorrecto.");
        return;
      }
      
      // Si al menos tenemos algún contenido, usarlo
      const nuevoFormData = {
        ...formData,
      };
      
      if (descripcion) nuevoFormData.descripcion = formatearTexto(descripcion);
      if (requisitos) nuevoFormData.requisitosAdicionales = formatearTexto(requisitos, true);
      if (beneficios) nuevoFormData.beneficios = formatearTexto(beneficios, true);
      if (habilidadesActualizadas.length > 0) nuevoFormData.habilidadesRequeridas = habilidadesActualizadas.join(", ");
      
      // Actualizar todos los campos del formulario
      setFormData(nuevoFormData);
      
      toast.success("Contenido generado exitosamente. Revisa y ajusta según necesites.");
    } catch (error) {
      toast.error("Error al generar el contenido: " + (error instanceof Error ? error.message : "Error desconocido"));
      console.error("Error generando contenido:", error);
    } finally {
      setGenerandoDescripcion(false);
    }
  };

  // Enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    const camposObligatorios = [
      'titulo', 'descripcion', 'area', 'ubicacion', 
      'modalidad', 'tipoContrato', 'habilidadesRequeridas'
    ];
    
    const camposFaltantes = camposObligatorios.filter(campo => !formData[campo as keyof typeof formData]);
    if (camposFaltantes.length > 0) {
      toast.error(`Faltan campos obligatorios: ${camposFaltantes.join(', ')}`);
      return;
    }
    
    // Validar que el salario máximo sea mayor que el mínimo
    if (formData.salarioMinimo && formData.salarioMaximo && 
        formData.salarioMinimo > formData.salarioMaximo) {
      toast.error("El salario máximo debe ser mayor que el salario mínimo");
      return;
    }
    
    // Validar que la fecha de cierre sea posterior a la de publicación
    if (formData.fechaPublicacion && formData.fechaCierre) {
      const fechaPublicacion = new Date(formData.fechaPublicacion);
      const fechaCierre = new Date(formData.fechaCierre);
      
      if (fechaCierre <= fechaPublicacion) {
        toast.error("La fecha de cierre debe ser posterior a la fecha de publicación");
        return;
      }
    }
    
    // Asegurar que experienciaRequerida esté correctamente formateada
    const formDataFinal = {
      ...formData
    };
    
    // Si experienciaMinima es undefined, establecerlo a 0
    if (formDataFinal.experienciaMinima === undefined) {
      formDataFinal.experienciaMinima = 0;
    }
    
    // Formatear experienciaRequerida
    formDataFinal.experienciaRequerida = formDataFinal.experienciaMinima === 0 
      ? "Sin experiencia requerida" 
      : `${formDataFinal.experienciaMinima} ${formDataFinal.experienciaMinima === 1 ? "año" : "años"}`;
    
    await onSubmit(formDataFinal, generarPrueba, pruebaTecnica);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Vacante" : "Información de la Vacante"}</CardTitle>
          <CardDescription>{isEditing ? "Actualiza los detalles de la vacante" : "Completa los detalles de la nueva vacante"}</CardDescription>
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
                <Label htmlFor="experienciaMinima">Experiencia Requerida (años)</Label>
                <Input 
                  id="experienciaMinima" 
                  name="experienciaMinima"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.experienciaMinima !== undefined ? formData.experienciaMinima : ""}
                  onChange={handleInputChange}
                  placeholder="Ej. 0 para sin experiencia" 
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
              <div className="flex justify-between items-center">
                <Label htmlFor="descripcion">Descripción de la Vacante</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={generarDescripcionConIA}
                  disabled={generandoDescripcion || !formData.titulo}
                  className="flex items-center gap-1"
                >
                  {generandoDescripcion ? (
                    <>
                      <span className="animate-spin">
                        <Settings className="h-4 w-4" />
                      </span>
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-4 w-4" />
                      <span>Generar con IA</span>
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Describe las responsabilidades y el rol... o utiliza el botón 'Generar con IA'"
                className="min-h-[200px]"
                required
                maxLength={4000}
              />
              {!formData.titulo && (
                <p className="text-xs text-muted-foreground">
                  Para generar una descripción con IA, primero completa el título de la vacante.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requisitosAdicionales">Requisitos</Label>
              <Textarea
                id="requisitosAdicionales"
                name="requisitosAdicionales"
                value={formData.requisitosAdicionales || ""}
                onChange={handleInputChange}
                placeholder="Lista los requisitos y habilidades necesarias..."
                className="min-h-[200px]"
                maxLength={2000}
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
                className="min-h-[200px]"
                maxLength={2000}
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
                disabled={habilidades.join(", ").length >= 1900} 
              >
                Agregar
              </Button>
            </div>
              
            {habilidades.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <p className="w-full text-xs text-gray-500">{2000 - habilidades.join(", ").length} caracteres restantes</p>
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
          
          {!isEditing && (
            <>
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
                          <SelectItem value="ABIERTA">Pregunta Abierta</SelectItem>
                          <SelectItem value="OPCION_MULTIPLE">Opción Múltiple</SelectItem>
                          <SelectItem value="VERDADERO_FALSO">Verdadero/Falso</SelectItem>
                          <SelectItem value="CODIGO">Pregunta de Código</SelectItem>
                          <SelectItem value="TEORICA">Pregunta Teórica</SelectItem>
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
            </>
          )}

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
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
          >
            {isSubmitting ? "Procesando..." : buttonText}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 
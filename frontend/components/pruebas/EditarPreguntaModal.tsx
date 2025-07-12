"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Save, 
  Loader2,
  Plus,
  Trash2,
  X,
  Check,
  CircleCheck,
  BrainCircuit
} from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { iaService } from "@/services/iaService";

interface EditarPreguntaModalProps {
  pregunta: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (preguntaEditada: any) => void;
  reclutadorId: number;
  nivelDificultad: string;
}

export function EditarPreguntaModal({ 
  pregunta, 
  isOpen, 
  onClose, 
  onSave,
  reclutadorId,
  nivelDificultad
}: EditarPreguntaModalProps) {
  const [formData, setFormData] = useState({
    enunciado: pregunta?.enunciado || "",
    tipoPregunta: pregunta?.tipoPregunta || "ABIERTA",
    puntuacion: pregunta?.puntuacion || 10,
    opciones: pregunta?.opciones || (pregunta?.tipoPregunta === "VERDADERO_FALSO" ? "Verdadero|Falso" : ""),
    respuestaCorrecta: pregunta?.respuestaCorrecta || ""
  });
  
  const [opcionesList, setOpcionesList] = useState<string[]>([]);
  const [nuevaOpcion, setNuevaOpcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [generandoEnunciado, setGenerandoEnunciado] = useState(false);
  const esNuevaPregunta = !pregunta?.id;

  // Actualizar el formulario cuando cambia la pregunta
  useEffect(() => {
    if (pregunta) {
      // Manejo especial para opciones y respuesta correcta
      let opciones = pregunta.opciones || "";
      let respuestaCorrecta = pregunta.respuestaCorrecta || "";
      
      // Para VERDADERO_FALSO, asegurarse de tener las opciones correctas
      if (pregunta.tipoPregunta === "VERDADERO_FALSO") {
        opciones = "Verdadero|Falso";
        // Si no hay respuesta correcta, establecer "Verdadero" por defecto
        if (!respuestaCorrecta || (respuestaCorrecta !== "Verdadero" && respuestaCorrecta !== "Falso")) {
          respuestaCorrecta = "Verdadero";
        }
      }
      
      setFormData({
        enunciado: pregunta.enunciado || "",
        tipoPregunta: pregunta.tipoPregunta || "ABIERTA",
        opciones: opciones,
        respuestaCorrecta: respuestaCorrecta,
        puntuacion: pregunta.puntuacion || 10
      });
    }
  }, [pregunta]);

  // Cargar opciones al iniciar o cuando cambia la pregunta
  useEffect(() => {
    if (formData.opciones) {
      if (Array.isArray(formData.opciones)) {
        setOpcionesList(formData.opciones);
      } else if (typeof formData.opciones === 'string' && formData.opciones.trim() !== '') {
        setOpcionesList(formData.opciones.split('|').map((o: string) => o.trim()).filter((o: string) => o !== ''));
      } else {
        // Inicializar como array vacío
        setOpcionesList([]);
      }
    } else if (formData.tipoPregunta === "VERDADERO_FALSO") {
      // Asegurar que siempre tengamos opciones para VERDADERO_FALSO
      setOpcionesList(["Verdadero", "Falso"]);
    } else {
      setOpcionesList([]);
    }
  }, [formData.opciones, formData.tipoPregunta]);

  // Generar enunciado con IA
  const generarEnunciadoConIA = async () => {
    try {
      setGenerandoEnunciado(true);
      toast.info("Generando pregunta con IA...");
      
      // Obtener el tipo de pregunta seleccionado
      const tipoPregunta = formData.tipoPregunta;
      
      // Llamar al servicio de IA para generar la pregunta incluyendo el nivel de dificultad
      const respuesta = await iaService.generarPreguntaIA(tipoPregunta, nivelDificultad);
      
      if (respuesta && respuesta.pregunta) {
        // Actualizar el enunciado con la pregunta generada
        setFormData(prev => ({
          ...prev,
          enunciado: respuesta.pregunta
        }));
        
        // Si la respuesta incluye opciones y es una pregunta de opción múltiple
        if (respuesta.opciones && (tipoPregunta === "OPCION_MULTIPLE" || tipoPregunta === "VERDADERO_FALSO")) {
          const opcionesArray = respuesta.opciones.split('|').map((o: string) => o.trim()).filter((o: string) => o !== '');
          setOpcionesList(opcionesArray);
          setFormData(prev => ({
            ...prev,
            opciones: respuesta.opciones
          }));
          
          // Si hay una respuesta correcta
          if (respuesta.respuestaCorrecta) {
            setFormData(prev => ({
              ...prev,
              respuestaCorrecta: respuesta.respuestaCorrecta
            }));
          }
        }
        
        toast.success("Pregunta generada exitosamente");
      } else {
        toast.error("No se pudo generar la pregunta. Intente nuevamente.");
      }
    } catch (error) {
      console.error("Error al generar pregunta con IA:", error);
      toast.error("Error al generar la pregunta con IA");
    } finally {
      setGenerandoEnunciado(false);
    }
  };

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
    // Si cambia el tipo de pregunta, resetear opciones y respuesta correcta si ya no son necesarias
    if (name === "tipoPregunta" && value !== "OPCION_MULTIPLE" && value !== "VERDADERO_FALSO") {
      setFormData({
        ...formData,
        [name]: value,
        opciones: "",
        respuestaCorrecta: ""
      });
      setOpcionesList([]);
    } else if (name === "tipoPregunta" && value === "VERDADERO_FALSO") {
      // Si cambia a verdadero/falso, configurar opciones predeterminadas
      const opcionesVF = ["Verdadero", "Falso"];
      setOpcionesList(opcionesVF);
      setFormData(prev => ({
        ...prev,
        tipoPregunta: value,
        opciones: opcionesVF.join('|'),
        // Asegurarnos de que haya una respuesta correcta seleccionada
        respuestaCorrecta: prev.respuestaCorrecta === "Verdadero" || prev.respuestaCorrecta === "Falso" 
          ? prev.respuestaCorrecta 
          : "Verdadero"
      }));
    } else if (name === "tipoPregunta" && value === "OPCION_MULTIPLE") {
      // Si cambia a opción múltiple, mantener las opciones anteriores si las hay
      setFormData({
        ...formData,
        [name]: value
      });
      // Si no hay opciones, inicializar con una lista vacía
      if (opcionesList.length === 0) {
        setOpcionesList([]);
      }
    } else {
      // Para otros cambios, simplemente actualizar el valor
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Manejar cambio en número
  const handleNumberChange = (name: string, value: string) => {
    // Permitir que el campo esté vacío temporalmente
    if (value === '') {
      setFormData({
        ...formData,
        [name]: 0
      });
      return;
    }
    
    const parsedValue = parseInt(value);
    if (!isNaN(parsedValue)) {
      setFormData({
        ...formData,
        [name]: parsedValue
      });
    }
  };
  
  // Agregar nueva opción
  const handleAgregarOpcion = () => {
    if (nuevaOpcion.trim() !== '') {
      const nuevasOpciones = [...opcionesList, nuevaOpcion.trim()];
      setOpcionesList(nuevasOpciones);
      setFormData({
        ...formData,
        opciones: nuevasOpciones.join('|')
      });
      setNuevaOpcion('');
    }
  };
  
  // Eliminar opción
  const handleEliminarOpcion = (index: number) => {
    const nuevasOpciones = [...opcionesList];
    nuevasOpciones.splice(index, 1);
    setOpcionesList(nuevasOpciones);
    setFormData({
      ...formData,
      opciones: nuevasOpciones.join('|'),
      // Si se elimina la opción correcta, resetear la respuesta correcta
      respuestaCorrecta: formData.respuestaCorrecta === opcionesList[index] ? '' : formData.respuestaCorrecta
    });
  };
  
  // Establecer respuesta correcta
  const handleSetRespuestaCorrecta = (opcion: string) => {
    setFormData({
      ...formData,
      respuestaCorrecta: opcion
    });
  };

  // Guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setGuardando(true);
      
      // Validar que haya una respuesta correcta para preguntas de opción múltiple o verdadero/falso
      if ((formData.tipoPregunta === "OPCION_MULTIPLE" || formData.tipoPregunta === "VERDADERO_FALSO") 
          && (!formData.respuestaCorrecta || formData.respuestaCorrecta.trim() === '')) {
        toast.error("Debes seleccionar una respuesta correcta");
        setGuardando(false);
        return;
      }

      // Para VERDADERO_FALSO, asegurarse de que la respuesta correcta sea "Verdadero" o "Falso"
      if (formData.tipoPregunta === "VERDADERO_FALSO" && 
          formData.respuestaCorrecta !== "Verdadero" && 
          formData.respuestaCorrecta !== "Falso") {
        setFormData(prev => ({
          ...prev,
          respuestaCorrecta: "Verdadero"
        }));
      }
      
      // Preparar los datos de la pregunta
      const preguntaData = {
        ...formData,
        pruebaTecnicaId: pregunta.pruebaTecnicaId,
        id: pregunta.id || null,
        orden: pregunta.orden || 1,
        // Asegurar que las opciones estén en el formato correcto
        opciones: opcionesList.length > 0 ? opcionesList.join('|') : formData.opciones
      };
      
      // En lugar de enviar al servidor, devolvemos los datos al componente padre
      onSave(preguntaData);
      
      // Ya no cerramos el modal aquí, lo hará el componente padre
    } catch (error) {
      console.error("Error al procesar la pregunta:", error);
      toast.error(`Error al procesar la pregunta`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{esNuevaPregunta ? "Crear Nueva Pregunta" : "Editar Pregunta"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="enunciado">Enunciado de la Pregunta</Label>
              {esNuevaPregunta && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={generarEnunciadoConIA}
                  disabled={generandoEnunciado}
                >
                  {generandoEnunciado ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-4 w-4 mr-1" />
                      Generar con IA
                    </>
                  )}
                </Button>
              )}
            </div>
            <Textarea
              id="enunciado"
              name="enunciado"
              value={formData.enunciado}
              onChange={handleInputChange}
              placeholder="Escribe el enunciado de la pregunta"
              rows={4}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipoPregunta">Tipo de Pregunta</Label>
              <Select 
                value={formData.tipoPregunta} 
                onValueChange={(value) => handleSelectChange("tipoPregunta", value)}
              >
                <SelectTrigger id="tipoPregunta">
                  <SelectValue placeholder="Selecciona el tipo" />
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
            
            <div>
              <Label htmlFor="puntuacion">Puntuación</Label>
              <Input
                id="puntuacion"
                name="puntuacion"
                type="number"
                min={1}
                max={100}
                value={formData.puntuacion || ''}
                onChange={(e) => handleNumberChange("puntuacion", e.target.value)}
                required
              />
            </div>
          </div>
          
          {(formData.tipoPregunta === "OPCION_MULTIPLE" || formData.tipoPregunta === "VERDADERO_FALSO") && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Opciones de Respuesta</Label>
                {formData.tipoPregunta === "OPCION_MULTIPLE" && (
                  <Badge variant="outline" className="text-xs">
                    {opcionesList.length} opciones
                  </Badge>
                )}
              </div>
              
              {/* Lista de opciones existentes */}
              <div className="space-y-2">
                {opcionesList.map((opcion, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                    <Button 
                      type="button" 
                      variant={formData.respuestaCorrecta === opcion ? "default" : "outline"} 
                      size="icon" 
                      className="h-6 w-6 rounded-full"
                      onClick={() => handleSetRespuestaCorrecta(opcion)}
                    >
                      {formData.respuestaCorrecta === opcion ? 
                        <Check className="h-4 w-4" /> : 
                        <CircleCheck className="h-4 w-4" />
                      }
                    </Button>
                    <span className="flex-grow">{opcion}</span>
                    {formData.tipoPregunta === "OPCION_MULTIPLE" && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive" 
                        onClick={() => handleEliminarOpcion(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Agregar nueva opción (solo para opción múltiple) */}
              {formData.tipoPregunta === "OPCION_MULTIPLE" && (
                <div className="flex gap-2 items-center">
                  <Input
                    value={nuevaOpcion}
                    onChange={(e) => setNuevaOpcion(e.target.value)}
                    placeholder="Nueva opción"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nuevaOpcion.trim() !== '') {
                        e.preventDefault();
                        handleAgregarOpcion();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={handleAgregarOpcion}
                    disabled={nuevaOpcion.trim() === ''}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="bg-muted p-2 rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <CircleCheck className="h-4 w-4 text-primary" />
                  <span>Haz clic en el círculo para marcar la respuesta correcta</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? (
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
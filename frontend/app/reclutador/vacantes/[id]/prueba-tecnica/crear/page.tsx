"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, BrainCircuit, Sparkles, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { authService } from "@/services/authService";
import { vacanteService } from "@/services/vacanteService";
import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";

export default function CrearPruebaTecnica() {
  const params = useParams();
  const router = useRouter();
  const vacanteId = Number(params.id);

  const [vacante, setVacante] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuración de la prueba técnica
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    tipoPrueba: "coding",
    nivelDificultad: "intermediate",
    duracion: "60min",
    numPreguntas: "5"
  });

  // Cargar información de la vacante
  useEffect(() => {
    const cargarVacante = async () => {
      try {
        const data = await vacanteService.obtenerVacantePorId(vacanteId);
        setVacante(data);
        
        // Inicializar el título y descripción con datos de la vacante
        setFormData({
          ...formData,
          titulo: `Prueba técnica para ${data.titulo}`,
          descripcion: `Evaluación de habilidades técnicas para la posición de ${data.titulo}`
        });
        
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

  // Generar prueba técnica
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setGenerando(true);
      
      // Obtener el ID del reclutador del usuario autenticado
      const usuario = authService.getUsuario();
      if (!usuario || !usuario.id) {
        toast.error("No se pudo obtener la información del usuario");
        setGenerando(false);
        return;
      }
      
      // Validar campos obligatorios
      if (!formData.titulo || !formData.descripcion) {
        toast.error("El título y la descripción son obligatorios");
        setGenerando(false);
        return;
      }
      
      // Determinar el número de preguntas según la selección
      const numPreguntas = parseInt(formData.numPreguntas);
      
      toast.info("Generando prueba técnica con IA...");
      
      // Generar la prueba técnica
      const prueba = await pruebaTecnicaService.generarPruebaConIA(
        vacanteId,
        usuario.id,
        formData.titulo,
        formData.descripcion,
        numPreguntas
      );
      
      toast.success("Prueba técnica generada exitosamente");
      
      // Redireccionar a la lista de pruebas técnicas de la vacante
      router.push(`/reclutador/vacantes/${vacanteId}`);
    } catch (error) {
      toast.error("Error al generar la prueba técnica: " + (error instanceof Error ? error.message : "Error desconocido"));
      console.error("Error generando prueba técnica:", error);
      setGenerando(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/reclutador/vacantes/${vacanteId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Crear Prueba Técnica</h2>
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
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generar Prueba con IA</CardTitle>
                  <CardDescription>Configura los parámetros para la prueba técnica</CardDescription>
                </div>
                <Badge className="bg-[#38bdf8] text-white flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Potenciado por IA</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título de la Prueba</Label>
                <Input
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  placeholder="Ej. Prueba técnica para Desarrollador Frontend"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe el propósito de la prueba técnica..."
                  className="min-h-[100px]"
                  required
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoPrueba">Tipo de Prueba</Label>
                  <Select
                    value={formData.tipoPrueba}
                    onValueChange={(value) => handleSelectChange("tipoPrueba", value)}
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
                    value={formData.nivelDificultad}
                    onValueChange={(value) => handleSelectChange("nivelDificultad", value)}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración Estimada</Label>
                  <Select
                    value={formData.duracion}
                    onValueChange={(value) => handleSelectChange("duracion", value)}
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
                    value={formData.numPreguntas}
                    onValueChange={(value) => handleSelectChange("numPreguntas", value)}
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

              <div className="rounded-lg bg-blue-50 p-4 text-blue-800 space-y-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5" />
                  <h3 className="font-semibold">Información sobre la Generación con IA</h3>
                </div>
                <p className="text-sm">
                  La IA generará preguntas personalizadas basadas en el perfil de la vacante y los requisitos técnicos.
                  Las preguntas considerarán el nivel de dificultad y las habilidades requeridas en la vacante.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push(`/reclutador/vacantes/${vacanteId}`)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={generando}
                className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
              >
                {generando ? (
                  <>
                    <Settings className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    Generar Prueba
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
} 
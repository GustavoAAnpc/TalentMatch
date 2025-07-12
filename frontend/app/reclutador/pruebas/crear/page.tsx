"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  BrainCircuit, 
  Sparkles, 
  Save,
  Loader2,
  Building,
  Plus,
  User,
  X,
  FileText,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

import { pruebaTecnicaService } from "@/services/pruebaTecnicaService";
import { vacanteService } from "@/services/vacanteService";
import { authService } from "@/services/authService";

export default function CrearPruebaTecnicaPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [generandoDescripcion, setGenerandoDescripcion] = useState(false);
  const [generandoTecnologias, setGenerandoTecnologias] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vacantes, setVacantes] = useState<any[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [nuevaTecnologia, setNuevaTecnologia] = useState('');
  
  // Configuración de la prueba técnica
  const [formData, setFormData] = useState({
    vacanteId: "",
    titulo: "",
    descripcion: "",
    instrucciones: "Por favor, lee atentamente cada pregunta y proporciona respuestas claras y concisas. Asegúrate de explicar tu razonamiento cuando sea necesario.",
    tiempoLimiteMinutos: 60,
    nivelDificultad: "INTERMEDIO",
    tecnologias: "",
    usarIA: true
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        
        // Obtener el usuario actual
        const user = authService.getUsuario();
        if (!user || !user.id) {
          toast.error("No se pudo identificar al usuario. Inicie sesión nuevamente.");
          router.push("/login");
          return;
        }
        
        setUsuario(user);
        
        // Verificar permisos
        if (user.rol !== "RECLUTADOR" && user.rol !== "ADMINISTRADOR") {
          toast.error("No tienes permisos para acceder a esta sección");
          router.push("/dashboard");
          return;
        }
        
        // Cargar vacantes del reclutador
        console.log("Cargando vacantes para el reclutador:", user.id);
        const vacantesData = await vacanteService.obtenerVacantesReclutador(user.id);
        console.log("Vacantes cargadas:", vacantesData);
        
        // Verificar si las vacantes tienen habilidades requeridas
        if (Array.isArray(vacantesData)) {
          vacantesData.forEach((vacante, index) => {
            console.log(`Vacante ${index + 1}:`, vacante.titulo);
            console.log(`Habilidades de vacante ${index + 1}:`, vacante.habilidadesRequeridas);
          });
        }
        
        setVacantes(vacantesData);
        
        setCargando(false);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        setError("Error al cargar los datos iniciales. Intente nuevamente.");
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [router]);

  // Actualizar título y descripción al seleccionar una vacante
  useEffect(() => {
    if (formData.vacanteId && formData.vacanteId !== "0") {
      const vacanteSeleccionada = vacantes.find(v => v.id === parseInt(formData.vacanteId));
      if (vacanteSeleccionada) {
        // Mostrar la vacante completa para depuración
        console.log("Vacante seleccionada completa:", vacanteSeleccionada);
        
        // Extraer las tecnologías de la vacante seleccionada
        const tecnologiasVacante = vacanteSeleccionada.habilidadesRequeridas || "";
        console.log("Tecnologías cargadas desde vacante:", tecnologiasVacante);
        console.log("Tipo de datos de tecnologiasVacante:", typeof tecnologiasVacante);
        
        // Usar el callback pattern para asegurar el estado más reciente
        setFormData(prevData => {
          const updatedData = {
            ...prevData,
            titulo: `Prueba técnica para ${vacanteSeleccionada.titulo}`,
            descripcion: `Evaluación de habilidades técnicas para la posición de ${vacanteSeleccionada.titulo}`,
            tecnologias: tecnologiasVacante
          };
          
          // Log inmediato del nuevo estado
          console.log("Nuevo estado formData:", updatedData);
          return updatedData;
        });
      }
    } else {
      // Si se selecciona "Sin asociar a vacante", limpiar campos
      setFormData(prevData => ({
        ...prevData,
        titulo: "",
        descripcion: "",
        tecnologias: ""
      }));
    }
  }, [formData.vacanteId, vacantes]);

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
    if (name === "vacanteId") {
      // Si se está cambiando la vacante, actualizar el estado directamente
      // (el useEffect se encargará de actualizar los demás campos)
      setFormData({
        ...formData,
        vacanteId: value
      });
    } else {
      // Para otros selects, actualizar normalmente
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Manejar cambio en checkbox
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  // Manejar cambio en número
  const handleNumberChange = (name: string, value: string) => {
    const parsedValue = parseInt(value);
    if (!isNaN(parsedValue)) {
      setFormData({
        ...formData,
        [name]: parsedValue
      });
    }
  };

  // Crear prueba técnica
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setEnviando(true);
      
      if (!usuario || !usuario.id) {
        toast.error("No se pudo identificar al usuario");
        return;
      }
      
      // Validar que haya un título si no hay vacante asociada
      if ((!formData.vacanteId || formData.vacanteId === "0") && (!formData.titulo || formData.titulo.trim() === "")) {
        toast.error("Debes ingresar un título para la prueba técnica");
        setEnviando(false);
        return;
      }
      
      // Validar que haya al menos una tecnología
      if (!formData.tecnologias || formData.tecnologias.trim() === "") {
        toast.error("Debes agregar al menos una tecnología para la prueba técnica");
        setEnviando(false);
        return;
      }
      
      const pruebaData = {
        vacanteId: formData.vacanteId && formData.vacanteId !== "0" ? parseInt(formData.vacanteId) : null,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        instrucciones: formData.instrucciones,
        tiempoLimiteMinutos: formData.tiempoLimiteMinutos,
        nivelDificultad: formData.nivelDificultad,
        tecnologias: formData.tecnologias
      };
      
      // Si se seleccionó usar IA
      if (formData.usarIA) {
        setGenerando(true);
        
        if (formData.vacanteId && formData.vacanteId !== "0") {
          // Si hay una vacante seleccionada, usar el método de generación con IA basado en vacante
          await pruebaTecnicaService.generarPruebaConIA(
            parseInt(formData.vacanteId),
            usuario.id,
            formData.titulo,
            formData.descripcion,
            5 // Número de preguntas predeterminado
          );
        } else {
          // Si no hay vacante, pero hay título y descripción, generar basado en estos datos
          await pruebaTecnicaService.generarPruebaConIAPorTitulo(
            usuario.id,
            formData.titulo,
            formData.descripcion,
            formData.tecnologias,
            5 // Número de preguntas predeterminado
          );
        }
        
        setGenerando(false);
        toast.success("Prueba técnica generada con éxito");
        router.push("/reclutador/pruebas");
      } else {
        // Crear prueba manualmente
        await pruebaTecnicaService.crearPruebaTecnica(usuario.id, pruebaData);
        toast.success("Prueba técnica creada con éxito");
        router.push("/reclutador/pruebas");
      }
      
    } catch (error) {
      console.error("Error al crear la prueba técnica:", error);
      toast.error("Error al crear la prueba técnica");
    } finally {
      setEnviando(false);
      setGenerando(false);
    }
  };

  // Generar preguntas con IA
  const generarPreguntasConIA = async () => {
    if (!formData.vacanteId || formData.vacanteId === "0") {
      toast.error("Debes seleccionar una vacante para generar preguntas con IA");
      return;
    }
    
    try {
      setGenerando(true);
      const preguntas = await pruebaTecnicaService.generarPreguntasConIA(
        parseInt(formData.vacanteId),
        usuario.id
      );
      
      // Mostrar las preguntas generadas
      toast.success(`Se han generado ${preguntas.length} preguntas con IA`);
      
    } catch (error) {
      console.error("Error al generar preguntas con IA:", error);
      toast.error("Error al generar preguntas con IA");
    } finally {
      setGenerando(false);
    }
  };

  // Generar descripción con IA
  const generarDescripcionConIA = async () => {
    try {
      setGenerandoDescripcion(true);
      
      if (!usuario || !usuario.id) {
        toast.error("No se pudo identificar al usuario");
        return;
      }
      
      // Verificar si hay una vacante seleccionada
      if (formData.vacanteId && formData.vacanteId !== "0") {
        // Si hay una vacante, generar solo la descripción basada en la vacante
        const resultado = await pruebaTecnicaService.generarDescripcionYTecnologias(
          parseInt(formData.vacanteId), 
          usuario.id
        );
        
        // Actualizar solo la descripción (tecnologías ya se cargan desde la vacante)
        setFormData({
          ...formData,
          descripcion: resultado.descripcion
        });
        
        toast.success("Se ha generado la descripción con IA basada en la vacante");
      } else {
        // Si no hay vacante, verificar que hay un título
        if (!formData.titulo || formData.titulo.trim() === "") {
          toast.error("Debes ingresar un título para generar la descripción con IA");
          return;
        }
        
        // Generar descripción y tecnologías basadas solo en el título
        const resultado = await pruebaTecnicaService.generarDescripcionYTecnologiasPorTitulo(
          formData.titulo,
          usuario.id
        );
        
        // Actualizar ambos campos
        setFormData({
          ...formData,
          descripcion: resultado.descripcion,
          tecnologias: resultado.tecnologias
        });
        
        // Limpiar el campo de nueva tecnología si hay uno en proceso
        setNuevaTecnologia('');
        
        toast.success("Se ha generado la descripción y tecnologías con IA basadas en el título");
      }
    } catch (error) {
      console.error("Error al generar descripción con IA:", error);
      toast.error("Error al generar la descripción con IA");
    } finally {
      setGenerandoDescripcion(false);
    }
  };
  
  // Regenerar tecnologías con IA
  const regenerarTecnologiasConIA = async () => {
    try {
      setGenerandoTecnologias(true);
      
      if (!usuario || !usuario.id) {
        toast.error("No se pudo identificar al usuario");
        return;
      }
      
      // Verificar si hay una vacante seleccionada o un título
      if (formData.vacanteId && formData.vacanteId !== "0") {
        // Si hay una vacante, usar ese contexto
        const resultado = await pruebaTecnicaService.generarDescripcionYTecnologias(
          parseInt(formData.vacanteId), 
          usuario.id
        );
        
        console.log("Tecnologías generadas con IA:", resultado.tecnologias);
        
        // Actualizar solo las tecnologías usando el callback pattern
        setFormData(prevData => ({
          ...prevData,
          tecnologias: resultado.tecnologias
        }));
        
        toast.success("Se han generado las tecnologías con IA");
      } else if (formData.titulo && formData.titulo.trim() !== "") {
        // Si no hay vacante pero hay título, usar el título
        const resultado = await pruebaTecnicaService.generarDescripcionYTecnologiasPorTitulo(
          formData.titulo,
          usuario.id
        );
        
        console.log("Tecnologías generadas con IA por título:", resultado.tecnologias);
        
        // Actualizar solo las tecnologías usando el callback pattern
        setFormData(prevData => ({
          ...prevData,
          tecnologias: resultado.tecnologias
        }));
        
        toast.success("Se han generado las tecnologías con IA basadas en el título");
      } else {
        toast.error("Debes seleccionar una vacante o ingresar un título para generar tecnologías");
        return;
      }
      
      // Limpiar el campo de nueva tecnología
      setNuevaTecnologia('');
      
    } catch (error) {
      console.error("Error al generar tecnologías con IA:", error);
      toast.error("Error al generar las tecnologías con IA");
    } finally {
      setGenerandoTecnologias(false);
    }
  };

  // Función para mostrar las tecnologías como badges
  const mostrarTecnologias = () => {
    console.log("Mostrando tecnologías:", formData.tecnologias);
    console.log("Tipo de datos en mostrarTecnologias:", typeof formData.tecnologias);
    
    // Si no hay tecnologías o es un string vacío
    if (!formData.tecnologias || 
        (typeof formData.tecnologias === 'string' && formData.tecnologias.trim() === '')) {
      return (
        <div className="text-sm text-muted-foreground italic px-2 py-1">
          No hay tecnologías seleccionadas
        </div>
      );
    }
    
    // Asegurar que estamos trabajando con un string
    let tecnologiasStr = String(formData.tecnologias);
    console.log("Tecnologías como string:", tecnologiasStr);
    
    // Dividir por comas y limpiar cada tecnología
    const tecnologiasArray = tecnologiasStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t !== '');
    
    console.log("Array de tecnologías procesado:", tecnologiasArray);
    
    if (tecnologiasArray.length === 0) {
      return (
        <div className="text-sm text-muted-foreground italic px-2 py-1">
          No hay tecnologías seleccionadas
        </div>
      );
    }
    
    // Mostrar máximo 10 tecnologías
    const tecnologiasLimitadas = tecnologiasArray.slice(0, 10);
    
    return tecnologiasLimitadas.map((tech, index) => (
      <Badge key={index} className="flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs">
        {tech}
        <button
          type="button"
          onClick={() => eliminarTecnologia(index)}
          className="ml-1 rounded-full hover:bg-primary-foreground/20"
        >
          <X className="h-2.5 w-2.5" />
          <span className="sr-only">Eliminar</span>
        </button>
      </Badge>
    ));
  };

  // Función para agregar una tecnología
  const agregarTecnologia = () => {
    if (nuevaTecnologia.trim() === '') return;
    
    // Añadir logs para depuración
    console.log("Agregando tecnología:", nuevaTecnologia);
    console.log("Tecnologías actuales:", formData.tecnologias);
    
    // Convertir el string de tecnologías a un array, manejando el caso de string vacío
    const tecnologiasArray = formData.tecnologias 
      ? String(formData.tecnologias).split(',').filter(t => t.trim() !== '')
      : [];
    
    // Verificar si ya hay 10 tecnologías
    if (tecnologiasArray.length >= 10) {
      toast.info("Ya has alcanzado el límite de 10 tecnologías");
      return;
    }
    
    // Evitar duplicados (no sensible a mayúsculas/minúsculas)
    if (!tecnologiasArray.some(t => t.toLowerCase() === nuevaTecnologia.trim().toLowerCase())) {
      tecnologiasArray.push(nuevaTecnologia.trim());
      
      // Convertir de nuevo a string y actualizar el estado
      const tecnologiasString = tecnologiasArray.join(',');
      console.log("Nuevas tecnologías:", tecnologiasString);
      
      setFormData(prevData => ({
        ...prevData,
        tecnologias: tecnologiasString
      }));
    } else {
      toast.info("Esta tecnología ya está en la lista");
    }
    
    setNuevaTecnologia('');
  };
  
  // Función para eliminar una tecnología
  const eliminarTecnologia = (index: number) => {
    console.log("Eliminando tecnología en índice:", index);
    console.log("Tecnologías actuales:", formData.tecnologias);
    
    // Convertir el string a array
    const tecnologiasArray = String(formData.tecnologias).split(',').filter(t => t.trim() !== '');
    
    if (index >= 0 && index < tecnologiasArray.length) {
      const tecnologiaEliminada = tecnologiasArray[index];
      tecnologiasArray.splice(index, 1);
      
      // Convertir de nuevo a string y actualizar el estado
      const tecnologiasString = tecnologiasArray.join(',');
      console.log(`Tecnología "${tecnologiaEliminada}" eliminada`);
      console.log("Tecnologías restantes:", tecnologiasString);
      
      setFormData(prevData => ({
        ...prevData,
        tecnologias: tecnologiasString
      }));
    } else {
      console.error("Índice fuera de rango al eliminar tecnología:", index);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/reclutador/pruebas">
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
                  <CardTitle>Nueva Prueba Técnica</CardTitle>
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
                <Label htmlFor="vacanteId">Vacante Asociada</Label>
                <Select
                  value={formData.vacanteId}
                  onValueChange={(value) => handleSelectChange("vacanteId", value)}
                >
                  <SelectTrigger id="vacanteId" className={formData.vacanteId === "0" ? "border-dashed" : ""}>
                    <SelectValue placeholder="Seleccionar vacante (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin asociar a vacante</SelectItem>
                    {vacantes.map((vacante) => (
                      <SelectItem key={vacante.id} value={vacante.id.toString()}>
                        {vacante.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.vacanteId && formData.vacanteId !== "0" 
                    ? "La prueba usará las tecnologías de la vacante seleccionada. La descripción se puede generar con IA."
                    : "Ingresa un título para poder generar contenido con IA."
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo" className={!formData.vacanteId || formData.vacanteId === "0" ? "font-semibold" : ""}>
                  Título de la Prueba
                  {!formData.vacanteId || formData.vacanteId === "0" ? <span className="text-red-500 ml-1">*</span> : null}
                </Label>
                <Input
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  placeholder={formData.vacanteId && formData.vacanteId !== "0" 
                    ? "Generado automáticamente desde la vacante" 
                    : "Ej. Prueba técnica para Desarrollador Frontend"
                  }
                  className={!formData.vacanteId || formData.vacanteId === "0" ? "border-blue-300 focus:border-blue-400 focus:ring-blue-400" : ""}
                  disabled={!!(formData.vacanteId && formData.vacanteId !== "0")}
                  required
                />
                {!formData.vacanteId || formData.vacanteId === "0" ? (
                  <p className="text-xs text-blue-600">
                    <BrainCircuit className="h-3 w-3 inline mr-1" />
                    Un título claro permitirá generar mejor contenido con IA
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={generarDescripcionConIA}
                    disabled={generandoDescripcion || 
                      ((!formData.vacanteId || formData.vacanteId === "0") && 
                      (!formData.titulo || formData.titulo.trim() === ""))}
                    className="h-8 gap-1"
                    title={(!formData.vacanteId || formData.vacanteId === "0") && (!formData.titulo || formData.titulo.trim() === "") 
                      ? "Necesitas seleccionar una vacante o ingresar un título" 
                      : "Generar descripción con IA"
                    }
                  >
                    {generandoDescripcion ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="h-3.5 w-3.5" />
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
                  placeholder="Describe el propósito de la prueba técnica..."
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrucciones">Instrucciones para el Candidato</Label>
                <Textarea
                  id="instrucciones"
                  name="instrucciones"
                  value={formData.instrucciones}
                  onChange={handleInputChange}
                  placeholder="Instrucciones detalladas para completar la prueba..."
                  className="min-h-[100px]"
                  required
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <SelectItem value="BASICO">Básico</SelectItem>
                      <SelectItem value="INTERMEDIO">Intermedio</SelectItem>
                      <SelectItem value="AVANZADO">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiempoLimiteMinutos">Tiempo Límite (minutos)</Label>
                  <Select
                    value={formData.tiempoLimiteMinutos.toString()}
                    onValueChange={(value) => handleNumberChange("tiempoLimiteMinutos", value)}
                  >
                    <SelectTrigger id="tiempoLimiteMinutos">
                      <SelectValue placeholder="Seleccionar tiempo límite" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1.5 horas</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                      <SelectItem value="180">3 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="tecnologias">Tecnologías y Habilidades</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={regenerarTecnologiasConIA}
                    disabled={generandoTecnologias || 
                      ((!formData.vacanteId || formData.vacanteId === "0") && 
                      (!formData.titulo || formData.titulo.trim() === ""))}
                    className="h-8 gap-1"
                    title={(!formData.vacanteId || formData.vacanteId === "0") && (!formData.titulo || formData.titulo.trim() === "") 
                      ? "Necesitas seleccionar una vacante o ingresar un título" 
                      : "Regenerar tecnologías con IA"
                    }
                  >
                    {generandoTecnologias ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Regenerar con IA</span>
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="nuevaTecnologia"
                      placeholder="Escribe una tecnología"
                      value={nuevaTecnologia}
                      onChange={(e) => setNuevaTecnologia(e.target.value)}
                      className="flex-grow"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && nuevaTecnologia.trim() !== '') {
                          e.preventDefault();
                          agregarTecnologia();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={agregarTecnologia}
                      disabled={!nuevaTecnologia.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                    {mostrarTecnologias()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.vacanteId && formData.vacanteId !== "0" 
                      ? formData.tecnologias && formData.tecnologias.trim() !== '' 
                        ? "Tecnologías y habilidades cargadas desde la vacante seleccionada. Puedes modificarlas si es necesario."
                        : "No se encontraron tecnologías en la vacante seleccionada. Agrega las tecnologías y habilidades necesarias."
                      : "Agrega las tecnologías y habilidades que se evaluarán en la prueba técnica."
                    }
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="usarIA" 
                    checked={formData.usarIA}
                    onCheckedChange={(checked) => handleCheckboxChange("usarIA", checked as boolean)}
                    disabled={(!formData.vacanteId || formData.vacanteId === "0") && (!formData.titulo || formData.titulo.trim() === "" || !formData.descripcion || formData.descripcion.trim() === "")}
                  />
                  <Label 
                    htmlFor="usarIA" 
                    className={`flex items-center gap-2 ${((!formData.vacanteId || formData.vacanteId === "0") && (!formData.titulo || formData.titulo.trim() === "" || !formData.descripcion || formData.descripcion.trim() === "")) ? "text-muted-foreground" : ""}`}
                  >
                    <span>Generar prueba automáticamente con IA</span>
                    <Badge className="bg-[#38bdf8]">
                      <BrainCircuit className="h-3 w-3 mr-1" />
                      <span>Recomendado</span>
                    </Badge>
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  {formData.vacanteId && formData.vacanteId !== "0" 
                    ? "La IA analizará la vacante seleccionada y generará preguntas relevantes para evaluar las habilidades requeridas."
                    : formData.titulo && formData.titulo.trim() !== "" && formData.descripcion && formData.descripcion.trim() !== ""
                      ? "La IA analizará el título y la descripción proporcionados para generar preguntas relevantes."
                      : "Para usar esta opción necesitas proporcionar al menos un título y una descripción para la prueba."
                  }
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" asChild disabled={enviando || generando}>
                  <Link href="/reclutador/pruebas">
                    Cancelar
                  </Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={enviando || generando}
                  className="gap-2"
                >
                  {(enviando || generando) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {generando ? "Generando Prueba..." : enviando ? "Guardando..." : "Crear Prueba Técnica"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
} 
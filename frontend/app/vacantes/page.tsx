"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { JobCard } from "@/components/job-card"
import { Search, Filter, AlertTriangle } from "lucide-react"
import { vacanteService } from "@/services/vacanteService"
import { VacanteResumenResponse } from "@/types/vacante"
import { authService } from "@/services/authService"

export default function VacantesPage() {
  const [vacantes, setVacantes] = useState<VacanteResumenResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [busqueda, setBusqueda] = useState("")
  const [ubicacion, setUbicacion] = useState("todas")
  const [tipoContrato, setTipoContrato] = useState("todos")
  
  useEffect(() => {
    const cargarVacantes = async () => {
      try {
        setCargando(true)
        
        // Verificar autenticación
        const token = authService.getToken();
        if (!token) {
          console.log("No hay token de autenticación disponible");
        }
        
        // Primera opción: intentar con el endpoint específico
        try {
          console.log("Intentando cargar vacantes activas...");
          const data = await vacanteService.obtenerVacantesActivas();
          console.log(`Se cargaron ${data?.length || 0} vacantes activas`);
          setVacantes(data);
          setCargando(false);
          return;
        } catch (errorActivas) {
          console.error("Error al cargar vacantes activas:", errorActivas);
          console.log("Intentando con método alternativo...");
        }
        
        // Segunda opción: usar el endpoint genérico con estado=ACTIVA
        try {
          console.log("Intentando cargar todas las vacantes con filtro de estado...");
          const data = await vacanteService.obtenerVacantes(0, 50, "ACTIVA");
          console.log(`Se cargaron ${data?.length || 0} vacantes desde endpoint genérico`);
          setVacantes(data || []);
          setCargando(false);
          return;
        } catch (errorGenerico) {
          console.error("Error al cargar vacantes genéricas:", errorGenerico);
          
          // Tercera opción: intentar con endpoint público sin autenticación
          try {
            console.log("Intentando cargar vacantes públicas sin autenticación...");
            const data = await vacanteService.obtenerVacantesPublicas();
            console.log(`Se cargaron ${data?.length || 0} vacantes públicas`);
            setVacantes(data || []);
            setCargando(false);
            return;
          } catch (errorPublicas) {
            console.error("Error al cargar vacantes públicas:", errorPublicas);
            throw new Error("No se pudieron cargar las vacantes por ningún método");
          }
        }
        
      } catch (err: any) {
        console.error("Error al cargar las vacantes:", err)
        
        // Mostrar mensaje de error más específico
        if (err?.message?.includes("No tienes permiso")) {
          setError("No tienes permisos suficientes para ver las vacantes. Por favor, inicia sesión nuevamente.")
        } else if (err?.message?.includes("401")) {
          setError("Sesión inválida o expirada. Por favor, inicia sesión nuevamente.")
        } else {
          setError(`No se pudieron cargar las vacantes: ${err?.message || "Error desconocido"}`)
        }
        
        setCargando(false)
      }
    }
    
    cargarVacantes()
  }, [])

  // Filtrar vacantes según criterios
  const vacantesFiltradas = vacantes.filter(vacante => {
    // Filtrar por texto de búsqueda en título y descripción
    const coincideBusqueda = 
      vacante.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (vacante.descripcion && vacante.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    
    // Filtrar por ubicación
    const coincideUbicacion = 
      ubicacion === "todas" || 
      (vacante.ubicacion && vacante.ubicacion.toLowerCase() === ubicacion.toLowerCase())
    
    // Filtrar por tipo de contrato
    const coincideTipoContrato = 
      tipoContrato === "todos" || 
      (vacante.tipoContrato && vacante.tipoContrato === tipoContrato)
    
    return coincideBusqueda && coincideUbicacion && coincideTipoContrato
  })

  // Extraer ubicaciones únicas para el filtro
  const ubicacionesUnicas = ["todas", ...new Set(vacantes
    .filter(v => v.ubicacion)
    .map(v => v.ubicacion!.toLowerCase()))]
  
  // Extraer tipos de contrato únicos para el filtro
  const tiposContratoUnicos = ["todos", ...new Set(vacantes
    .filter(v => v.tipoContrato)
    .map(v => v.tipoContrato!))]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="mb-8 space-y-4">
            <h1 className="text-3xl font-bold text-[#0a192f]">Vacantes disponibles</h1>
            <p className="text-muted-foreground">Explora las oportunidades profesionales que Vertex tiene para ti</p>
          </div>

          {/* Filtros y búsqueda */}
          <div className="mb-8 border rounded-lg p-6 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título o palabras clave..."
                className="pl-10"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Select value={ubicacion} onValueChange={setUbicacion}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Todas las ubicaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    {ubicacionesUnicas.map((ubi, index) => (
                      <SelectItem key={index} value={ubi}>
                        {ubi === "todas" 
                          ? "Todas las ubicaciones" 
                          : ubi.charAt(0).toUpperCase() + ubi.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de empleo</Label>
                <Select value={tipoContrato} onValueChange={setTipoContrato}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposContratoUnicos.map((tipo, index) => (
                      <SelectItem key={index} value={tipo}>
                        {tipo === "todos" 
                          ? "Todos los tipos" 
                          : tipo === "TIEMPO_COMPLETO" 
                            ? "Tiempo completo"
                            : tipo === "MEDIO_TIEMPO"
                              ? "Medio tiempo"
                              : tipo === "PRACTICAS"
                                ? "Prácticas"
                                : tipo === "FREELANCE"
                                  ? "Freelance"
                                  : tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full sm:w-auto bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0a192f]" onClick={() => {
              setBusqueda("")
              setUbicacion("todas")
              setTipoContrato("todos")
            }}>
              <Filter className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
          </div>

          {/* Listado de vacantes */}
          {cargando ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center p-8 text-red-500">
              <AlertTriangle className="mr-2 h-5 w-5" />
              {error}
            </div>
          ) : vacantesFiltradas.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              No se encontraron vacantes con los criterios seleccionados.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vacantesFiltradas.map((vacante) => (
                <JobCard 
                  key={vacante.id} 
                  job={{
                    id: vacante.id,
                    title: vacante.titulo,
                    department: vacante.area || "General",
                    location: vacante.ubicacion || "No especificada",
                    type: vacante.tipoContrato || "No especificado",
                    postedDate: vacante.fechaPublicacion || new Date().toISOString()
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

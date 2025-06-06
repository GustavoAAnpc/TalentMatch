"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Search, Filter, ChevronDown, Calendar, Users, AlertTriangle } from "lucide-react"
import { vacanteService } from "@/services/vacanteService"
import { authService } from "@/services/authService"
import { VacanteResumenResponse } from "@/types/vacante"
import { formatearFecha } from "@/lib/utils"

export default function VacanciesPage() {
  const [vacantes, setVacantes] = useState<VacanteResumenResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    const cargarVacantes = async () => {
      try {
        setCargando(true)
        // Intentar obtener el usuario del localStorage
        let usuario = authService.getUsuarioActual()
        
        // Si no hay usuario o no tiene id, intentar obtenerlo de otra fuente
        if (!usuario || !usuario.id) {
          console.log("No se encontró id en localStorage, intentando obtener desde cookies...")
          
          // Intentar corregir y obtener datos de usuario desde getUsuario (cookies)
          const usuarioCookie = authService.getUsuario()
          if (usuarioCookie) {
            console.log("Usuario obtenido de cookies:", usuarioCookie)
            
            // Si tenemos el usuario en cookies, usarlo y actualizar el localStorage para futuras cargas
            if (usuarioCookie.id) {
              console.log("Usando id de usuario desde cookies:", usuarioCookie.id)
              usuario = usuarioCookie
              
              // Actualizar el localStorage para futuras cargas
              localStorage.setItem('user_data', JSON.stringify(usuarioCookie))
            }
          }
        }
        
        if (!usuario || !usuario.id) {
          setError("No se pudo identificar al reclutador. Por favor, vuelve a iniciar sesión.")
          setCargando(false)
          return
        }
        
        console.log("Cargando vacantes para el reclutador con ID:", usuario.id)
        const data = await vacanteService.obtenerVacantesReclutador(usuario.id)
        setVacantes(data)
        setCargando(false)
      } catch (err) {
        console.error("Error al cargar las vacantes:", err)
        setError("No se pudieron cargar las vacantes")
        setCargando(false)
      }
    }
    
    cargarVacantes()
  }, [])

  // Filtrar vacantes según búsqueda
  const vacantesFiltradas = vacantes.filter(vacante => 
    vacante.titulo.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Obtener el color de la badge según el estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "ACTIVA":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "PAUSADA":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "CERRADA":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  return (
    <div className="flex flex-col space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Vacantes</h2>
        <Button asChild>
          <Link href="/reclutador/vacantes/crear">
            <Plus className="mr-2 h-4 w-4" />
            Crear Vacante
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Vacantes</CardTitle>
          <CardDescription>Administra todas tus vacantes desde un solo lugar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input 
                placeholder="Buscar vacantes..." 
                className="w-[300px]" 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrar
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Departamento</DropdownMenuItem>
                  <DropdownMenuItem>Ubicación</DropdownMenuItem>
                  <DropdownMenuItem>Estado</DropdownMenuItem>
                  <DropdownMenuItem>Fecha</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {cargando ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center p-8 text-red-500">
              <AlertTriangle className="mr-2 h-5 w-5" />
              {error}
            </div>
          ) : vacantesFiltradas.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No se encontraron vacantes. ¡Comienza creando una!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">Título</th>
                    <th className="py-3 px-4 text-left">Área</th>
                    <th className="py-3 px-4 text-left">Ubicación</th>
                    <th className="py-3 px-4 text-center">Postulaciones</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-left">Publicación</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vacantesFiltradas.map((vacante) => (
                    <tr key={vacante.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{vacante.titulo}</div>
                      </td>
                      <td className="py-3 px-4">{vacante.area || "-"}</td>
                      <td className="py-3 px-4">{vacante.ubicacion || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{vacante.totalPostulaciones || 0}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getEstadoColor(vacante.estado)}>
                          {vacante.estado}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{vacante.fechaPublicacion ? formatearFecha(vacante.fechaPublicacion) : "-"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/reclutador/vacantes/${vacante.id}`}>
                              Ver
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/reclutador/vacantes/${vacante.id}/editar`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

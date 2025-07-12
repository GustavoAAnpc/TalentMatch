import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Filter, Eye, BrainCircuit, Calendar, MapPin } from "lucide-react"

export default function PostulacionesPage() {
  // Datos de ejemplo para las postulaciones
  const applications = [
    {
      id: 1,
      title: "Desarrollador Frontend Senior",
      department: "Tecnología",
      location: "Lima",
      date: "10 de mayo, 2025",
      status: "En revisión",
      statusColor: "bg-yellow-500",
      matchScore: 85,
      nextStep: "Esperando revisión del reclutador",
    },
    {
      id: 4,
      title: "Product Manager",
      department: "Producto",
      location: "Cusco",
      date: "28 de abril, 2025",
      status: "Rechazado",
      statusColor: "bg-red-500",
      matchScore: 65,
      nextStep: "Proceso finalizado",
    },
    {
      id: 5,
      title: "Backend Developer",
      department: "Tecnología",
      location: "Trujillo",
      date: "25 de abril, 2025",
      status: "Contratado",
      statusColor: "bg-green-500",
      matchScore: 95,
      nextStep: "Inicio: 1 de junio, 2025",
    },
  ]

  return (
    <div className="space-y-6 px-2 py-4 md:px-4 lg:px-5 max-w-[100%] w-full mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-[#0a192f] to-[#112240] p-5 rounded-xl shadow-md">
        <div className="text-white">
          <h1 className="text-3xl font-bold tracking-tight">Mis Postulaciones</h1>
          <p className="text-gray-300 mt-1">
          Gestiona y haz seguimiento de tus procesos de selección activos e históricos
        </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>
          <div className="mt-3 flex items-center gap-2 sm:mt-0">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar postulaciones..."
                className="w-full pl-8 sm:w-[200px] md:w-[300px]"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrar</span>
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="text-lg font-semibold text-[#0a192f]">Todas las postulaciones</CardTitle>
              <CardDescription>Visualiza todas tus postulaciones en un solo lugar</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-5">
              <div className="space-y-4">
                {applications.map((application) => (
                  <div
                    key={application.id}
                    className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[#0a192f]">{application.title}</h3>
                        <Badge className={`${application.statusColor} text-white hover:${application.statusColor}`}>
                          {application.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          <span>{application.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          <span>{application.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <BrainCircuit className="h-4 w-4 text-[#38bdf8]" />
                        <span className="text-sm font-medium text-[#38bdf8]">
                          {application.matchScore}% compatibilidad
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Próximo paso:</span> {application.nextStep}
                      </p>
                    </div>
                    <div className="mt-4 flex justify-end sm:mt-0">
                      <Link href={`/dashboard/postulaciones/${application.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-[#0a192f] border-[#0a192f] hover:bg-[#0a192f] hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                          Ver detalles
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="text-lg font-semibold text-[#0a192f]">Postulaciones activas</CardTitle>
              <CardDescription>Procesos de selección en curso</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-5">
              <div className="space-y-4">
                {applications
                  .filter((app) => app.status !== "Rechazado" && app.status !== "Contratado")
                  .map((application) => (
                    <div
                      key={application.id}
                      className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[#0a192f]">{application.title}</h3>
                          <Badge className={`${application.statusColor} text-white hover:${application.statusColor}`}>
                            {application.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-4 w-4" />
                            <span>{application.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            <span>{application.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <BrainCircuit className="h-4 w-4 text-[#38bdf8]" />
                          <span className="text-sm font-medium text-[#38bdf8]">
                            {application.matchScore}% compatibilidad
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Próximo paso:</span> {application.nextStep}
                        </p>
                      </div>
                      <div className="mt-4 flex justify-end sm:mt-0">
                        <Link href={`/dashboard/postulaciones/${application.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-[#0a192f] border-[#0a192f] hover:bg-[#0a192f] hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalles
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="text-lg font-semibold text-[#0a192f]">Postulaciones completadas</CardTitle>
              <CardDescription>Procesos de selección finalizados</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-5">
              <div className="space-y-4">
                {applications
                  .filter((app) => app.status === "Rechazado" || app.status === "Contratado")
                  .map((application) => (
                    <div
                      key={application.id}
                      className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[#0a192f]">{application.title}</h3>
                          <Badge className={`${application.statusColor} text-white hover:${application.statusColor}`}>
                            {application.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-4 w-4" />
                            <span>{application.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            <span>{application.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <BrainCircuit className="h-4 w-4 text-[#38bdf8]" />
                          <span className="text-sm font-medium text-[#38bdf8]">
                            {application.matchScore}% compatibilidad
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Próximo paso:</span> {application.nextStep}
                        </p>
                      </div>
                      <div className="mt-4 flex justify-end sm:mt-0">
                        <Link href={`/dashboard/postulaciones/${application.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-[#0a192f] border-[#0a192f] hover:bg-[#0a192f] hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalles
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

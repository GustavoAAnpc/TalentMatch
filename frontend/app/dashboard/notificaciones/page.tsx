import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Award, Bell, Briefcase, Calendar, CheckCircle, Clock, FileText, MessageSquare, Trash2 } from "lucide-react"

export default function NotificacionesPage() {
  // Datos de ejemplo para las notificaciones
  const notifications = [
    {
      id: 1,
      title: "Tu postulación ha sido recibida",
      description: "Desarrollador Frontend Senior",
      date: "Hace 2 horas",
      read: false,
      type: "application",
      icon: CheckCircle,
      iconColor: "text-green-500",
      iconBg: "bg-green-100",
    },
    {
      id: 2,
      title: "Entrevista programada",
      description: "UX/UI Designer - 15 de mayo, 10:00 AM",
      date: "Hace 1 día",
      read: false,
      type: "interview",
      icon: Calendar,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
    },
    {
      id: 3,
      title: "Prueba técnica disponible",
      description: "DevOps Engineer - Fecha límite: 12 de mayo",
      date: "Hace 2 días",
      read: false,
      type: "test",
      icon: FileText,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-100",
    },
    {
      id: 4,
      title: "¡Has completado tu perfil!",
      description: "Tu perfil ahora es visible para reclutadores",
      date: "Hace 3 días",
      read: true,
      type: "profile",
      icon: Award,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-100",
    },
    {
      id: 5,
      title: "Nuevo mensaje del reclutador",
      description: "Ana Martínez te ha enviado un mensaje",
      date: "Hace 4 días",
      read: true,
      type: "message",
      icon: MessageSquare,
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-100",
    },
  ]

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <div className="space-y-6 px-2 py-4 md:px-4 lg:px-5 max-w-[100%] w-full mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-[#0a192f] to-[#112240] p-5 rounded-xl shadow-md">
        <div className="text-white">
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-gray-300 mt-1">
            Mantente al día con actualizaciones sobre tus postulaciones y procesos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1 bg-white hover:bg-gray-100 text-[#0a192f]">
            <Bell className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
          <Button variant="outline" className="gap-1 text-red-500 bg-white hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
            Eliminar todas
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">
              No leídas
              {unreadCount > 0 && <Badge className="ml-2 bg-[#38bdf8]">{unreadCount}</Badge>}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="text-lg font-semibold text-[#0a192f]">Todas las notificaciones</CardTitle>
              <CardDescription>Historial completo de notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 px-5">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className="flex items-start gap-4">
                    <div className={`rounded-full p-2 ${notification.iconBg} ${notification.iconColor}`}>
                      <notification.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`font-medium ${notification.read ? "text-[#0a192f]" : "text-[#0a192f] font-bold"}`}
                        >
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-[#38bdf8]"></span>
                          )}
                        </h3>
                        <span className="text-xs text-muted-foreground">{notification.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {notification.read ? <Bell className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        <span className="sr-only">
                          {notification.read ? "Marcar como no leída" : "Marcar como leída"}
                        </span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="text-lg font-semibold text-[#0a192f]">Notificaciones no leídas</CardTitle>
              <CardDescription>Notificaciones que aún no has visto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 px-5">
              {notifications.filter((notification) => !notification.read).length > 0 ? (
                notifications
                  .filter((notification) => !notification.read)
                  .map((notification, index, filtered) => (
                    <div key={notification.id}>
                      <div className="flex items-start gap-4">
                        <div className={`rounded-full p-2 ${notification.iconBg} ${notification.iconColor}`}>
                          <notification.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-[#0a192f]">
                              {notification.title}
                              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-[#38bdf8]"></span>
                            </h3>
                            <span className="text-xs text-muted-foreground">{notification.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <CheckCircle className="h-4 w-4" />
                            <span className="sr-only">Marcar como leída</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </div>
                      {index < filtered.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No tienes notificaciones sin leer</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Todas tus notificaciones han sido marcadas como leídas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

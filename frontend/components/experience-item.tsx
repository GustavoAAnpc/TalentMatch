import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Briefcase, X, Check } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ModalForm } from "./modal-form"
import { ConfirmDialog } from "./confirm-dialog"

interface ExperienceItemProps {
  experience: {
    id: number
    position: string
    company: string
    location: string
    startDate: string
    endDate: string
    description: string
  }
  onEdit: (id: number, updatedExperience: any) => void
  onDelete: (id: number) => void
}

export function ExperienceItem({ experience, onEdit, onDelete }: ExperienceItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [formData, setFormData] = useState(experience)
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Guardar los cambios
  const handleSave = () => {
    onEdit(experience.id, formData)
    setIsEditing(false)
  }
  
  // Cancelar la edición
  const handleCancel = () => {
    setFormData(experience)
    setIsEditing(false)
  }
  
  // Confirmar eliminación
  const handleDelete = () => {
    setIsConfirmingDelete(true)
  }
  
  const confirmDelete = () => {
    onDelete(experience.id)
  }
  
  // Formulario de edición (ahora como contenido del modal)
  const editForm = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="position">Puesto</Label>
        <Input
          id="position"
          name="position"
          value={formData.position}
          onChange={handleChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="company">Empresa</Label>
        <Input
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Ubicación</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Fecha inicio</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate">Fecha fin</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Check className="h-4 w-4 mr-1" />
          Guardar
        </Button>
      </div>
    </div>
  );
  
  // Vista normal
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#38bdf8]/10 p-2 text-[#38bdf8]">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-[#0a192f]">{experience.position}</h3>
              <p className="text-sm text-muted-foreground">
                {experience.company} • {experience.location}
              </p>
              <p className="text-sm text-muted-foreground">
                {experience.startDate} - {experience.endDate}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Eliminar</span>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{experience.description}</p>
      </div>
      
      {/* Modal de edición */}
      <ModalForm
        title="Editar experiencia laboral"
        description="Actualiza los detalles de tu experiencia profesional"
        isOpen={isEditing}
        onClose={handleCancel}
      >
        {editForm}
      </ModalForm>
      
      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={confirmDelete}
        title="Eliminar experiencia"
        description="¿Estás seguro de que deseas eliminar esta experiencia laboral? Esta acción no se puede deshacer."
      />
    </>
  )
}

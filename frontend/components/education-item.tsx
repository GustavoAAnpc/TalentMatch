import { Button } from "@/components/ui/button"
import { Edit2, Trash2, GraduationCap, X, Check } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ModalForm } from "./modal-form"
import { ConfirmDialog } from "./confirm-dialog"

interface EducationItemProps {
  education: {
    id: number
    degree: string
    institution: string
    location: string
    startDate: string
    endDate: string
    description: string
  }
  onEdit: (id: number, updatedEducation: any) => void
  onDelete: (id: number) => void
}

export function EducationItem({ education, onEdit, onDelete }: EducationItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [formData, setFormData] = useState(education)
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Guardar los cambios
  const handleSave = () => {
    onEdit(education.id, formData)
    setIsEditing(false)
  }
  
  // Cancelar edición
  const handleCancel = () => {
    setFormData(education)
    setIsEditing(false)
  }
  
  // Confirmar eliminación
  const handleDelete = () => {
    setIsConfirmingDelete(true)
  }
  
  const confirmDelete = () => {
    onDelete(education.id)
  }
  
  // Formulario de edición
  const editForm = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="degree">Título</Label>
        <Input
          id="degree"
          name="degree"
          value={formData.degree}
          onChange={handleChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="institution">Institución</Label>
        <Input
          id="institution"
          name="institution"
          value={formData.institution}
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
  )
  
  // Vista normal
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#38bdf8]/10 p-2 text-[#38bdf8]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-[#0a192f]">{education.degree}</h3>
              <p className="text-sm text-muted-foreground">
                {education.institution} • {education.location}
              </p>
              <p className="text-sm text-muted-foreground">
                {education.startDate} - {education.endDate}
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
        <p className="text-sm text-muted-foreground">{education.description}</p>
      </div>
      
      {/* Modal de edición */}
      <ModalForm
        title="Editar educación"
        description="Actualiza los detalles de tu formación académica"
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
        title="Eliminar educación"
        description="¿Estás seguro de que deseas eliminar este registro de educación? Esta acción no se puede deshacer."
      />
    </>
  )
}

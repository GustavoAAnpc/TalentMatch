import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useState } from "react"
import { Check, X } from "lucide-react"

interface AddLanguageFormProps {
  onAdd: (language: any) => void
  onCancel: () => void
}

export function AddLanguageForm({ onAdd, onCancel }: AddLanguageFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    level: ""
  })
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Manejar cambios en el select
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, level: value }))
  }
  
  // Enviar el formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(formData)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Idioma *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej. Inglés, Español, Portugués"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="level">Nivel *</Label>
        <Select 
          value={formData.level} 
          onValueChange={handleSelectChange} 
          required
        >
          <SelectTrigger id="level">
            <SelectValue placeholder="Selecciona un nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Básico</SelectItem>
            <SelectItem value="intermediate">Intermedio</SelectItem>
            <SelectItem value="advanced">Avanzado</SelectItem>
            <SelectItem value="fluent">Fluido</SelectItem>
            <SelectItem value="native">Nativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button type="submit" size="sm">
          <Check className="h-4 w-4 mr-1" />
          Guardar
        </Button>
      </div>
    </form>
  )
} 
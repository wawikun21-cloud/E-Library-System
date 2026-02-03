import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pencil, Trash2, X, Check } from 'lucide-react'

interface Student {
  id: number
  name: string
  email: string
  course: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
  })

  // Handle Create
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newStudent: Student = {
      id: Date.now(),
      ...formData,
    }
    setStudents([...students, newStudent])
    setFormData({ name: '', email: '', course: '' })
    setIsFormOpen(false)
  }

  // Handle Update
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId === null) return
    
    setStudents(students.map(student => 
      student.id === editingId 
        ? { ...student, ...formData }
        : student
    ))
    setEditingId(null)
    setFormData({ name: '', email: '', course: '' })
  }

  // Start editing a student
  const startEdit = (student: Student) => {
    setEditingId(student.id)
    setFormData({
      name: student.name,
      email: student.email,
      course: student.course,
    })
    setIsFormOpen(false) // Close add form if open
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ name: '', email: '', course: '' })
  }

  // Handle Delete
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(student => student.id !== id))
      // If we're editing this student, cancel the edit
      if (editingId === id) {
        cancelEdit()
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Students</h2>
          <p className="text-muted-foreground mt-1">Manage student records</p>
        </div>
        <Button
          onClick={() => {
            setIsFormOpen(!isFormOpen)
            setEditingId(null)
            setFormData({ name: '', email: '', course: '' })
          }}
          variant={isFormOpen ? "outline" : "default"}
        >
          {isFormOpen ? 'Cancel' : 'Add Student'}
        </Button>
      </div>

      {/* Add Student Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Student</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter student name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@example.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="Enter course name"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  Save Student
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false)
                    setFormData({ name: '', email: '', course: '' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Course</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-lg font-medium">No students found</p>
                        <p className="text-sm">Add your first student to get started!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="border-t border-border hover:bg-muted/50">
                      {editingId === student.id ? (
                        // Editing mode
                        <>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={formData.course}
                              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                size="icon-sm"
                                variant="default"
                                onClick={handleUpdate}
                                title="Save changes"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="outline"
                                onClick={cancelEdit}
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // Display mode
                        <>
                          <td className="px-6 py-4 font-medium">{student.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">{student.email}</td>
                          <td className="px-6 py-4">{student.course}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                size="icon-sm"
                                variant="outline"
                                onClick={() => startEdit(student)}
                                title="Edit student"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="destructive"
                                onClick={() => handleDelete(student.id)}
                                title="Delete student"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {students.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {new Set(students.map(s => s.course)).size}
              </div>
              <p className="text-xs text-muted-foreground">Different Courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {students[students.length - 1]?.name.split(' ')[0] || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Latest Addition</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
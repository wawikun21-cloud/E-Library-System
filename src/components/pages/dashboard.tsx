import { useState } from 'react'
import { Send, Image as ImageIcon, Calendar, BookCheck, Clock, User, Upload, X, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Announcement {
  id: number
  title: string
  message: string
  imageUrl?: string
  date: string
}

interface Appointment {
  id: number
  studentName: string
  bookTitle: string
  type: 'borrow' | 'return'
  appointmentDate: string
  status: 'pending' | 'confirmed' | 'completed'
}

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    imageUrl: '',
  })
  const [previewImage, setPreviewImage] = useState<string>('')
  const [uploadType, setUploadType] = useState<'url' | 'upload'>('upload')
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [deleteAnnouncement, setDeleteAnnouncement] = useState<Announcement | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setFormData({ ...formData, imageUrl: base64String })
        setPreviewImage(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, imageUrl: '' })
    setPreviewImage('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newAnnouncement: Announcement = {
      id: Date.now(),
      title: formData.title,
      message: formData.message,
      imageUrl: formData.imageUrl || undefined,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    setAnnouncements([newAnnouncement, ...announcements])
    setFormData({ title: '', message: '', imageUrl: '' })
    setPreviewImage('')
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      message: announcement.message,
      imageUrl: announcement.imageUrl || '',
    })
    setPreviewImage(announcement.imageUrl || '')
    setIsEditDialogOpen(true)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingAnnouncement) {
      setAnnouncements(announcements.map(ann => 
        ann.id === editingAnnouncement.id 
          ? {
              ...ann,
              title: formData.title,
              message: formData.message,
              imageUrl: formData.imageUrl || undefined,
            }
          : ann
      ))
      resetEditForm()
    }
  }

  const handleDelete = () => {
    if (deleteAnnouncement) {
      setAnnouncements(announcements.filter(ann => ann.id !== deleteAnnouncement.id))
      setDeleteAnnouncement(null)
    }
  }

  const resetEditForm = () => {
    setFormData({ title: '', message: '', imageUrl: '' })
    setPreviewImage('')
    setEditingAnnouncement(null)
    setIsEditDialogOpen(false)
  }

  // Mock appointments data - replace with actual data from your state management
  const appointments: Appointment[] = [
    {
      id: 1,
      studentName: 'John Doe',
      bookTitle: 'Introduction to Algorithms',
      type: 'borrow',
      appointmentDate: 'Today, 2:00 PM',
      status: 'pending'
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      bookTitle: 'Clean Code',
      type: 'return',
      appointmentDate: 'Today, 3:30 PM',
      status: 'confirmed'
    },
    {
      id: 3,
      studentName: 'Mike Johnson',
      bookTitle: 'Design Patterns',
      type: 'borrow',
      appointmentDate: 'Tomorrow, 10:00 AM',
      status: 'pending'
    }
  ]

  const borrowAppointments = appointments.filter(apt => apt.type === 'borrow')
  const returnAppointments = appointments.filter(apt => apt.type === 'return')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'confirmed': return 'default'
      case 'completed': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Home</h2>
        <p className="text-muted-foreground mt-1">Manage announcements and view upcoming appointments</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Announcement Section - Takes 3/4 width */}
        <div className="lg:col-span-3 space-y-6">
          {/* Announcement Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Announcement</CardTitle>
              <CardDescription>
                Post important updates and news for library users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter announcement title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <textarea
                    id="message"
                    placeholder="Enter your announcement message..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full min-h-[120px] px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                    required
                  />
                </div>

                {/* Image Upload Section */}
                <div className="space-y-2">
                  <Label>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Image (Optional)
                    </div>
                  </Label>
                  
                  {/* Toggle between Upload and URL */}
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant={uploadType === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setUploadType('upload')
                        if (uploadType === 'url') {
                          removeImage()
                        }
                      }}
                    >
                      Upload File
                    </Button>
                    <Button
                      type="button"
                      variant={uploadType === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setUploadType('url')
                        removeImage()
                      }}
                    >
                      Use URL
                    </Button>
                  </div>

                  {uploadType === 'upload' ? (
                    // File Upload
                    previewImage ? (
                      <div className="relative w-full max-w-md">
                        <img 
                          src={previewImage} 
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <span className="text-sm font-medium text-primary hover:underline">
                            Click to upload
                          </span>
                          <span className="text-sm text-muted-foreground"> or drag and drop</span>
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, JPEG, GIF, WEBP (max 5MB)
                        </p>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    )
                  ) : (
                    // URL Input
                    <Input
                      id="image-url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value })
                        setPreviewImage(e.target.value)
                      }}
                    />
                  )}
                </div>

                <Button type="submit" className="gap-2">
                  <Send className="h-4 w-4" />
                  Post Announcement
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Announcements List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Announcements</h3>
            
            {announcements.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-center">
                    No announcements yet. Create your first announcement above!
                  </p>
                </CardContent>
              </Card>
            ) : (
              announcements.map((announcement) => (
                <Card key={announcement.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-xl">{announcement.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {announcement.date}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">New</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteAnnouncement(announcement)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {announcement.imageUrl && (
                      <div className="mb-4 rounded-md overflow-hidden border bg-muted">
                        <img
                          src={announcement.imageUrl}
                          alt={announcement.title}
                          className="w-full max-h-[400px] object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {announcement.message}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Appointments Summary - Takes 1/4 width */}
        <div className="lg:col-span-1 space-y-6">
          {/* Borrow Appointments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Borrow Appointments</CardTitle>
                <Badge variant="secondary">{borrowAppointments.length}</Badge>
              </div>
              <CardDescription>Upcoming book pickups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {borrowAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <BookCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No appointments</p>
                </div>
              ) : (
                borrowAppointments.map((apt) => (
                  <div key={apt.id} className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-sm font-medium">{apt.studentName}</p>
                      </div>
                      <Badge variant={getStatusColor(apt.status)} className="text-xs">
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                      {apt.bookTitle}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {apt.appointmentDate}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Return Appointments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Return Appointments</CardTitle>
                <Badge variant="secondary">{returnAppointments.length}</Badge>
              </div>
              <CardDescription>Scheduled book returns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {returnAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <BookCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No appointments</p>
                </div>
              ) : (
                returnAppointments.map((apt) => (
                  <div key={apt.id} className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-medium">{apt.studentName}</p>
                      </div>
                      <Badge variant={getStatusColor(apt.status)} className="text-xs">
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                      {apt.bookTitle}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {apt.appointmentDate}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Appointments</span>
                <span className="font-bold">{appointments.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-bold text-orange-600">
                  {appointments.filter(a => a.status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confirmed</span>
                <span className="font-bold text-green-600">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Announcement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && resetEditForm()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update the announcement information below.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="Enter announcement title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-message">Message *</Label>
              <textarea
                id="edit-message"
                placeholder="Enter your announcement message..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full min-h-[120px] px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                required
              />
            </div>

            {/* Image Edit Section */}
            <div className="space-y-2">
              <Label>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Image (Optional)
                </div>
              </Label>
              
              {/* Toggle between Upload and URL */}
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={uploadType === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setUploadType('upload')
                    if (uploadType === 'url') {
                      removeImage()
                    }
                  }}
                >
                  Upload File
                </Button>
                <Button
                  type="button"
                  variant={uploadType === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setUploadType('url')
                    removeImage()
                  }}
                >
                  Use URL
                </Button>
              </div>

              {uploadType === 'upload' ? (
                // File Upload
                previewImage ? (
                  <div className="relative w-full">
                    <img 
                      src={previewImage} 
                      alt="Preview"
                      className="w-full max-h-[300px] object-contain rounded-md border bg-muted"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <Label htmlFor="edit-image-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:underline">
                        Click to upload
                      </span>
                      <span className="text-sm text-muted-foreground"> or drag and drop</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, JPEG, GIF, WEBP (max 5MB)
                    </p>
                    <Input
                      id="edit-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )
              ) : (
                // URL Input
                <Input
                  id="edit-image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value })
                    setPreviewImage(e.target.value)
                  }}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetEditForm}>
                Cancel
              </Button>
              <Button type="submit">
                Update Announcement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAnnouncement} onOpenChange={(open) => !open && setDeleteAnnouncement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteAnnouncement?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
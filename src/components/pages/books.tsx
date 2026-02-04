import { useState } from 'react'
import { Search, Plus, Pencil, Trash2, BookOpen, Upload, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Book {
  id: number
  title: string
  author: string
  isbn: string
  quantity: number
  coverImage?: string // Base64 or URL
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [deleteBook, setDeleteBook] = useState<Book | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    quantity: 1,
    coverImage: '',
  })
  const [previewImage, setPreviewImage] = useState<string>('')

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
        setFormData({ ...formData, coverImage: base64String })
        setPreviewImage(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, coverImage: '' })
    setPreviewImage('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingBook) {
      // Update existing book
      setBooks(books.map(book => 
        book.id === editingBook.id 
          ? { ...book, ...formData }
          : book
      ))
    } else {
      // Add new book
      const newBook: Book = {
        id: Date.now(),
        ...formData,
      }
      setBooks([...books, newBook])
    }
    
    resetForm()
  }

  const handleEdit = (book: Book) => {
    setEditingBook(book)
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      quantity: book.quantity,
      coverImage: book.coverImage || '',
    })
    setPreviewImage(book.coverImage || '')
    setIsFormOpen(true)
  }

  const handleDelete = () => {
    if (deleteBook) {
      setBooks(books.filter(book => book.id !== deleteBook.id))
      setDeleteBook(null)
    }
  }

  const resetForm = () => {
    setFormData({ title: '', author: '', isbn: '', quantity: 1, coverImage: '' })
    setPreviewImage('')
    setIsFormOpen(false)
    setEditingBook(null)
  }

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <style>{`
        /* Custom scrollbar styling for modal */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
          transition: scrollbar-color 0.3s ease;
        }
        
        .custom-scrollbar:hover {
          scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(155, 155, 155, 0.5);
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(155, 155, 155, 0.7);
        }
        
        .dark .custom-scrollbar:hover {
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
        
        .dark .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
      
      <div className="container mx-auto py-2 px-4 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Book Library</h1>
            <p className="text-muted-foreground mt-2">
              Manage your book collection with ease
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Book
          </Button>
        </div>

        {/* Search and Stats Section */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-3">
            <CardContent className="pt-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardDescription>Total Books</CardDescription>
              <CardTitle className="text-4xl">{books.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Books Grid/List */}
        {filteredBooks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No books found' : 'No books yet'}
              </h3>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start building your library by adding your first book'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Book
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {/* Book Cover Image */}
                {book.coverImage ? (
                  <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
                    <img 
                      src={book.coverImage} 
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/5] w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                
                <CardHeader className="p-2 pb-1">
                  <div className="space-y-1">
                    <CardTitle className="text-xs line-clamp-1 leading-tight">
                      {book.title}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-1">
                      {book.author}
                    </CardDescription>
                    <Badge 
                      variant={book.quantity > 5 ? "default" : book.quantity > 0 ? "secondary" : "destructive"}
                      className="text-xs px-1.5 py-0 h-4"
                    >
                      {book.quantity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground truncate">
                      {book.isbn}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 h-6 text-xs px-2"
                        onClick={() => handleEdit(book)}
                      >
                        <Pencil className="h-2.5 w-2.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 h-6 text-xs px-2 text-destructive hover:text-destructive"
                        onClick={() => setDeleteBook(book)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Book Dialog */}
        <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle>
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </DialogTitle>
              <DialogDescription>
                {editingBook 
                  ? 'Update the book information below.'
                  : 'Fill in the details to add a new book to your library.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cover Image Upload */}
              <div className="space-y-2">
                <Label>Book Cover</Label>
                {previewImage ? (
                  <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto">
                    <img 
                      src={previewImage} 
                      alt="Book cover preview"
                      className="w-full h-full object-cover rounded-md border"
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
                    <Label htmlFor="cover-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:underline">
                        Click to upload
                      </span>
                      <span className="text-sm text-muted-foreground"> or drag and drop</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WEBP (max 5MB)
                    </p>
                    <Input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter book title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Enter author name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN *</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="Enter ISBN number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBook ? 'Update Book' : 'Add Book'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteBook} onOpenChange={(open) => !open && setDeleteBook(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{deleteBook?.title}" from your library. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Book
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
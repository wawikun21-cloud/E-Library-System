import { useState, useEffect } from 'react'
import { Search, Plus, Pencil, Trash2, BookOpen, Upload, X, Loader2, Filter, Eye, Calendar, MapPin, Building2, Hash, CheckCircle2, Copy, FolderOpen, ScanLine, ChevronDown } from 'lucide-react'
import { toast } from 'react-toastify'
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
import { bookService } from '@/services/api'
import QRCodeScanner from '@/components/common/QRCodeScanner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserData {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  last_login: string | null;
}

interface BooksPageProps {
  user?: UserData | null;
}

interface Book {
  book_id: number
  title: string
  author: string
  isbn: string
  quantity: number
  available_quantity: number
  cover_image?: string
  category?: string
  publisher?: string
  published_year?: number
  description?: string
  location?: string
}

export default function BooksPage({ user: _user }: BooksPageProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [deleteBook, setDeleteBook] = useState<Book | null>(null)
  const [viewingBook, setViewingBook] = useState<Book | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // QR Scanner states
  const [showScanner, setShowScanner] = useState(false)
  const [isFetchingISBN, setIsFetchingISBN] = useState(false)
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(true)
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    quantity: 1,
    cover_image: '',
    category: '',
    publisher: '',
    published_year: '',
    description: '',
    location: '',
  })
  const [previewImage, setPreviewImage] = useState<string>('')

  // Load books on component mount
  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    try {
      setIsLoading(true)
      const response = await bookService.getAll()
      if (response.success) {
        setBooks(response.data)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load books')
    } finally {
      setIsLoading(false)
    }
  }

  // Mouse event handlers for 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setFormData({ ...formData, cover_image: base64String })
        setPreviewImage(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, cover_image: '' })
    setPreviewImage('')
  }

  /**
   * Handle QR code scan - fetch book data from ISBN
   */
  const handleISBNScan = async (isbn: string) => {
    console.log('Scanned ISBN:', isbn)
    setShowScanner(false)
    setIsFetchingISBN(true)
    setIsFormOpen(true) // Open form after scan

    try {
      const response = await bookService.getByISBN(isbn)
      
      if (response.success && response.data) {
        const bookData = response.data
        
        // Auto-fill form with fetched data
        setFormData({
          ...formData,
          title: bookData.title || '',
          author: bookData.authors || '',
          isbn: isbn,
          publisher: bookData.publisher || '',
          published_year: bookData.publishedDate ? bookData.publishedDate.substring(0, 4) : '',
          description: bookData.description || '',
          cover_image: bookData.thumbnail || '',
        })
        
        // Set preview image if available
        if (bookData.thumbnail) {
          setPreviewImage(bookData.thumbnail)
        }
        
        toast.success('Book information loaded successfully!')
      } else {
        // No book found - just set ISBN
        setFormData({ ...formData, isbn })
        toast.warning('Book not found. Please fill in the details manually.')
      }
    } catch (error: any) {
      console.error('ISBN fetch error:', error)
      // On error, just set the ISBN and let user fill manually
      setFormData({ ...formData, isbn })
      toast.error(error.message || 'Failed to fetch book details. Please fill manually.')
    } finally {
      setIsFetchingISBN(false)
    }
  }

  /**
   * Open scanner when adding new book - shows only scanner
   */
  const handleScanISBN = () => {
    setShowScanner(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        quantity: parseInt(formData.quantity.toString()) || 1,
        cover_image: formData.cover_image || null,
        category: formData.category || null,
        publisher: formData.publisher || null,
        published_year: formData.published_year ? parseInt(formData.published_year) : null,
        description: formData.description || null,
        location: formData.location || null,
      }
      
      if (editingBook) {
        // Update existing book
        const response = await bookService.update(editingBook.book_id, bookData)
        if (response.success) {
          toast.success('Book updated successfully!')
          await loadBooks() // Reload books to get fresh data
        }
      } else {
        // Create new book
        const response = await bookService.create(bookData)
        if (response.success) {
          toast.success('Book added successfully!')
          await loadBooks() // Reload books to get fresh data
        }
      }
      
      resetForm()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save book')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (book: Book) => {
    setEditingBook(book)
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      quantity: book.quantity,
      cover_image: book.cover_image || '',
      category: book.category || '',
      publisher: book.publisher || '',
      published_year: book.published_year?.toString() || '',
      description: book.description || '',
      location: book.location || '',
    })
    setPreviewImage(book.cover_image || '')
    setIsFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteBook) return

    try {
      const response = await bookService.delete(deleteBook.book_id)
      if (response.success) {
        toast.success('Book deleted successfully!')
        await loadBooks() // Reload books
        setDeleteBook(null)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete book')
      setDeleteBook(null)
    }
  }

  const resetForm = () => {
    setFormData({ 
      title: '', 
      author: '', 
      isbn: '', 
      quantity: 1, 
      cover_image: '',
      category: '',
      publisher: '',
      published_year: '',
      description: '',
      location: '',
    })
    setPreviewImage('')
    setIsFormOpen(false)
    setEditingBook(null)
  }

  // Get unique categories from books
  const categories = ['all', ...Array.from(new Set(books.map(book => book.category).filter((cat): cat is string => Boolean(cat))))]

  // Filter books based on search query and filters
  const filteredBooks = books.filter(book => {
    // Search filter
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.category && book.category.toLowerCase().includes(searchQuery.toLowerCase()))
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || (book.category && book.category === selectedCategory)
    
    // Availability filter
    let matchesAvailability = true
    if (availabilityFilter === 'available') {
      matchesAvailability = book.available_quantity > 0
    } else if (availabilityFilter === 'unavailable') {
      matchesAvailability = book.available_quantity === 0
    }
    
    return matchesSearch && matchesCategory && matchesAvailability
  })

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('all')
    setAvailabilityFilter('all')
    setSearchQuery('')
  }

  // Calculate stats
  const totalAvailable = books.reduce((sum, book) => sum + book.available_quantity, 0)
  const totalQuantity = books.reduce((sum, book) => sum + book.quantity, 0)

  return (
    <>
      <style>{`
        /* Custom scrollbar for modal */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(151, 112, 255, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #9770FF, #0033FF);
          border-radius: 10px;
          transition: background 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c5cd6, #0029cc);
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9770FF rgba(151, 112, 255, 0.05);
        }

        /* Custom scrollbar for page */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #9770FF, #0033FF);
          border-radius: 10px;
          transition: background 0.3s ease;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c5cd6, #0029cc);
        }

        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: #9770FF rgba(0, 0, 0, 0.05);
        }

        /* Image hover zoom effect */
        .book-cover-container {
          overflow: hidden;
          position: relative;
        }

        .book-cover-image {
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .book-cover-container:hover .book-cover-image {
          transform: scale(1.1);
        }

        /* Book card hover effect */
        .book-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .book-card:hover {
          transform: translateY(-4px);
        }

        /* Fade in animation */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        /* Stagger animation for book cards */
        .book-card:nth-child(1) { animation-delay: 0.05s; }
        .book-card:nth-child(2) { animation-delay: 0.1s; }
        .book-card:nth-child(3) { animation-delay: 0.15s; }
        .book-card:nth-child(4) { animation-delay: 0.2s; }
        .book-card:nth-child(5) { animation-delay: 0.25s; }

        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #9770FF 0%, #0033FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Shimmer effect for loading */
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
          background-size: 1000px 100%;
        }

        /* Floating animation for success/error alerts */
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .alert-slide {
          animation: slideDown 0.3s ease-out;
        }

        /* Hover overlay for book cards */
        .book-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          align-items: flex-end;
          padding: 1rem;
        }

        .book-cover-container:hover .book-overlay {
          opacity: 1;
        }

        /* Textarea auto-resize */
        .auto-resize {
          resize: none;
          overflow: hidden;
        }
      `}</style>
      
      <div className="container py-0 px-0 space-y-6">
        {/* Header Section with Gradient */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
          <h1 className="text-3xl font-bold tracking-tight">Borrowed Books</h1>
          <p className="text-muted-foreground mt-1">Manage your book collection - {books.length} {books.length === 1 ? 'book' : 'books'} in total</p>
        </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className="text-[#ffffff] gap-2 bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc] shadow-lg hover:shadow-xl transition-all h-9 px-6 text-base font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add New Book
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                onClick={handleScanISBN}
                className="cursor-pointer gap-2 py-3"
              >
                <ScanLine className="h-4 w-4 text-[#9770FF]" />
                <div className="flex flex-col">
                  <span className="font-semibold">Scan ISBN</span>
                  <span className="text-xs text-muted-foreground">Auto-fill from barcode</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsFormOpen(true)}
                className="cursor-pointer gap-2 py-3"
              >
                <Pencil className="h-4 w-4 text-[#9770FF]" />
                <div className="flex flex-col">
                  <span className="font-semibold">Add Manually</span>
                  <span className="text-xs text-muted-foreground">Enter details yourself</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Cards with 3D Tilt Effects */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className="hover:shadow-2xl cursor-pointer border border-white dark:border-white/20"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'all 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
              willChange: 'transform'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : books.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Books</p>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-2xl cursor-pointer border border-white dark:border-white/20"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'all 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
              willChange: 'transform'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : totalAvailable}
                  </p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-2xl cursor-pointer border border-white dark:border-white/20"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'all 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
              willChange: 'transform'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : totalQuantity}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Copies</p>
                </div>
                <Copy className="h-8 w-8 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-2xl cursor-pointer border border-white dark:border-white/20"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'all 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
              willChange: 'transform'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : categories.length - 1}
                  </p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
                <FolderOpen className="h-8 w-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="shadow-md">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#9770FF] to-[#0033FF] flex items-center justify-center">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-base font-semibold">Filters and Search</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {(selectedCategory !== 'all' || availabilityFilter !== 'all' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 text-xs hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-8 text-xs"
                >
                  {showFilters ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Category Filter */}
                <div className="space-y-3">

                   {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search by title, author, ISBN, or category..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-12 h-12 text-base border-2 focus:border-[#9770FF] transition-colors"
                        />
                      </div>
                      
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#9770FF]" />
                    Category
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className={`h-8 text-xs font-medium transition-all ${
                          selectedCategory === category
                            ? 'text-white bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc] shadow-md'
                            : 'hover:border-[#9770FF] hover:text-[#9770FF]'
                        }`}
                      >
                        {category === 'all' ? 'All Categories' : category}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Availability Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Hash className="h-4 w-4 text-[#9770FF]" />
                    Availability
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={availabilityFilter === 'all' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAvailabilityFilter('all')}
                      className={`h-8 text-xs font-medium transition-all ${
                        availabilityFilter === 'all'
                          ? 'text-white bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc] shadow-md'
                          : 'hover:border-[#9770FF] hover:text-[#9770FF]'
                      }`}
                    >
                      All Books
                    </Button>
                    <Button
                      variant={availabilityFilter === 'available' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAvailabilityFilter('available')}
                      className={`h-8 text-xs font-medium transition-all ${
                        availabilityFilter === 'available'
                          ? 'text-white bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc] shadow-md'
                          : 'hover:border-[#9770FF] hover:text-[#9770FF]'
                      }`}
                    >
                      Available
                    </Button>
                    <Button
                      variant={availabilityFilter === 'unavailable' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAvailabilityFilter('unavailable')}
                      className={`h-8 text-xs font-medium transition-all ${
                        availabilityFilter === 'unavailable'
                          ? 'text-white bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc] shadow-md'
                          : 'hover:border-[#9770FF] hover:text-[#9770FF]'
                      }`}
                    >
                      Unavailable
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedCategory !== 'all' || availabilityFilter !== 'all') && (
                <div className="flex items-center gap-2 pt-3 border-t">
                  <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
                  {selectedCategory !== 'all' && (
                    <Badge variant="secondary" className="text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200">
                      Category: {selectedCategory}
                    </Badge>
                  )}
                  {availabilityFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200">
                      {availabilityFilter === 'available' ? 'Available only' : 'Unavailable only'}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
         
        {/* Results Count */}
        {!isLoading && books.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-medium text-muted-foreground">
              Showing <span className="text-foreground font-semibold">{filteredBooks.length}</span> of <span className="text-foreground font-semibold">{books.length}</span> books
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-[#9770FF] mb-4" />
                <div className="absolute inset-0 h-16 w-16 rounded-full bg-[#9770FF] opacity-20 blur-xl"></div>
              </div>
              <p className="text-muted-foreground font-medium">Loading your library...</p>
            </CardContent>
          </Card>
        ) : filteredBooks.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#9770FF]/10 to-[#0033FF]/10 flex items-center justify-center mb-4">
                <BookOpen className="h-10 w-10 text-[#9770FF]" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {searchQuery || selectedCategory !== 'all' || availabilityFilter !== 'all' ? 'No books found' : 'No books yet'}
              </h3>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                {searchQuery || selectedCategory !== 'all' || availabilityFilter !== 'all'
                  ? 'Try adjusting your search terms or filters to find what you\'re looking for'
                  : 'Start building your library by adding your first book to the collection'}
              </p>
              {searchQuery || selectedCategory !== 'all' || availabilityFilter !== 'all' ? (
                <Button onClick={clearFilters} variant="outline" className="gap-2 h-11 px-6 border-2 hover:border-[#9770FF] hover:text-[#9770FF]">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => setIsFormOpen(true)} className="gap-2 h-11 px-6 bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc] shadow-lg">
                  <Plus className="h-4 w-4" />
                  Add Your First Book
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredBooks.map((book) => (
              <Card key={book.book_id} className="book-card animate-fade-in hover:shadow-xl transition-all overflow-hidden border-2 hover:border-[#9770FF]/30">
                {/* Book Cover Image with Hover Zoom and Overlay */}
                {book.cover_image ? (
                  <div className="aspect-[3/4] w-full overflow-hidden bg-white book-cover-container cursor-pointer relative" onClick={() => setViewingBook(book)}>
                    <img 
                      src={book.cover_image} 
                      alt={book.title}
                      className="w-full h-full object-contain p-1 book-cover-image"
                    />
                    <div className="book-overlay">
                      <Button size="sm" variant="secondary" className="text-[#000000] gap-2 bg-white/90 hover:bg-white">
                        <Eye className="h-3 w-3" />
                        Quick View
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] w-full  flex items-center justify-center book-cover-container cursor-pointer" onClick={() => setViewingBook(book)}>
                    <BookOpen className="h-12 w-12 text-[#9770FF]/40" />
                    <div className="book-overlay">
                      <Button size="sm" variant="secondary" className="gap-2 bg-white/90 hover:bg-white">
                        <Eye className="h-3 w-3" />
                        Quick View
                      </Button>
                    </div>
                  </div>
                )}
                
                <CardHeader className="p-2.5 pb-1.5">
                  <div className="space-y-1.5">
                    <CardTitle className="text-xs line-clamp-2 leading-tight font-semibold hover:text-[#9770FF] transition-colors cursor-pointer" onClick={() => setViewingBook(book)}>
                      {book.title}
                    </CardTitle>
                    <CardDescription className="text-[10px] line-clamp-1 font-medium">
                      {book.author}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1">
                      <Badge 
                        variant={book.available_quantity > 5 ? "default" : book.available_quantity > 0 ? "secondary" : "destructive"}
                        className="text-[9px] px-1.5 py-0 font-semibold"
                      >
                        {book.available_quantity} avail
                      </Badge>
                      {book.category && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-medium border-[#9770FF]/30 text-[#9770FF]">
                          {book.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-2.5 pt-0">
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-muted-foreground truncate font-medium">
                      ISBN: {book.isbn}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 h-6 text-[10px] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors font-medium"
                        onClick={() => handleEdit(book)}
                      >
                        <Pencil className="h-2.5 w-2.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 h-6 text-[10px] text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors font-medium"
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

        {/* Quick View Dialog */}
        <Dialog open={!!viewingBook} onOpenChange={(open) => !open && setViewingBook(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 gradient-text">
                {viewingBook?.title}
              </DialogTitle>
              <DialogDescription className="text-base font-medium">
                by {viewingBook?.author}
              </DialogDescription>
            </DialogHeader>
            
            {viewingBook && (
              <div className="space-y-6 py-4">
                {/* Book Cover */}
                {viewingBook.cover_image && (
                  <div className="aspect-[3/4] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={viewingBook.cover_image} 
                      alt={viewingBook.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Book Details */}
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        ISBN
                      </Label>
                      <p className="font-medium">{viewingBook.isbn}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        Category
                      </Label>
                      <p className="font-medium">{viewingBook.category || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Publisher
                      </Label>
                      <p className="font-medium">{viewingBook.publisher || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Year
                      </Label>
                      <p className="font-medium">{viewingBook.published_year || 'N/A'}</p>
                    </div>
                  </div>

                  {viewingBook.location && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Location
                      </Label>
                      <p className="font-medium">{viewingBook.location}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Total Copies</Label>
                      <p className="font-bold text-2xl text-blue-600">{viewingBook.quantity}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Available</Label>
                      <p className="font-bold text-2xl text-green-600">{viewingBook.available_quantity}</p>
                    </div>
                  </div>

                  {viewingBook.description && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <p className=" text-sm leading-relaxed text-muted-foreground">{viewingBook.description}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleEdit(viewingBook)
                      setViewingBook(null)
                    }}
                    className="text-[#fffff] flex-1 gap-2 bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc]"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Book
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewingBook(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add/Edit Book Dialog */}
        <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#9770FF] to-[#0033FF] flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingBook 
                  ? 'Update the book information below.'
                  : 'Fill in the details to add a new book to your library.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {/* Cover Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Book Cover</Label>
                {previewImage ? (
                  <div className="relative aspect-[3/4] w-full max-w-[180px] mx-auto">
                    <img 
                      src={previewImage} 
                      alt="Book cover preview"
                      className="w-full h-full object-cover rounded-lg border-2 shadow-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-[#9770FF] hover:bg-purple-50/50 transition-all cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-3 text-[#9770FF]" />
                    <Label htmlFor="cover-upload" className="cursor-pointer">
                      <span className="ml-24 text-sm font-semibold text-[#9770FF] hover:underline">
                        Click to upload cover image
                      </span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG (max 5MB)
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
                <Label htmlFor="title" className="text-sm font-semibold">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter book title"
                  className="h-10 border-2 focus:border-[#9770FF]"
                  required
                  disabled={isSaving || isFetchingISBN}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="text-sm font-semibold">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Enter author name"
                  className="h-10 border-2 focus:border-[#9770FF]"
                  required
                  disabled={isSaving || isFetchingISBN}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="isbn" className="text-sm font-semibold">ISBN *</Label>
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="ISBN number"
                    className="h-10 border-2 focus:border-[#9770FF]"
                    required
                    disabled={isSaving || isFetchingISBN}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-semibold">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="h-10 border-2 focus:border-[#9770FF]"
                    required
                    disabled={isSaving || isFetchingISBN}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Fiction, Science, History"
                  className="h-10 border-2 focus:border-[#9770FF]"
                  disabled={isSaving || isFetchingISBN}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="publisher" className="text-sm font-semibold">Publisher</Label>
                  <Input
                    id="publisher"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="Publisher name"
                    className="h-10 border-2 focus:border-[#9770FF]"
                    disabled={isSaving || isFetchingISBN}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="published_year" className="text-sm font-semibold">Year</Label>
                  <Input
                    id="published_year"
                    type="number"
                    min="1000"
                    max="2100"
                    value={formData.published_year}
                    onChange={(e) => setFormData({ ...formData, published_year: e.target.value })}
                    placeholder="YYYY"
                    className="h-10 border-2 focus:border-[#9770FF]"
                    disabled={isSaving || isFetchingISBN}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Shelf A3, Room 101"
                  className="h-10 border-2 focus:border-[#9770FF]"
                  disabled={isSaving || isFetchingISBN}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the book..."
                  className="w-full min-h-[80px] p-3 text-sm border-2 rounded-md focus:border-[#9770FF] focus:outline-none transition-colors auto-resize bg-transparent"
                  disabled={isSaving || isFetchingISBN}
                  rows={3}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="gap-2 h-10 border-2"
                  disabled={isSaving || isFetchingISBN}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="text-[#fffff] gap-2 h-10 bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc] shadow-lg"
                  disabled={isSaving || isFetchingISBN}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {editingBook ? 'Update Book' : 'Add Book'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* QR Scanner Modal */}
        {showScanner && (
          <QRCodeScanner
            onScan={handleISBNScan}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteBook} onOpenChange={(open) => !open && setDeleteBook(null)}>
          <AlertDialogContent className="sm:max-w-[450px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                This will permanently delete <span className="font-semibold text-foreground">"{deleteBook?.title}"</span> from your library. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-10">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-red-600 text-white hover:bg-red-700 h-10 shadow-lg"
              >
                Delete Book
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
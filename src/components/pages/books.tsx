import { useState } from 'react'

interface Book {
  id: number
  title: string
  author: string
  isbn: string
  quantity: number
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    quantity: 1,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newBook: Book = {
      id: Date.now(),
      ...formData,
    }
    setBooks([...books, newBook])
    setFormData({ title: '', author: '', isbn: '', quantity: 1 })
    setIsFormOpen(false)
  }

  const handleDelete = (id: number) => {
    setBooks(books.filter(book => book.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Books</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Book
        </button>
      </div>

      {/* Add Book Form */}
      {isFormOpen && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Book</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ISBN</label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Books Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Title</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Author</th>
              <th className="px-6 py-3 text-left text-sm font-medium">ISBN</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Quantity</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No books found. Add your first book!
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.id} className="border-t border-border">
                  <td className="px-6 py-4">{book.title}</td>
                  <td className="px-6 py-4">{book.author}</td>
                  <td className="px-6 py-4">{book.isbn}</td>
                  <td className="px-6 py-4">{book.quantity}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
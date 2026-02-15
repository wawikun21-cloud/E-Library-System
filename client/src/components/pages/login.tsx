import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, User, AlertCircle } from 'lucide-react'
import { authService } from '@/services/api'

interface LoginPageProps {
  onLogin: (userData: any) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when component mounts (after logout)
  useEffect(() => {
    setUsername('')
    setPassword('')
    setError('')
    setIsLoading(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Call the login API (now returns JWT token)
      const response = await authService.login(username, password)
      
      if (response.success && response.token) {
        // Token and user data are already stored in authService.login
        // Just call the onLogin callback with user data
        onLogin(response.user)
      } else {
        setError(response.message || 'Login failed')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Gradient - Light Mode Only */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F2E6EE] via-[#FFCCF3] to-[#0033FF]">
          {/* Animated gradient orbs for depth */}
          <div className="absolute top-0 -left-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"
               style={{ background: 'linear-gradient(135deg, #9770FF 0%, #FFCCF3 100%)' }}></div>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"
               style={{ background: 'linear-gradient(135deg, #0033FF 0%, #0D33FF 100%)' }}></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"
               style={{ background: 'linear-gradient(135deg, #9770FF 0%, #0033FF 100%)' }}></div>
        </div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          {/* Logo */}
          <div className="flex justify-center">
           <img className='w-30 m-0 p-0' src="/Lexora-logo.svg" alt="Lexora Logo" />
          </div>
          
          <div>
            <CardDescription className="text-base mt-2">
              Sign in to Lexora Library System
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

          {/* Username Field */}
            <div className="relative mt-6">
              <Input
                id="username"
                type="text"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-white peer pt-4 pb-2 border-gray-300"
                required
                autoComplete="username"
                disabled={isLoading}
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 peer-focus:top-4 transition-all duration-200" />
              <Label 
                htmlFor="username" 
                className="absolute left-10 top-1/2 -translate-y-1/2 text-base text-gray-500 bg-white px-1 transition-all duration-200 pointer-events-none peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600"
              >
                Username
              </Label>
            </div>

           {/* Password Field */}
              <div className="relative mt-6">
                <Input
                  id="password"
                  type="password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white peer pt-4 pb-2 border-gray-300"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 peer-focus:top-4 transition-all duration-200" />
                <Label 
                  htmlFor="password" 
                  className="absolute left-10 top-1/2 -translate-y-1/2 text-base text-gray-500 bg-white px-1 transition-all duration-200 pointer-events-none peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600"
                >
                  Password
                </Label>
              </div>

            {/* Login Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#2B4C7E] to-[#1f437a] hover:from-[#1f437a] hover:to-[#2B4C7E]" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
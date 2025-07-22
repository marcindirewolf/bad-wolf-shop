'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Package, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        })

        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('user_token', data.token)
          localStorage.setItem('user_data', JSON.stringify(data.user))
          
          alert('Login successful!')
          router.push('/')
        } else {
          const error = await response.json()
          alert(error.error || 'Login failed')
        }
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match')
          setLoading(false)
          return
        }

        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name
          })
        })

        if (response.ok) {
          const data = await response.json()
          alert('Registration successful! You can now login.')
          setIsLogin(true)
          setFormData({ email: formData.email, password: '', confirmPassword: '', name: '' })
        } else {
          const error = await response.json()
          alert(error.error || 'Registration failed')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Back to Store Link */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Package className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">Bad-Wolf®</span>
            </div>
            <CardTitle>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Sign in to access your account and order history'
                : 'Join the Bad-Wolf® community for exclusive benefits'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required={!isLogin}
                  />
                </div>
              )}
              
              {isLogin && (
                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading 
                  ? (isLogin ? 'Signing In...' : 'Creating Account...') 
                  : (isLogin ? 'Sign In' : 'Create Account')
                }
              </Button>
            </form>
            
            <Separator />
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setFormData({ email: '', password: '', confirmPassword: '', name: '' })
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
            
            {!isLogin && (
              <div className="text-xs text-muted-foreground text-center space-y-2">
                <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium text-foreground mb-1">Join & Get:</p>
                  <ul className="text-left space-y-1">
                    <li>• Loyalty points on every purchase</li>
                    <li>• Order tracking & history</li>
                    <li>• Exclusive member offers</li>
                    <li>• Fast checkout experience</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Demo credentials for testing */}
        <Card className="mt-4 bg-muted/50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Demo Accounts:</strong><br />
              Customer: customer@test.com / password123<br />
              Admin Panel: <Link href="/admin" className="text-primary hover:underline">admin@badwolf.com / badwolf2025</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import * as api from "../services/api";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const success = await api.login(email, password);
      if (success) {
        onLogin();
      } else {
        alert("Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Glassmorphism Card - Wider card with better spacing */}
      <Card 
        className="w-full max-w-2xl h-[720px] relative z-10 border-0 shadow-2xl p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <CardHeader className="text-center pb-6 pt-10">
          <CardTitle className="text-4xl font-bold text-white mb-3">Welcome</CardTitle>
          <CardDescription className="text-gray-200 text-base">
            Sign in to Restaurant POS
          </CardDescription>
        </CardHeader>
        <CardContent className="px-20 pb-14 pt-4 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required  
                className="h-14 bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:border-white/50 focus:ring-white/50 text-base"
                style={{
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)'
                }}
              />
            </div>
            
            <div className="space-y-3">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
                className="h-14 bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:border-white/50 focus:ring-white/50 text-base"
                style={{
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)'
                }}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all mt-8 text-white"
              style={{
                backgroundColor: '#6D9773'
              }}
            >
              LOGIN
            </Button>

            <div className="flex items-center justify-between text-sm pt-4">
              <button
                type="button"
                className="transition-colors font-medium"
                style={{ color: '#FFBA00' }}
                onClick={() => console.log("Forgot password clicked")}
              >
                Forgot Password ?
              </button>
              <button
                type="button"
                className="transition-colors font-medium"
                style={{ color: '#FFBA00' }}
                onClick={() => console.log("Sign up clicked")}
              >
                Sign Up
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
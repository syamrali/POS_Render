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
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Glassmorphism Card */}
      <Card 
        className="w-full max-w-md relative z-10 border-0 shadow-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <CardHeader className="text-center pb-2 pt-8">
          <CardTitle className="text-3xl font-bold text-white mb-2">Welcome</CardTitle>
          <CardDescription className="text-gray-200">
            Sign in to Restaurant POS
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
                className="h-12 bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:border-white/50 focus:ring-white/50"
                style={{
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)'
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
                className="h-12 bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:border-white/50 focus:ring-white/50"
                style={{
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)'
                }}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all"
            >
              LOGIN
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors font-medium"
                onClick={() => console.log("Forgot password clicked")}
              >
                Forgot Password ?
              </button>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors font-medium"
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

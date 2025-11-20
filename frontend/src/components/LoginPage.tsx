import React, { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
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
    // Updated to match the application's exact color scheme
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <ShoppingCart className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Restaurant POS</CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            Point of Sale System
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
                className="h-11 border-slate-300 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
                className="h-11 border-slate-300 focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked: any) => setRememberMe(checked === true)}
                  className="border-slate-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <Label
                  htmlFor="remember"
                  className="cursor-pointer text-sm text-slate-600"
                >
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-purple-600 hover:text-purple-700 transition-colors font-medium"
                onClick={() => console.log("Forgot password clicked")}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-base font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Sign In
            </Button>

            <div className="text-center mt-4">
              <span className="text-slate-600 text-sm">Don't have an account? </span>
              <button
                type="button"
                className="text-sm text-purple-600 hover:text-purple-700 transition-colors font-medium"
                onClick={() => console.log("Sign up clicked")}
              >
                Sign up
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

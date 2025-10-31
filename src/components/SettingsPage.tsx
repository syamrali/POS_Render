import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Store, User, Bell, CreditCard, FileText, Receipt } from "lucide-react";
import { useRestaurant } from "../contexts/RestaurantContext";
import * as api from "../services/api";

export function SettingsPage() {
  const { kotConfig, updateKotConfig, billConfig, updateBillConfig } = useRestaurant();
  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [taxRate, setTaxRate] = useState("5");
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Available printers list
  const availablePrinters = [
    "Default Printer",
    "Thermal Printer 1",
    "Thermal Printer 2",
    "Network Printer",
    "USB Printer"
  ];

  // Load restaurant settings from API on component mount
  useEffect(() => {
    loadRestaurantSettings();
  }, []);

  const loadRestaurantSettings = async () => {
    try {
      const settings = await api.getRestaurantSettings();
      setRestaurantName(settings.restaurantName);
      setAddress(settings.address || "");
      setPhone(settings.phone || "");
      setEmail(settings.email || "");
      setCurrency(settings.currency);
      setTaxRate(settings.taxRate.toString());
    } catch (error) {
      console.error("Error loading restaurant settings:", error);
    }
  };

  const handleSaveRestaurantSettings = async () => {
    try {
      await api.updateRestaurantSettings({
        restaurantName,
        address,
        phone,
        email,
        currency,
        taxRate: parseFloat(taxRate),
      });
      alert("Restaurant settings saved successfully!");
    } catch (error) {
      console.error("Error saving restaurant settings:", error);
      alert("Failed to save restaurant settings. Please try again.");
    }
  };

  const handleSave = () => {
    alert("Settings saved successfully!");
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-gray-900 mb-2">Settings</h2>
        <p className="text-muted-foreground">Manage your restaurant and system preferences</p>
      </div>

      <Tabs defaultValue="restaurant" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="restaurant">
            <Store className="size-4 mr-2" />
            Restaurant
          </TabsTrigger>
          <TabsTrigger value="kot">
            <FileText className="size-4 mr-2" />
            KOT
          </TabsTrigger>
          <TabsTrigger value="bill">
            <Receipt className="size-4 mr-2" />
            Bill
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="size-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="size-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="size-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* KOT Configuration */}
        <TabsContent value="kot">
          <Card>
            <CardHeader>
              <CardTitle>KOT Configuration</CardTitle>
              <CardDescription>
                Configure Kitchen Order Ticket printing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Print by Department</Label>
                  <p className="text-muted-foreground">
                    Print separate KOT for each department (Kitchen, Bar, etc.)
                  </p>
                </div>
                <Switch
                  checked={kotConfig.printByDepartment}
                  onCheckedChange={(checked) => updateKotConfig({ ...kotConfig, printByDepartment: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="kot-copies">Number of KOT Copies</Label>
                <p className="text-muted-foreground mb-2">
                  How many copies of each KOT should be printed
                </p>
                <Select 
                  value={kotConfig.numberOfCopies.toString()} 
                  onValueChange={(value) => updateKotConfig({ ...kotConfig, numberOfCopies: parseInt(value) })}
                >
                  <SelectTrigger id="kot-copies">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 copy</SelectItem>
                    <SelectItem value="2">2 copies</SelectItem>
                    <SelectItem value="3">3 copies</SelectItem>
                    <SelectItem value="4">4 copies</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="kot-printer">Select Printer</Label>
                <p className="text-muted-foreground mb-2">
                  Choose the printer for kitchen order tickets
                </p>
                <Select 
                  value={kotConfig.selectedPrinter || "none"} 
                  onValueChange={(value) => updateKotConfig({ ...kotConfig, selectedPrinter: value === "none" ? null : value })}
                >
                  <SelectTrigger id="kot-printer">
                    <SelectValue placeholder="Select printer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availablePrinters.map((printer) => (
                      <SelectItem key={printer} value={printer}>
                        {printer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-900 mb-2">Current Settings:</p>
                <ul className="text-blue-700 space-y-1">
                  <li>• Department-wise printing: {kotConfig.printByDepartment ? 'Enabled' : 'Disabled'}</li>
                  <li>• Copies per KOT: {kotConfig.numberOfCopies}</li>
                  <li>• Selected Printer: {kotConfig.selectedPrinter || 'None'}</li>
                </ul>
              </div>

              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Save KOT Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bill Configuration */}
        <TabsContent value="bill">
          <Card>
            <CardHeader>
              <CardTitle>Bill Configuration</CardTitle>
              <CardDescription>
                Configure automatic bill printing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-print for Dine-In</Label>
                  <p className="text-muted-foreground">
                    Automatically print bill after order is placed for dine-in
                  </p>
                </div>
                <Switch
                  checked={billConfig.autoPrintDineIn}
                  onCheckedChange={(checked) => updateBillConfig({ ...billConfig, autoPrintDineIn: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-print for Takeaway</Label>
                  <p className="text-muted-foreground">
                    Automatically print bill after order is placed for takeaway
                  </p>
                </div>
                <Switch
                  checked={billConfig.autoPrintTakeaway}
                  onCheckedChange={(checked) => updateBillConfig({ ...billConfig, autoPrintTakeaway: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="bill-printer">Select Printer</Label>
                <p className="text-muted-foreground mb-2">
                  Choose the printer for customer bills
                </p>
                <Select 
                  value={billConfig.selectedPrinter || "none"} 
                  onValueChange={(value) => updateBillConfig({ ...billConfig, selectedPrinter: value === "none" ? null : value })}
                >
                  <SelectTrigger id="bill-printer">
                    <SelectValue placeholder="Select printer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availablePrinters.map((printer) => (
                      <SelectItem key={printer} value={printer}>
                        {printer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-900 mb-2">Current Settings:</p>
                <ul className="text-green-700 space-y-1">
                  <li>• Dine-In auto-print: {billConfig.autoPrintDineIn ? 'Enabled' : 'Disabled'}</li>
                  <li>• Takeaway auto-print: {billConfig.autoPrintTakeaway ? 'Enabled' : 'Disabled'}</li>
                  <li>• Selected Printer: {billConfig.selectedPrinter || 'None'}</li>
                </ul>
              </div>

              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Save Bill Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restaurant Settings */}
        <TabsContent value="restaurant">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Information</CardTitle>
              <CardDescription>
                Update your restaurant details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="restaurant-name">Restaurant Name</Label>
                <Input
                  id="restaurant-name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <Separator />

              <Button 
                onClick={handleSaveRestaurantSettings}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account information and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-gray-900">Change Password</h4>
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                  />
                </div>
              </div>

              <Separator />

              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Update Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-muted-foreground">
                    Receive notifications about new orders
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Alerts</Label>
                  <p className="text-muted-foreground">
                    Play sound when new orders arrive
                  </p>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-muted-foreground">
                    Receive daily summary emails
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-muted-foreground">
                    Get notified when inventory is low
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-gray-900 mb-1">Professional Plan</h4>
                    <p className="text-muted-foreground">
                      Unlimited tables and orders
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    Active
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-purple-600">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-gray-900">Payment Method</h4>
                <div className="p-4 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <CreditCard className="size-5 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-900">•••• •••• •••• 4242</p>
                      <p className="text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="outline">Change</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-gray-900">Billing History</h4>
                <div className="space-y-2">
                  {[
                    { date: "Oct 1, 2025", amount: "$49.00", status: "Paid" },
                    { date: "Sep 1, 2025", amount: "$49.00", status: "Paid" },
                    { date: "Aug 1, 2025", amount: "$49.00", status: "Paid" },
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-gray-900">{invoice.date}</p>
                        <p className="text-muted-foreground">{invoice.amount}</p>
                      </div>
                      <Badge variant="secondary" className="text-green-700 bg-green-50">
                        {invoice.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
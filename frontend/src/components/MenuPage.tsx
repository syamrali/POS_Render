import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Edit, Trash2, Download, Upload, FileSpreadsheet, ShoppingCart } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import * as api from "../services/api";
import { useRestaurant } from "../contexts/RestaurantContext";

interface MenuItem {
  id: string;
  name: string;
  productCode: string;
  price: number;
  category: string;
  department: string;
  description: string;
}

interface Department {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

export function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    productCode: "",
    price: "",
    category: "",
    department: "",
    description: "",
  });

  const navigate = useNavigate();
  const { addToOrder } = useRestaurant();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, categoriesData, departmentsData] = await Promise.all([
        api.getMenuItems(),
        api.getCategories(),
        api.getDepartments(),
      ]);
      
      setMenuItems(itemsData);
      setCategories(categoriesData);
      setDepartments(departmentsData);
      
      if (categoriesData.length > 0 && departmentsData.length > 0) {
        setFormData(prev => ({
          ...prev,
          category: categoriesData[0].name,
          department: departmentsData[0].name,
        }));
      }
    } catch (error) {
      console.error("Error loading menu data:", error);
      alert("Failed to load menu data. Please refresh the page.");
    }
  };

  const filteredItems = selectedCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "", 
      productCode: "",
      price: "", 
      category: categories[0]?.name || "", 
      department: departments[0]?.name || "",
      description: "" 
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      productCode: item.productCode,
      price: item.price.toString(),
      category: item.category,
      department: item.department,
      description: item.description,
    });
    setDialogOpen(true);
  };

  const handleDelete = (item: MenuItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await api.deleteMenuItem(itemToDelete.id);
        setMenuItems(prev => prev.filter(i => i.id !== itemToDelete.id));
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } catch (error) {
        console.error("Error deleting menu item:", error);
        alert("Failed to delete menu item. Please try again.");
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.productCode || !formData.price) {
      alert("Please fill in all required fields");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      alert("Please enter a valid price");
      return;
    }

    try {
      if (editingItem) {
        const updatedItem = await api.updateMenuItem(editingItem.id, {
          name: formData.name, 
          productCode: formData.productCode,
          price,
          category: formData.category, 
          department: formData.department,
          description: formData.description 
        });
        setMenuItems(prev =>
          prev.map(item =>
            item.id === editingItem.id ? updatedItem : item
          )
        );
      } else {
        const newItem = await api.createMenuItem({
          name: formData.name,
          productCode: formData.productCode,
          price,
          category: formData.category,
          department: formData.department,
          description: formData.description,
        });
        setMenuItems(prev => [...prev, newItem]);
      }

      setDialogOpen(false);
      setFormData({ name: "", productCode: "", price: "", category: categories[0]?.name || "", department: departments[0]?.name || "", description: "" });
    } catch (error: any) {
      console.error("Error saving menu item:", error);
      const errorMsg = error?.response?.data?.error || error?.message || "";
      if (errorMsg.includes('Product code already exists') || errorMsg.includes('already exists')) {
        alert("Product code already exists. Please use a unique product code.");
      } else {
        alert("Failed to save menu item. Please try again.");
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await api.downloadMenuTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menu_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Failed to download template. Please try again.");
    }
  };

  const handleExportData = async () => {
    try {
      const blob = await api.exportMenuData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menu_data_export.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await api.importMenuData(file);
      
      if (result.success) {
        await loadData();
        
        let message = `Import completed successfully!\n\n`;
        message += `✅ Categories added: ${result.stats.categories_added}\n`;
        message += `✅ Departments added: ${result.stats.departments_added}\n`;
        message += `✅ Menu items added: ${result.stats.items_added}`;
        
        if (result.stats.errors && result.stats.errors.length > 0) {
          message += '\n\nWarning - Errors occurred:\n' + result.stats.errors.join('\n');
        }
        
        alert(message);
        setImportDialogOpen(false);
      } else {
        alert("Import failed. Please check the file format and try again.");
      }
    } catch (error) {
      console.error("Error importing file:", error);
      alert("Failed to import file. Please check the file format and try again.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddToOrder = (item: MenuItem) => {
    addToOrder(item);
    navigate("/orders");
  };

  const categoryStats = categories.map(cat => ({
    name: cat.name,
    count: menuItems.filter(item => item.category === cat.name).length,
  }));

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Menu Items</h2>
            <p className="text-muted-foreground">Manage your restaurant menu items</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              onClick={() => setImportDialogOpen(true)}
              className="text-white transition-all"
              style={{ backgroundColor: '#6D9773' }}
              onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#5A7F61'}
              onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#6D9773'}
            >
              <FileSpreadsheet className="size-4 mr-2" />
              Bulk Import
            </Button>
            <Button
              onClick={handleExportData}
              className="text-white transition-all"
              style={{ backgroundColor: '#6D9773' }}
              onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#5A7F61'}
              onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#6D9773'}
            >
              <Download className="size-4 mr-2" />
              Export Data
            </Button>
          </div>
          <Button
            onClick={handleAdd}
            className="text-white transition-all"
            style={{ backgroundColor: '#6D9773' }}
            onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#5A7F61'}
            onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#6D9773'}
          >
            <Plus className="size-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Stats - Removed category cards as requested */}

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === "All" ? "default" : "outline"}
            onClick={() => setSelectedCategory("All")}
            className={selectedCategory === "All" ? "text-white" : ""}
            style={selectedCategory === "All" 
              ? { backgroundColor: '#000000' }
              : { borderColor: '#6D9773', color: '#000000' }
            }
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.name ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.name)}
              className={selectedCategory === category.name ? "text-white" : ""}
              style={selectedCategory === category.name 
                ? { backgroundColor: '#000000' }
                : { borderColor: '#6D9773', color: '#000000' }
              }
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900">{item.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Code: {item.productCode}</p>
                    <div className="flex gap-1 mt-2">
                      <Badge variant="secondary" className="text-xs" style={{ color: '#000000' }}>{item.category}</Badge>
                      <Badge variant="outline" className="text-xs" style={{ color: '#000000' }}>{item.department}</Badge>
                    </div>
                  </div>
                  <p className="text-lg font-bold" style={{ color: '#0C3B2E' }}>₹{item.price}</p>
                </div>
                <CardDescription className="mt-2">{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1"
                  >
                    <Edit className="size-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item)}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="size-3 mr-1" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAddToOrder(item)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-2 border-red-500"
                  >
                    <ShoppingCart className="size-3 mr-1" />
                    Add to Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update menu item information" : "Enter the details for the new menu item"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productCode">Product Code *</Label>
              <Input
                id="productCode"
                placeholder="e.g., CB001, PIZZA01"
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Classic Burger"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value }) }>
                <SelectTrigger id="department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value }) }>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the item"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="text-white transition-all"
              style={{ backgroundColor: '#6D9773' }}
              onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#5A7F61'}
              onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#6D9773'}
            >
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Import Menu Data</DialogTitle>
            <DialogDescription>
              Import menu items, categories, and departments from an Excel file
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">📋 How to use:</p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Download the Excel template</li>
                <li>Fill in your data in the template</li>
                <li>Upload the completed file</li>
              </ol>
            </div>

            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="w-full hover:bg-green-50"
              style={{ borderColor: '#6D9773', color: '#0C3B2E' }}
            >
              <Download className="size-4 mr-2" />
              Download Excel Template
            </Button>

            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFile}
                className="hidden"
                id="file-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="w-full text-white transition-all"
                style={{ backgroundColor: '#6D9773' }}
                onMouseEnter={(e: any) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#5A7F61')}
                onMouseLeave={(e: any) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#6D9773')}
              >
                {importing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Upload className="size-4 mr-2" />
                    Upload Filled Excel File
                  </>
                )}
              </Button>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-900">
                ⚠️ Note: Categories and Departments must be created before menu items that reference them.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}